# Vizual Core — Integration Guide

> The single authoritative guide for wiring Vizual Core into an AI‑agent chatbot
> frontend. It supersedes the scattered install/render snippets previously spread
> across `README`, `GETTING-STARTED`, `AI-INTEGRATION`, and `CHATBOT-INTEGRATION`.

Vizual Core gives an AI agent a **non‑text expression and interaction channel**:
the agent emits a structured payload, Vizual normalizes it into one native
catalog, validates that it is *really* renderable, and the host renders a chart /
dashboard / form / timeline / KPI surface inline in the chat — or falls back to
text when it cannot.

It is **not** a page/HTML builder. Explicit "build me a web page / landing page /
HTML/React app" requests should go through the host's normal creation path, not
Vizual.

---

## 1. Install & build outputs

```bash
npm install vizual react react-dom
```

`npm run build` produces four consumable surfaces:

| Output | File | Use |
| --- | --- | --- |
| **ESM** | `dist/index.mjs` | `import` from a React/bundler host (primary) |
| **CJS** | `dist/index.js` | `require` from a CJS host |
| **Types** | `dist/index.d.ts` | TypeScript |
| **Standalone IIFE** | `dist/vizual.standalone.js` | `<script>` tag → `window.Vizual` for **non‑React / any** frontend (bundles React + ECharts) |

`react` / `react-dom` are peer deps for the npm builds; the standalone bundle
includes them.

---

## 2. Choose an integration path

| Path | When | Entry |
| --- | --- | --- |
| **npm import** | React host with a bundler | `import { ... } from 'vizual'` |
| **Standalone `<script>`** | Non‑React host, plain page, or quick embed | `window.Vizual` |
| **MCP server** | Agent runtime that speaks MCP | `npx vizual-core-mcp` (see §7) |
| **Agent skill** | Drop‑in prompt/skill assets | `skills/vizual/` |

---

## 3. The three input protocols (all unified)

Every input normalizes through `normalizeVizualNativeInput` / `VizualNativeCore`
into one catalog + `VizualSpec`:

1. **Native Vizual** — a `{ root, elements }` spec, a single semantic record
   (`{ type:'bar', data:[...] }`), a bare component array, or a semantic
   dashboard (`{ type:'dashboard', kpis, charts, tables }`).
2. **A2UI** — `createSurface` / `updateComponents` / `updateDataModel` messages.
3. **AG‑UI** — agent↔frontend event streams (via `VizualFusionRuntime`).

The agent does not need to know which protocol the host prefers — pick one and
the same components render.

---

## 4. The `ok` contract (read this)

```ts
import { previewVizualNativeInput } from 'vizual'

const preview = previewVizualNativeInput(agentInput, { requireRenderable: true })
// preview.ok      → true ONLY if the surface is really renderable
// preview.spec    → the normalized VizualSpec to render
// preview.issues  → diagnostics (errors block ok; warnings don't)
```

`ok: true` means a **real, visible** surface — not merely "the JSON parsed".
The validator rejects (`ok:false`) every one of these:

- raw HTML / React / ECharts / Chart.js / old opaque UI DSL input
- unsupported / removed components (`DocView`, `GridLayout`, `Kanban`, …)
- a spec with no root, empty elements, a missing root element, or cyclic children
- a chart whose data field bindings don't resolve to real rows
- **a chart with an empty `data` array, a `KpiDashboard` with no `metrics`, a
  `DataTable` with no rows/columns, an empty `Timeline`/`OrgChart`/`GanttChart`/
  `FormBuilder`, or a root made only of empty layout containers** — i.e. anything
  that would render blank.

While **streaming** a partial surface, pass `{ requireRenderable: false }`; the
empty‑surface conditions become warnings so partials aren't rejected mid‑stream.

Thousands‑separated numbers (`"1,234"`) in chart data are coerced to real
numbers automatically, so pre‑formatted agent output renders correctly instead
of as an all‑zero chart.

### Dialect repair (any‑model compliance)

Weaker models often emit a *recognizable foreign dialect* instead of native
input. `previewVizualNativeInput` / `validateVizualNativeInput` (and the MCP
tools) first run `repairAgentInput`, which **faithfully and losslessly** maps:

