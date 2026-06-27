# AI Integration Guide

> **Authoritative reference:** [INTEGRATION.md](INTEGRATION.md) is the single
> end-to-end guide. See §4 for the **dialect repair** + `fix`/`fixes`
> self-correction protocol (any-model compliance), and §12 for the
> **framework-agnostic / React Native** render-tree seam.

Vizual is a native visual runtime for AI agent products. Users still ask normal
questions in natural language. When the agent decides that text alone is not
clear enough, it can insert an inline visual or interactive UI block into the
answer. The host frontend renders the agent payload as charts, KPI cards,
tables, timelines, org charts, Gantt charts, Markdown, forms, and A2UI
primitives.

Vizual is not a keyword router, a page-template library, or a creative gate. The
agent decides whether to use Vizual, where the visual block belongs in the
answer, and which capabilities to combine. Vizual provides the catalog, schema,
validation, rendering, artifacts, and action transport.

## Product Boundary

- **Natural conversation visualization**: use Vizual for analysis, explanation,
  planning, comparison, diagnosis, and decision support when trends,
  comparisons, distributions, relationships, flows, structured input, filters,
  or what-if exploration are clearer as UI than as paragraphs.
- **Text-only negative cases**: do not generate UI for short facts, ordinary
  explanations, light rewrites, command explanations, casual chat, or explicit
  "text only" requests.
- **Explicit creation requests**: if the user explicitly asks for a webpage,
  landing page, game, React/HTML/CSS, SVG, code artifact, or custom app, follow
  that creation path. Do not force the request into Vizual Native unless the
  user asks to embed a Vizual surface.
- **Useful interaction only**: buttons, forms, filters, drill-downs, and plan
  updates must help the user understand, change state, or invoke a capability
  the host really provides. Do not add controls only to demonstrate that controls
  exist.
- **Optional catalog gaps**: agents or SDKs may record optional catalog-gap
  metadata when the native catalog cannot express a useful idea. Gap metadata
  must not change rendering or block the answer.

## Two-Layer Integration

### Agent Layer

Choose at least one explicit capability entry:

- **Skill**: install `skills/vizual/` so the agent knows when and how to produce
  Vizual surfaces.
- **MCP**: run the Vizual MCP server so the agent can discover the catalog,
  validate inputs, and preview payloads before presenting UI.
- **SDK tool schema**: expose `createVizualAgentToolDefinition()` as a host tool
  such as `present_vizual_ui`.

`skills/vizual/prompt.md` is a legacy fallback for agent platforms that cannot
install skills, connect MCP, or expose SDK tool definitions. Cold-start
acceptance should not depend on hidden prompt injection.

The native catalog is the source of truth for components, actions, data binding,
theme tokens, artifact behavior, and protocol compatibility. Skills, MCP, SDK
tool schemas, and docs should explain how to discover and use that catalog, not
maintain a second handwritten catalog.

### Host Layer

The host frontend should support:

- rendering one-shot JSON specs
- saving `VizualArtifact` objects in chat history or product storage
- patching existing artifacts from follow-up turns through `targetMap`
- bridging FormBuilder state for liveControl surfaces
- receiving host-visible actions: `submitForm`, `applyFilter`, `drillDown`,
  `selectLocation`, and `updatePlan`
- adding host-shell product actions when needed, such as copy, export,
  download, share, or persistence. These controls sit outside Vizual Core and
  should not be represented as Vizual native actions.

Vizual can be integrated into SaaS chat panels, ChatGPT-like agent products,
DeerFlow-like platforms, or business workbenches. It cannot render inside closed
consumer chat products such as ChatGPT or Claude.ai unless that platform
integrates the Vizual runtime.

For a concrete step-by-step retrofit of an existing chatbot, read
[CHATBOT-INTEGRATION.md](CHATBOT-INTEGRATION.md).
For an existing DeerFlow integration that used an older Vizual prototype, read
[DEERFLOW-UPGRADE.md](DEERFLOW-UPGRADE.md).

## Render A Normal Spec

```tsx
import { VizualRenderer } from 'vizual'

function AgentVisual({ spec }) {
  return <VizualRenderer spec={spec} />
}
```

`VizualRenderer` is the recommended entry point. It wraps the json-render
providers, Vizual registry, built-in action handlers, `$computed`,
`$bindState`, and visibility context. Host apps should not wire the low-level
renderer manually unless they are intentionally replacing the integration layer.

Common agent surfaces combine host prose with semantic components such as KPI
cards, charts, DataTable, Markdown, and FormBuilder. Use `Column`, `Row`, and
`Container` for light composition. Page-level design belongs to the host product,
not native core.

