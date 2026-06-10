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

---

## 5. Expose the tool to your agent

```ts
import { createVizualAgentToolDefinition, renderVizualAgentInput } from 'vizual'

const tool = createVizualAgentToolDefinition({ includeCatalogManifest: true })
// register `tool` with your LLM framework (OpenAI tools / LangChain / MCP / …)

// when the model calls the tool:
const result = renderVizualAgentInput(toolArgs.input, {
  surfaceId: toolArgs.surfaceId,
  fallbackText: toolArgs.fallbackText,
})
// result.ok, result.envelope, result.preview  — return result.envelope to the model
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
surface), and a deliberately broken input (fallback). Confirm at the end‑user
level that what `ok` claims matches what is actually visible.
`validation/review-acceptance.html` is a minimal harness for this.