- an **ECharts `option`** object (`{ xAxis, yAxis, series }`) → native
  `BarChart` / `LineChart` / `PieChart` / `ScatterChart` / `ComboChart`,
- a **Chart.js config** (`{ type, data: { labels, datasets } }`) → the matching
  native chart,
- a **stringified JSON** payload → the parsed object.

Repair only fires when the mapping is unambiguous and preserves the original
data — it never invents rows, labels, series, axes, or thresholds. When a shape
is ambiguous or its data can't be recovered (radar/gauge/graph ECharts,
non‑numeric series, raw HTML/React), the input is left untouched and the
validator rejects it loudly. Each applied repair surfaces as an **info‑level**
`vizual.repair.*` issue; it is a safety net, not the recommended path. Call
`repairAgentInput(input)` directly if you want to inspect or log repairs.

### Self‑correction (`fix` on every error)

Every `error` issue now carries a `fix` string: one concrete next action. The
MCP `present_vizual_ui` response additionally returns a top‑level `fixes` array
(de‑duplicated, ordered) and a `repairs` array. A host running an agent‑repair
loop should feed `fixes` back to the model and re‑call until `ok: true`, so even
a weak model converges in one or two rounds instead of guessing.

---

## 5. Expose the tool to your agent

```ts
import { createVizualAgentToolDefinition, createVizualAgentToolResult } from 'vizual'

const tool = createVizualAgentToolDefinition({ includeCatalogManifest: true })
// register `tool` with your LLM framework (OpenAI tools / LangChain / MCP / …)

// when the model calls the tool:
const result = createVizualAgentToolResult(toolArgs.input, {
  surfaceId: toolArgs.surfaceId,
  fallbackText: toolArgs.fallbackText,
})
// return result as the tool result; failed results include issues + fixes
```

---

## 6. Render in the frontend

### React host

```tsx
import { VizualRenderer, VizualArtifactView } from 'vizual'

<VizualRenderer spec={preview.spec} />          // one‑shot
<VizualArtifactView artifact={artifact} />       // persisted, patchable
```

### Standalone / non‑React host

```html
<script src="/vizual.standalone.js"></script>
<script>
  const preview = window.Vizual.previewVizualNativeInput(agentInput, { requireRenderable: true })
  if (preview.ok) window.Vizual.renderSpec(preview.spec, document.getElementById('surface'))
</script>
```

### Any framework (Vue / Svelte / vanilla / React Native) — the render‑tree seam

The pieces above (repair → preview → `outcome` → spec) are **pure and DOM‑free**.
The bundled renderer is React + ECharts, but you do not have to use it. Convert
the resolved spec into a plain nested tree and map each node `type` to your own
component:

```ts
import { previewVizualNativeInput, toVizualRenderTree } from 'vizual'

const preview = previewVizualNativeInput(agentInput, { requireRenderable: true })
if (preview.ok) {
  const tree = toVizualRenderTree(preview.spec)
  // tree: { id, type: 'BarChart', props: { x, y, data, … }, children: [...] }
  // walk it with your framework's renderer registry — see §12.
}
```

`toVizualRenderTree` resolves `{{data}}` bindings, normalizes component aliases,
and skips cycles/dangling ids, so every node has a canonical `type` and fully
resolved `props`. This is the single seam that lets the same agent output render
on web today and on a native mobile renderer next — see §12.

---

## 7. MCP server

```bash
npm run build          # REQUIRED first — the MCP server lazy‑loads dist/index.mjs
npx vizual-core-mcp    # or: npm run mcp
```

Tools exposed: `present_vizual_ui`, `vizual_catalog`, `vizual_normalize`,
`vizual_validate`, `vizual_preview`.

---

## 8. Extract from chat history + render exactly one thing per turn

Don't hand‑roll `filter(ok)`. Use the adapter, which **re‑runs the native preview**
and gives you a single directive per tool call:

