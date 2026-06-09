# Upgrade An Existing DeerFlow Vizual Integration

This guide is for a DeerFlow codebase that already integrated an older Vizual
prototype and now needs to move to the current native-core runtime.

The goal is not to make DeerFlow special. The goal is to make DeerFlow a normal
host of Vizual: the agent decides when to use visuals, the backend exposes one
stable presentation tool, and the frontend renders only accepted, visible Vizual
surfaces.

## Upgrade Scope

Update these parts together:

- frontend dependency: install the current `vizual` package
- backend tool: keep one `present_vizual_ui` tool and return repairable results
- agent prompt/tool schema: expose the current native catalog, not an old list
- chat renderer: extract accepted Vizual tool calls and render with `VizualRenderer`
- action bridge: send useful UI actions back to the agent as internal messages
- readiness tests: verify real browser rendering, not only `ok: true`

Do not update only the frontend or only the prompt. A half-upgraded DeerFlow can
look successful while the actual chart is missing, stale, or silently replaced by
a Mermaid fallback.

## 1. Upgrade The Package

For a normal project:

```bash
pnpm --dir frontend add vizual@latest
pnpm --dir frontend install
```

For local validation before publishing:

```bash
pnpm --dir frontend add "vizual@file:/absolute/path/to/vizual"
pnpm --dir frontend install
```

Then restart every process that loaded the old package. This matters for
DeerFlow because LangGraph, Next.js/Turbopack, and any gateway process can keep
old tool code or old bundled frontend code in memory.

## 2. Backend Tool Contract

Keep a single tool named `present_vizual_ui`. It should accept natural agent
outputs in these shapes:

- Vizual native payloads
- A2UI messages
- AG-UI events or event streams
- `vizual.native.v1` create-surface envelopes
- previous repair attempts from the agent

If the DeerFlow backend is TypeScript, use the SDK directly:

```ts
import { createVizualAgentToolDefinition, renderVizualAgentInput } from 'vizual'

export const presentVizualUiTool = createVizualAgentToolDefinition({
  includeCatalogManifest: true,
})

export async function presentVizualUi(args: {
  input: unknown
  surfaceId?: string
  fallbackText?: string
  display?: unknown
}) {
  const result = renderVizualAgentInput(args.input, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })

  return {
    schema: 'vizual.agent.tool_result.v1',
    ok: result.ok,
    toolName: 'present_vizual_ui',
    surfaceId: result.envelope.surfaceId,
    envelope: result.envelope,
    issues: result.preview.issues,
    renderEvidence: result.preview.summary,
    repairInstructions: result.ok
      ? []
      : ['Rebuild the payload with supported Vizual native components.'],
  }
}
```

If the DeerFlow backend is Python, do not maintain a separate handwritten catalog
forever. Either call a small Node bridge that uses `renderVizualAgentInput`, or
generate/assert the backend catalog from the installed `vizual` package in CI.

Minimum Python-side requirements:

- `SUPPORTED_NATIVE_COMPONENTS` must match the current Vizual catalog.
- Supported charts include Radar, Waterfall, Boxplot, Histogram, XMR, Sankey,
  Funnel, Heatmap, Calendar, Sparkline, Dumbbell, Bubble, Combo, and Mermaid.
- Removed components must stay unsupported: DocView, GridLayout, SplitLayout,
  FreeformHtml, HeroLayout, Modal, Kanban, AuditLog.
- `ok: false` must include issues and repair instructions so the agent can
  repair the payload.
- Failed internal attempts must remain in tool history for the agent, but should
  not become final user-visible Vizual cards.

## 3. Agent Prompt And Tool Catalog

Regenerate or refresh the prompt/tool schema from the current Vizual catalog.
Do not copy an old component whitelist into the prompt.

Prompt rules to keep:

- The user asks naturally. The agent decides whether a visual helps.
- Use Vizual for analysis, comparison, diagnosis, dashboards, forms, timelines,
  org charts, and Gantt views when they improve understanding.
- Do not force Vizual for text-only requests.
- Do not force explicit webpage, HTML, React, game, SVG, or custom app requests
  into Vizual native.
- Mermaid is for diagrams and flows. Do not use Mermaid `xychart` as a fallback
  for native charts that Vizual supports, such as BarChart or RadarChart.
- UI actions must be useful host events, not fake dispatch, approval, or ticket
  creation.

Known old failure signal:

```text
RadarChart is not in the native component catalog, using Mermaid instead.
```

That means the live backend tool or prompt is stale, even if the disk code looks
updated.

## 4. Frontend Chat Renderer

The frontend should not infer Vizual success from assistant prose or from
`ok: true` alone. Extract accepted Vizual presentations from chat history and
render only the accepted ones.

Recommended adapter flow:

