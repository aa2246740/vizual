# Integrate Vizual Into An Existing Agent Chatbot

[中文版本](CHATBOT-INTEGRATION.zh-CN.md)

This guide is for an existing agent chatbot that already has:

- a backend that can expose tools/functions to the agent
- a message stream or stored chat history containing assistant messages, tool calls, and tool results
- a React frontend, or another frontend where you can mount a React component

Vizual does not replace your agent framework. It adds one host-rendered tool:
`present_vizual_ui`. The agent decides when to call it. Your host validates the
payload, stores the envelope in chat history, renders it inline, and sends user
actions back to the agent when needed.

## What The Core Can And Cannot Do

Vizual core can:

- normalize Vizual native input, A2UI-style messages, and AG-UI-style events
- validate whether an input can produce a renderable native surface
- preview the final renderable spec before the frontend mounts it
- render charts, KPI cards, tables, Markdown, diagrams, timelines, forms, and controls
- emit host-visible actions such as `submitForm`, `applyFilter`, and `drillDown`
- track local state changes from input controls

Vizual core cannot:

- inject UI into a closed chatbot page by itself
- decide your product's business workflow, permissions, storage, approval, or dispatch logic
- call your databases or external systems unless your host action handler does it
- make an agent use Vizual correctly if the agent cannot call tools or follow integration instructions

If your chatbot cannot expose tools to the agent and cannot customize frontend
message rendering, Vizual can still generate payloads through MCP or a skill, but
the host will not be able to show them as inline UI.

## Architecture

```text
User message
  -> Agent
  -> tool call: present_vizual_ui({ input, surfaceId, fallbackText, display })
  -> Host backend validates and returns a Vizual envelope
  -> Chat history stores assistant text + tool call + tool result
  -> Host frontend extracts the Vizual envelope
  -> VizualRenderer renders the inline surface
  -> User clicks/submits a control
  -> Host sends an internal follow-up message or event back to the agent
```

## Step 1. Install Vizual In The Frontend

```bash
npm install vizual react react-dom
```

For pnpm:

```bash
pnpm add vizual react react-dom
```

## Step 2. Add A Backend Tool

Expose a tool named `present_vizual_ui` to your agent. The tool should accept a
single object with `input` and optional display metadata.

```ts
import {
  createVizualAgentToolDefinition,
  renderVizualAgentInput,
} from 'vizual'

export const presentVizualUiToolDefinition =
  createVizualAgentToolDefinition({ includeCatalogManifest: true })

export async function presentVizualUi(args: {
  input: unknown
  surfaceId?: string
  fallbackText?: string
  display?: { title?: string; mode?: 'inline' | 'side-panel' | 'artifact'; persist?: boolean }
}) {
  const result = renderVizualAgentInput(args.input as any, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })

  if (!result.ok) {
    return {
      schema: 'vizual.agent.tool_result.v1',
      ok: false,
      toolName: 'present_vizual_ui',
      surfaceId: result.envelope.surfaceId,
      issues: result.preview.issues,
      repairInstructions: [
        'Rebuild the payload with supported Vizual native components.',
        'Do not pass HTML, React code, ECharts options, Chart.js configs, or natural-language promises as input.',
      ],
      envelope: result.envelope,
    }
  }

  return {
    schema: 'vizual.agent.tool_result.v1',
    ok: true,
    toolName: 'present_vizual_ui',
    surfaceId: result.envelope.surfaceId,
    fallbackText: result.envelope.fallbackText,
    display: result.envelope.display,
    envelope: result.envelope,
    renderEvidence: result.preview.summary,
  }
}
```

Use your framework's normal tool registration mechanism:

- OpenAI-style tool/function calling: register `presentVizualUiToolDefinition`
- LangChain/LangGraph: wrap `presentVizualUi` as a structured tool
- MCP-first host: run `vizual-core-mcp` and expose a host renderer for the returned envelope

The important part is not the framework. The important part is that the tool
result is stored in chat history and can be found by the frontend.

## Step 3. Teach The Agent The Boundary

Add this to your agent instructions, skill, or tool policy:

```text
You have access to present_vizual_ui, a host-rendered Vizual runtime for inline
visual and interactive UI inside the conversation.

Use it when the user's natural-language request would be clearer as charts,
tables, KPI cards, timelines, diagrams, forms, filters, or useful controls.

Do not use it for short text-only answers.
Do not use it when the user explicitly asks for a webpage, HTML file, React app,
game, SVG, code artifact, or downloadable/openable file. In those cases, follow
the requested artifact path.

Keep normal explanation in assistant text. Put only the structured Vizual input
in the tool call.

If the tool returns ok:false, inspect issues and repair the payload before
claiming the UI is done. Do not show failed internal repair attempts as final
user-visible content.

Use actions only when they are useful and the host can receive them, such as
submitForm, applyFilter, drillDown, selectLocation, and updatePlan.
```

## Step 4. Store Tool Calls And Results

Your chat history should keep enough data for the frontend to reconstruct the
Vizual presentation:

```ts
type ChatMessage =
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content: string
      toolCalls?: Array<{ id: string; name: string; args: unknown }>
    }
  | {
      role: 'tool'
      toolCallId: string
      name: string
      content: unknown
    }
```

Do not reduce a Vizual tool result to plain text. Preserve the `envelope`.

## Step 5. Extract Vizual Presentations On The Frontend

```ts
import {
  extractVizualPresentations,
  selectRenderableVizualPresentations,
} from 'vizual'

const visible = selectRenderableVizualPresentations(
  extractVizualPresentations(messages),
)
```

Do not hand-roll `filter(item => item.ok)`. `ok: true` only means the tool
result claimed success; the SDK selector also requires a successful native
preview and a real renderable spec.