```ts
import {
  extractVizualPresentations,
  selectVisibleVizualPresentations,
  selectVizualFallbackTexts,
} from 'vizual'

const presentations = extractVizualPresentations(messages)

for (const p of presentations) {
  switch (p.outcome) {
    case 'rendered':   /* render <VizualRenderer spec={p.preview.spec} /> */ break
    case 'fallback':   /* show p.fallbackText as a text bubble */            break
    case 'suppressed': /* show nothing (the agent's prose already covers it) */ break
  }
}
```

`outcome` guarantees a host renders **exactly one** of {Vizual surface, fallback
text, nothing} for each turn — never a loader + error + fallback bubble at once.
`p.issues` is for the agent‑repair loop only; never render it as a user bubble.
`selectVizualFallbackTexts(presentations)` returns the fallback strings in one call.

---

## 8b. The complete integration contract (interactivity) — READ THIS

Rendering a surface is **not** a complete integration. There are three tiers,
and a host must satisfy all three for an interactive surface to actually work:

| Tier | Means | How |
| --- | --- | --- |
| **Renderable** | validates, renders, charts actually paint | `previewVizualNativeInput` + `VizualRenderer`/`renderSpec` |
| **Interactive** | sliders/inputs update the surface in place | bound state + `recomputeSpec` (in‑playground live preview) |
| **Agent‑roundtrip** | submit / filter / drill‑down become the next agent turn | `onAction` + `createVizualHostBridge` → your platform's send |

> `ok: true` proves **Renderable** only. It does **not** prove Interactive or
> Agent‑roundtrip. A host that only calls `present_vizual_ui` and renders
> `VizualRenderer` will show a form whose Submit button does nothing.

### Wire the agent roundtrip (the part most hosts miss)

Vizual auto‑wires a FormBuilder's submit, a Button's action, and a chart's
drill‑down to named actions during normalization — so the events fire. But the
host must give those events somewhere to go. Pass `onAction` (one capture point
for every interaction) and let the bridge turn roundtrip actions into the next
agent turn:

```ts
import { createVizualHostBridge } from 'vizual'

const bridge = createVizualHostBridge({
  surfaceId,
  toolCallId,
  // The ONLY thing a host implements. Wire it to your platform's "new user turn":
  //   DeerFlow:  (msg) => thread.submit(msg)
  //   ChatGPT:   (msg) => sendMessage(msg)
  //   custom:    (msg) => startAgentRun(msg)
  sendToAgent: (message, action) => host.submitUserTurn(message),
})

<VizualRenderer spec={preview.spec} surfaceId={surfaceId} onAction={bridge.onAction} />
// standalone:
window.Vizual.renderSpec(preview.spec, el, { surfaceId, onAction: bridge.onAction })
```

The bridge builds the agent message (`buildVizualActionMessage`) and only
round‑trips meaningful actions (`submitForm`, `applyFilter`, `drillDown`,
`selectLocation`, `updatePlan`, and custom actions). Pure value edits stay local.