```tsx
import {
  VizualRenderer,
  extractVizualPresentations,
  selectVisibleVizualPresentations,
  previewVizualNativeInput,
  buildVizualActionMessage,
} from 'vizual'

const presentations = selectVisibleVizualPresentations(
  extractVizualPresentations(messages),
)

for (const presentation of presentations) {
  const preview = previewVizualNativeInput(presentation.input, {
    surfaceId: presentation.surfaceId,
  })

  if (!preview.ok) {
    // Development telemetry only. Do not show a failed internal card as the
    // final user-visible answer unless the final answer truly cannot render.
    continue
  }

  render(
    <VizualRenderer
      spec={preview.spec}
      onAction={(name, params, currentState) => {
        sendInternalUserMessage(
          buildVizualActionMessage({
            presentation,
            action: name,
            params,
            currentState,
          }),
        )
      }}
      onRenderReceipt={(receipt) => {
        recordVizualRenderReceipt(presentation.surfaceId, receipt)
      }}
    />,
  )
}
```

For DeerFlow, this usually means updating files like:

- `frontend/src/components/workspace/messages/message-list.tsx`
- `frontend/src/components/workspace/messages/vizual-inline.tsx`
- any message utility that hides internal action messages

Frontend rules:

- Do not show failed repair attempts as normal assistant cards.
- Do not show "rendered" until there is both an accepted tool result and a
  mounted renderer.
- Treat render evidence errors as real signals:
  - `expected-chart-host-missing`
  - `expected-chart-canvas-missing`
  - `expected-chart-not-painted`
- Keep action messages internal so the conversation stays natural.

## 5. Action Bridge

Vizual emits events. DeerFlow decides what they mean.

Supported action families:

- `submitForm`
- `applyFilter`
- `drillDown`
- `selectLocation`
- `updatePlan`

For each action, convert the event into an internal follow-up message to the
agent. Do not pretend Vizual itself saved data, approved a workflow, dispatched a
ticket, or called a bank system.

## 6. Readiness Gate

Add or update a readiness script that fails closed. It should check:

- `present_vizual_ui` is registered in built-in tools.
- Backend supported components match the installed Vizual catalog.
- All supported chart families pass the backend tool.
- Removed components fail with stable unsupported-component errors.
- Frontend imports `VizualRenderer` from `vizual`.
- Frontend extracts accepted tool calls instead of rendering every attempt.
- Internal failed attempts are not shown as final user-visible cards.

Run:

```bash
pnpm --dir frontend typecheck
backend/.venv/bin/python -m pytest backend/tests/test_present_vizual_ui_tool.py
python scripts/check-vizual-deerflow-ready.py
```

Use the actual command names from the DeerFlow repo if they differ.

## 7. Browser Acceptance

JSON tests are necessary but not enough. Validate in a real browser, preferably
in the same DeerFlow page users will use.

Use fresh natural-language tasks, not scripts that already know the answer:

1. Bank branch operations dashboard: multiple branches, rankings, KPI cards,
   charts, and risk notes.
2. Branch capability comparison: request a radar-style comparison against a
   benchmark; verify native `RadarChart`, not Mermaid `xychart`.
3. Queue or staffing what-if: use FormBuilder or controls only if changing
   parameters is useful.
4. Project progress: ask for a Gantt-style view.
5. Organization or responsibility diagnosis: ask for an org chart or timeline.
6. A2UI payload path: confirm it normalizes into the same native surface.
7. AG-UI event path: confirm stream/event input renders.
8. Text-only negative case: confirm no Vizual card appears.
9. Explicit HTML/webpage negative case: confirm DeerFlow follows the user
   creation request instead of forcing native core.
10. Removed component case: send an old HeroLayout/GridLayout payload and
   confirm the failure is stable and not shown as a successful user card.

For each case, capture:

- thread id
- first `present_vizual_ui` tool result
- final visible browser state
- render receipt errors, if any
- whether the user saw a failed internal card

## Common Failure Diagnoses

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "RadarChart not in catalog" then Mermaid fallback | stale backend process or old component whitelist | restart LangGraph/gateway and regenerate backend catalog |
| "Rendered" badge but blank chart | frontend trusts `ok: true` without render evidence | wire `VizualRenderer` receipt and visible checks |
| `expected-chart-not-painted` | chart component mounted without painted canvas | update chart renderer and verify ECharts container sizing |
| HeroLayout still appears | old prompt/tool schema/package is still live | remove old component from prompt, tool schema, backend aliases, and rebuild |
| `Cannot read properties of undefined` in `VizualInline` | frontend passed malformed raw input to renderer | preview/normalize first, render only `preview.spec` |
| User sees an error card followed by a correct card | failed repair attempt is rendered as public UI | filter to accepted presentations only |

## Done Criteria

The upgrade is done when:

- no old removed components are exported, prompted, or accepted
- supported chart families render natively in DeerFlow
- failed internal Vizual attempts are hidden from the user-facing transcript
- browser acceptance covers data analysis, A2UI, AG-UI, interactions, negative
  cases, and removed-component failures
- services have been restarted from the upgraded code, not just patched on disk

[中文版本](DEERFLOW-UPGRADE.zh-CN.md)