## Persist Follow-Up Artifacts

When a user might later say "change this to a line chart", "only show East
China", or "export this as PDF", save a `VizualArtifact` rather than only saving
raw JSON.

```tsx
import { createHostRuntime, createMemoryArtifactStore, VizualArtifactView } from 'vizual'
import { createRoot } from 'react-dom/client'

const runtime = createHostRuntime({
  store: createMemoryArtifactStore(),
  renderArtifact: async (artifact, container) => {
    const root = createRoot(container)
    root.render(<VizualArtifactView artifact={artifact} />)
    return { artifact, root }
  },
})

const artifact = await runtime.renderMessageArtifact({
  conversationId,
  messageId,
  prompt: userText,
  spec: aiSpec,
  container,
})
```

Rules:

- Use `targetMap`; do not guess JSON paths.
- Follow-up edits should normally create a new assistant bubble while preserving
  the previous rendered answer as history.
- `mode: 'replace'` is for temporary previews, not durable chat history.

## SDK Tool Definition

```ts
import { createVizualAgentToolDefinition, createVizualAgentToolResult } from 'vizual'

const tool = createVizualAgentToolDefinition({ includeCatalogManifest: true })

async function presentVizualUi(args) {
  return createVizualAgentToolResult(args.input, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })
}
```

The tool should return the SDK result as-is. `createVizualAgentToolResult()`
returns `ok:true` only when Core can preview a real renderable surface, and
returns `issues` plus de-duplicated `fixes` when the agent needs to repair its
payload. Hosts should not show failed internal repair attempts as final
user-visible cards unless the final answer truly cannot be rendered.

Chart payloads should use `props.data` plus typed `props.encoding` by default.
Use `props.measures` for multiple numeric series or `ComboChart` layers. Keep
categorical grouping in `encoding.color`, `seriesBy`, `colorBy`, or `groupBy`;
do not teach agents to use a string `series` prop as the default path.

## liveControl

liveControl is not just static JSON. The host needs to bridge FormBuilder state
to preview rendering: controls bind to state, and `makeSpec(state)` generates
the visual preview.

Use liveControl only when parameter adjustment helps exploration or decision
making. Do not add sliders, buttons, or forms as decoration.

## Actions

| Action | Purpose |
| --- | --- |
| `submitForm` | Send structured input from FormBuilder or input primitives to the host agent |
| `applyFilter` | Apply a visible filter to host context or UI state |
| `drillDown` | Ask for deeper analysis on a chart point, table row, or entity |
| `selectLocation` | Select a branch, region, store, or location-like entity |
| `updatePlan` | Return a visible plan/status update to the host |

Actions are events, not business promises. Vizual does not save, approve,
dispatch, create tickets, write databases, or call external systems by itself.

### Action Lifecycle Responsibility

Vizual Core is responsible for action schema, normalization, validation, event
emission, and helper messages. The host application is responsible for the
visible lifecycle after a user clicks or submits:

- show pending feedback within 200 ms
- keep the pending state until the host action handler's `Promise` resolves or
  rejects
- show a long-running notice when the model/tool run is slow
- show error/retry UI when the handler fails
- suppress duplicate submissions while the same action is pending, or make the
  queue explicit
- log `surfaceId`, action name, params summary, outcome, duration, and error
  evidence

Hidden internal action messages are fine, but silent actions are not. If a host
hides the follow-up message from the transcript, it must still show the human a
visible status line such as "Submitted. Waiting for the agent..." until the
agent turn completes.

## Current Agent-Facing Catalog

See [COMPONENTS.md](COMPONENTS.md). Native core does not keep separate
runtime-only page-layout components.

Removed native-core components should produce stable unsupported-component
errors and should not appear in new agent output.

## Acceptance

Real acceptance must happen in a browser, not only against JSON:

- natural-language tasks for data analysis, concept interaction, forms,
  project/organization/timeline cases, and dashboards
- A2UI, AG-UI, and native operations normalize to the same catalog
- FormBuilder submit events reach the host action log
- FormBuilder/Button/chart actions show pending feedback, settle on success or
  error, and record lifecycle evidence
- local playground controls update the visible surface without unnecessary
  agent round-trips
- utility buttons export/copy/download only when the host browser supports them
- text-only requests do not force UI
- explicit webpage/HTML/React requests do not get forced into native core
- removed components return stable unsupported errors

[中文版本](AI-INTEGRATION.zh-CN.md)