Custom actions need no local handler: when `onAction` is wired, every action the
spec declares (a Button's `action: "runScenario"`, an `element.on` binding) is
guaranteed a dispatch path into `onAction` — the renderer synthesizes a fallback
handler for declared actions that have no registered one, so a custom action can
never silently die with "No handler registered". Use
`collectDeclaredVizualActions(spec)` to inspect which actions a surface declares.
On the agent side, hide the injected turn from the transcript with
`isInternalVizualActionMessage`, run the agent, and it sees the submitted data as
the latest user input — a new run is produced. That closes the loop.

### Action lifecycle ownership

Vizual Core owns the contract surface: it normalizes actions, validates that a
surface declares real actions, emits `onAction` events, and provides helpers such
as `buildVizualActionMessage` and `createVizualHostBridge`.

The host product owns the user-visible action lifecycle. A production chat host
must:

- show visible feedback within 200 ms after a submit/filter/drill-down click
- keep a pending state while the agent/tool run is still active
- return a `Promise` from the action handler so pending, success, and failure can
  be tied to the real round trip
- show a long-running notice for slow model/tool runs instead of silently doing
  nothing
- show an error/retry state if the handler rejects
- prevent duplicate submissions while the same action is pending, or make queued
  duplicate behavior explicit
- log `surfaceId`, action name, params summary, status, duration, and error
  evidence for debugging

The agent owns the follow-up answer. After the host sends the internal action
message, the agent should either update the surface or answer visibly in text.
Agents must not claim that a submit/filter/drill-down was handled unless the host
actually routed the action back into a new turn.

Do not hide the internal Vizual action message without also showing a visible
pending indicator to the human user. Hidden follow-up messages keep the transcript
clean, but the user still needs to know that the click was accepted and the agent
is working.

Minimal host pattern:

```tsx
const [actionStatus, setActionStatus] = useState<null | {
  state: 'pending' | 'done' | 'error'
  action: string
  actionId: string
  message?: string
}>(null)

const bridge = createVizualHostBridge({
  surfaceId,
  toolCallId,
  sendToAgent: async (message) => {
    await host.submitUserTurn(message)
  },
})

async function onVizualAction(action) {
  const actionId = crypto.randomUUID()
  setActionStatus({ state: 'pending', action: action.name, actionId })

  try {
    await bridge.onAction(action)
    setActionStatus({ state: 'done', action: action.name, actionId })
  } catch (error) {
    setActionStatus({
      state: 'error',
      action: action.name,
      actionId,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

return (
  <>
    <VizualRenderer spec={preview.spec} surfaceId={surfaceId} onAction={onVizualAction} />
    {actionStatus ? (
      <div role="status" aria-live="polite" data-vizual-action-status={actionStatus.state}>
        {actionStatus.state === 'pending' ? 'Submitted. Waiting for the agent...' : null}
        {actionStatus.state === 'done' ? 'Agent handled this interaction.' : null}
        {actionStatus.state === 'error' ? `Action failed: ${actionStatus.message}` : null}
      </div>
    ) : null}
  </>
)
```

### In‑playground live preview (no agent)

For a control that should update the surface immediately (slider filters a chart,
toggle switches a series) without a round trip, give the renderer a
`recomputeSpec(state)` that re‑derives the spec from live control state:

```ts
const makeSpec = (state) => ({
  // Use FormBuilder with showSubmit:false for controls that update in place.
  // Example control props: { showSubmit: false, value: { $bindState: '/controls' }, fields: [...] }
  /* …chart filtered by state.controls.min… */
})
<VizualRenderer spec={makeSpec(initial)} recomputeSpec={makeSpec} initialState={initial} />
```

Bound controls write to state, `recomputeSpec` re‑derives, and only the surface
re‑renders — the agent is never involved. Set `FormBuilder.props.showSubmit` to
`false` for these live-control panels; otherwise the user sees a submit button
that suggests an agent roundtrip.

### Verify the contract

`summarizeVizualInteractivity(preview.spec)` returns `{ interactive,
agentRoundtrip, deadControls, actions }`. In acceptance tests, assert
`agentRoundtrip === true` for surfaces that collect input, and `deadControls`
is empty (a "dead control" collects input that goes nowhere). The browser
harness `validation/interaction-acceptance.html` exercises all three tiers.

---

## 9. Follow‑up edits, actions, artifacts

```ts
import { createHostRuntime, createMemoryArtifactStore } from 'vizual'

const runtime = createHostRuntime({ store: createMemoryArtifactStore() })
const artifact = runtime.renderMessageArtifact(messageId, preview.spec)
runtime.updateArtifact(artifact.id, [{ type: 'filterData', /* targetId from artifact.targetMap */ }])
```

- Follow‑up "change this chart" produces a **new** AI bubble by default; don't
  overwrite the old one. Use typed patches (`changeChartType`, `filterData`,
  `limitData`, `updateElementProps`, `replaceSpec`) with `targetId` from the
  artifact `targetMap` — never guess JSON paths.
- Interaction actions (`submitForm`, `applyFilter`, `drillDown`, `selectLocation`,
  `updatePlan`) round‑trip via `buildVizualActionMessage` and are hidden from the
  visible transcript with `isInternalVizualActionMessage`. Only add interactive
  controls when the host actually exposes a matching capability.
- Copy, export, download, share, and persistence controls are host product
  shell features. Keep them outside `VizualRenderer`; do not model them as
  Vizual native actions.

---

## 10. Fallback‑to‑text rule

When `outcome !== 'rendered'`, never show a broken/empty card. Show the agent's
prose or `fallbackText`, and feed `issues` back to the agent so it can repair.
A Vizual failure must never silently report success and must never drag the text
answer down.

---

## 11. Test your integration

```bash
npm test          # unit + normalization + ok‑contract
npm run typecheck
npm run build
```

Then do a **real browser** pass (don't trust JSON alone): render a data
dashboard, a multi‑series chart, a KPI board, a form, a timeline/org chart, a
plain‑text question (no surface), an explicit "make me an HTML page" request (no
surface), utility export/copy/download controls, and a deliberately broken input
(fallback). Confirm at the end‑user level that what `ok` claims matches what is
actually visible.
`validation/review-acceptance.html` is a minimal harness for this.

---

## 12. Framework‑agnostic & mobile (any chatbot frontend)

The agent‑facing contract and the host data pipeline are intentionally split
from rendering:

| Layer | Depends on | Reuse on any frontend? |
| --- | --- | --- |
| Protocol normalize / repair / validate / preview | nothing (pure TS) | ✅ |
| `extractVizualPresentations` + `outcome` | nothing (pure TS) | ✅ |
| `toVizualRenderTree` (resolved node tree) | nothing (pure TS) | ✅ |
| `VizualRenderer` / charts | React DOM + ECharts | web only |

So a non‑React host (Vue, Svelte, SolidJS, plain JS, **React Native**) reuses
everything except the last row, and supplies its own renderer registry:

```ts
import {
  extractVizualPresentations,
  toVizualRenderTree,
  flattenVizualRenderTree,
} from 'vizual'

// 1. Decide what to show for each turn (pure).
for (const p of extractVizualPresentations(messages)) {
  if (p.outcome !== 'rendered') { /* fallback text or nothing — see §8 */ continue }

  // 2. Get a plain nested tree (pure, DOM‑free).
  const tree = toVizualRenderTree(p.preview!.spec)

  // 3. (optional) Verify your registry covers every component this surface needs.
  const needed = new Set(flattenVizualRenderTree(tree).map(n => n.type))
  const missing = [...needed].filter(t => !MyRegistry[t])
  if (missing.length) { /* degrade to p.fallbackText; report the gap */ }

  // 4. Render with YOUR components.
  renderNode(tree) // recurse: MyRegistry[node.type](node.props, node.children)
}
```

### Writing a renderer registry

A registry is just `Record<componentType, YourComponent>`. Each entry receives
the resolved `props` (charts get `{ x, y, data }` etc.; `KpiDashboard` gets
`{ metrics }`; `DataTable` gets `{ data, columns }`) and the already‑built child
nodes. Map the ~45 catalog component names (see `vizual_catalog` or §3) to your
platform's widgets. You only need the components your product actually uses; for
the rest, fall back to `p.fallbackText` and surface the gap.

### React Native path (mobile app)

This is the target the contract is built for. A React Native host:

1. Runs the **pure** pipeline (steps 1–3 above) unchanged — no polyfills needed.
2. Maps layout/content nodes (`Column`/`Row`/`Card`/`Text`/`Markdown`/`List`/
   `DataTable`/`KpiDashboard`/inputs) to RN primitives or your design system.
3. Maps chart nodes to a native chart library (e.g. `react-native-svg`‑based
   charts, Victory Native, or a Skia renderer) using the resolved
   `{ x, y, data }` props — or, for an MVP, renders charts in a `WebView` that
   loads `vizual.standalone.js` and calls `window.Vizual.renderSpec`.

The bundled web `VizualRenderer`/ECharts code is **not** imported on native, so
the DOM/ECharts dependency never reaches the mobile bundle. The agent output,
validation contract, repair layer, and `outcome` directive are identical across
web and mobile — only the leaf renderer differs.

> Status: this repo ships the cross‑platform contract, the render‑tree seam, and
> the web reference renderer. A packaged React Native renderer registry is a
> follow‑up; the seam above is what it plugs into.
