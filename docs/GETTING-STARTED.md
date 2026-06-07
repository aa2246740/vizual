# Getting Started

This guide shows how to install Vizual, render an agent-generated surface, and
connect the runtime to an agent host.

## Requirements

- Node.js >= 18
- React >= 18

## Install

```bash
npm install vizual
npm install react react-dom
```

Vizual uses ECharts for charts, json-render for the component registry/runtime,
Zod for schemas, Mermaid for diagrams, and browser export utilities for rendered
artifacts.

## Render An Agent Output

The agent returns a Vizual spec and the host renders it with `VizualRenderer`.

```tsx
import { VizualRenderer } from 'vizual'

const spec = {
  root: 'main',
  elements: {
    main: {
      type: 'BarChart',
      props: {
        type: 'bar',
        title: 'Sales Trend',
        x: 'month',
        y: 'sales',
        data: [
          { month: 'Jan', sales: 100 },
          { month: 'Feb', sales: 150 },
        ],
      },
      children: [],
    },
  },
}

export function App() {
  return <VizualRenderer spec={spec} />
}
```

`VizualRenderer` wraps the required json-render providers, Vizual registry,
built-in actions, `$computed`, `$bindState`, and visibility context.

## Connect An Agent

Vizual is designed for AI agent products. The agent decides when a visual or
interactive surface helps. The host renders the surface, stores artifacts,
handles follow-up patches, exports data/visuals, and receives action events.

Recommended integration options:

- install `skills/vizual/` as an agent skill
- run the Vizual MCP server so the agent can discover and validate the catalog
- expose `createVizualAgentToolDefinition()` as a host tool such as `present_vizual_ui`

See [AI-INTEGRATION.md](AI-INTEGRATION.md) for the full contract.

## Host Runtime

Use the host runtime when a visual should survive in chat history and support
follow-up edits.

```tsx
import {
  createHostRuntime,
  createMemoryArtifactStore,
  VizualArtifactView,
  type VizualArtifactPatch,
} from 'vizual'
import { createRoot } from 'react-dom/client'

const runtime = createHostRuntime({
  store: createMemoryArtifactStore(),
  renderArtifact: (artifact, container) => {
    const root = createRoot(container)
    root.render(<VizualArtifactView artifact={artifact} />)
    return { artifact, root }
  },
})

const artifact = await runtime.renderMessageArtifact({
  messageId,
  conversationId,
  spec: aiSpec,
  container,
})

const patch: VizualArtifactPatch[] = [
  { type: 'changeChartType', targetId: 'element:chart', chartType: 'LineChart' },
  { type: 'filterData', targetId: 'element:chart', field: 'region', values: 'East' },
]

const updated = await runtime.updateArtifact(artifact.id, patch)
await runtime.renderArtifact(updated.id, container)
```

## FormBuilder And Actions

`FormBuilder` collects structured input and submits it to the host agent through
`submitForm`. Vizual does not save, approve, dispatch, create tickets, or write
external systems by itself.

Built-in host-visible actions:

- `submitForm`
- `applyFilter`
- `drillDown`
- `selectLocation`
- `updatePlan`

## liveControl

liveControl is not only static JSON. The host binds FormBuilder state, then
regenerates the preview with `makeSpec(state)`.

Do not shallow-merge a `/controls` state change into the `controls` object
itself. That produces nested state such as `{ controls: {...} }` and the preview
will not update correctly.

## Theme

Themes are usually set by the host product or agent platform. Users normally do
not need to specify a theme in natural conversation.

```tsx
import { tc, tcss } from 'vizual'

<div style={{ background: tcss('--rk-bg-primary'), color: tcss('--rk-text-primary') }} />

const option = { textStyle: { color: tc('--rk-text-primary') } }
```

## Test

```bash
npm test
npm run typecheck
npm run build
```

Browser acceptance must inspect the real rendered UI, not only JSON. Agent
acceptance should use natural-language tasks that cover data analysis, concept
interaction, form submit-back, A2UI/AG-UI normalization, text-only negatives,
and explicit webpage/HTML negatives.

[中文版本](GETTING-STARTED.zh-CN.md)