Failed tool attempts are for the agent repair loop. They should not appear as
broken UI cards in the user-visible chat.

## Step 6. Render Inline UI

```tsx
import {
  VizualRenderer,
  previewVizualNativeInput,
  applyVizualStateChanges,
  type VizualStateChange,
} from 'vizual'
import { useMemo, useRef, useState } from 'react'

export function VizualInline({
  presentation,
  sendInternalUserMessage,
}: {
  presentation: {
    input: unknown
    surfaceId?: string
    fallbackText?: string
    display?: { title?: string }
    toolCallId?: string
  }
  sendInternalUserMessage: (text: string) => Promise<void>
}) {
  const [state, setState] = useState<Record<string, unknown>>({})
  const currentState = useRef<Record<string, unknown>>({})

  const preview = useMemo(
    () =>
      previewVizualNativeInput(presentation.input as any, {
        surfaceId: presentation.surfaceId,
        fallbackText: presentation.fallbackText,
      }),
    [presentation],
  )

  if (!preview.ok || !preview.spec) {
    return null
  }

  function onStateChange(changes: VizualStateChange[]) {
    currentState.current = applyVizualStateChanges(currentState.current, changes)
    setState(currentState.current)
  }

  async function returnActionToAgent(name: string, params: Record<string, unknown>) {
    await sendInternalUserMessage(
      [
        'The user triggered an action in a Vizual inline UI. Treat it as the latest user input.',
        '',
        `surfaceId: ${presentation.surfaceId ?? preview.surfaceId ?? '(unknown)'}`,
        `action: ${name}`,
        '',
        'Payload:',
        '```json',
        JSON.stringify(
          {
            source: 'vizual',
            surfaceId: presentation.surfaceId ?? preview.surfaceId,
            toolCallId: presentation.toolCallId,
            action: name,
            params,
            currentState: currentState.current,
          },
          null,
          2,
        ),
        '```',
      ].join('\n'),
    )
  }

  const handlers = {
    submitForm: (params: Record<string, unknown>) => returnActionToAgent('submitForm', params),
    applyFilter: (params: Record<string, unknown>) => returnActionToAgent('applyFilter', params),
    drillDown: (params: Record<string, unknown>) => returnActionToAgent('drillDown', params),
    selectLocation: (params: Record<string, unknown>) => returnActionToAgent('selectLocation', params),
    updatePlan: (params: Record<string, unknown>) => returnActionToAgent('updatePlan', params),
  }

  return (
    <section data-vizual-surface-id={presentation.surfaceId} data-vizual-render-status="visible">
      {presentation.display?.title ? <h3>{presentation.display.title}</h3> : null}
      <VizualRenderer
        spec={preview.spec}
        initialState={state}
        handlers={handlers}
        onStateChange={onStateChange}
      />
    </section>
  )
}
```

Production hosts should also audit the mounted DOM after render. If the preview
claims a chart or controls exist but the DOM is blank, hide the card and log
evidence for debugging.

## Step 7. Render Mixed Assistant Text And Vizual Blocks

Your message renderer should keep assistant prose and Vizual UI in the same
assistant turn:

```tsx
function AssistantMessage({ message, allMessages }) {
  const presentations = selectRenderableVizualPresentations(
    extractVizualPresentations(allMessages),
  ).filter(
    item => message.toolCalls?.some(call => call.id === item.toolCallId),
  )

  return (
    <div className="assistant-message">
      {message.content ? <Markdown>{message.content}</Markdown> : null}
      {presentations.map(item => (
        <VizualInline
          key={item.toolCallId ?? item.surfaceId}
          presentation={item}
          sendInternalUserMessage={sendInternalUserMessage}
        />
      ))}
    </div>
  )
}
```

Do not render all Vizual surfaces in a separate global panel unless your product
intentionally uses that layout. Inline visual proof usually belongs near the
assistant text that explains it.

## Step 8. Hide Internal Action Messages

When a user clicks a Vizual button or submits a form, the host may send an
internal user message back to the agent. Hide those messages from the visible
user transcript:

```ts
function isInternalVizualActionMessage(message: ChatMessage) {
  return (
    message.role === 'user' &&
    message.content.startsWith('The user triggered an action in a Vizual inline UI.') &&
    message.content.includes('surfaceId:') &&
    message.content.includes('action:')
  )
}
```

The agent should see the message. The human user usually should not.

## Step 9. Test The Integration

Do not stop at unit tests. Use a real browser and natural-language tasks.

Run normal project checks:

```bash
npm test
npm run typecheck
npm run build
```

Then test your chatbot with fresh prompts:

1. Data analysis: paste a small table and ask why a metric rose while profit fell.
2. Concept interaction: ask for an adjustable explanation of binary search, queueing, or cash-flow sensitivity.
3. Action roundtrip: click a drill-down/filter/form submit and confirm the agent continues from the returned params.
4. Text-only negative: ask for a short text-only answer and confirm no UI appears.
5. Explicit artifact negative: ask for an `index.html` or React app and confirm the host does not force Vizual.
6. Failure absorption: intentionally cause an unsupported component during development and confirm failed attempts are hidden while the final answer remains useful.

## Minimal Integration Checklist

- The agent can call `present_vizual_ui`.
- The backend returns `ok`, `issues`, and `envelope`.
- Chat history preserves tool calls and tool results.
- The frontend extracts Vizual envelopes from messages.
- The frontend renders only presentations returned by `selectRenderableVizualPresentations`.
- Failed repair attempts do not show as broken cards.
- Assistant text and Vizual UI can appear in the same turn.
- Vizual actions can be sent back to the agent.
- Internal action messages are hidden from the visible transcript.
- Browser testing verifies actual pixels, not just JSON.
