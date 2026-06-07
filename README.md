<div align="center">

# Vizual

**Native visual UI runtime for AI agents.**

Vizual lets an AI agent answer with interactive charts, dashboards, tables,
forms, timelines, diagrams, and other native UI surfaces inside a conversation.
The user keeps talking naturally; the agent decides when a visual or interactive
surface makes the answer clearer.

[![npm version](https://img.shields.io/npm/v/vizual.svg)](https://www.npmjs.com/package/vizual)
[![license](https://img.shields.io/npm/l/vizual.svg)](https://github.com/aa2246740/vizual/blob/main/LICENSE)
[![agent runtime](https://img.shields.io/badge/AI%20agent-native%20visual%20runtime-blue)](docs/AI-INTEGRATION.md)

[中文](README.zh-CN.md) · [Getting Started](docs/GETTING-STARTED.md) · [Agent Integration](docs/AI-INTEGRATION.md) · [Components](docs/COMPONENTS.md)

</div>

## What Is Vizual?

Vizual is a frontend runtime and protocol layer for agent products. It gives AI
agents a safe, structured way to create rich UI inside chat:

- data analysis with charts, KPI cards, evidence tables, and summaries
- concept explanations with diagrams, timelines, and interactive controls
- operational dashboards for branches, stores, products, tickets, projects, and risks
- structured input collection through forms that submit back to the host agent
- persisted artifacts that can be updated, exported, and referenced in follow-up turns
- compatibility with Vizual native payloads, A2UI-style messages, and AG-UI event streams

Vizual is not a page builder, a keyword router, or a replacement for the agent.
It gives the agent a native visual capability and lets the agent decide how to
use it.

## Why It Exists

Plain text is often the wrong interface for agent answers. If the user provides
a dataset and asks "why is profit falling while sales are rising?", a human does
not want only paragraphs. They need trend lines, contribution breakdowns, ranked
tables, and a clear conclusion.

Vizual turns that kind of agent response into a first-class native surface:

```text
User: Why are sales increasing but profit is falling?
Agent: Here is the analysis.
       [Vizual surface: KPI cards + margin trend + channel table + risk notes]
       The main issue is low-price channel mix plus rising ad spend.
```

The visual block is part of the conversation. It is not a separate app, and the
user did not need to ask for "a bar chart component".

## How It Works

1. The host app exposes Vizual as an agent skill, MCP server, or SDK tool.
2. The user talks to the agent normally.
3. The agent decides whether a visual surface would improve the answer.
4. The agent returns a Vizual native payload, an A2UI message, or an AG-UI event stream.
5. Vizual normalizes the input into one native catalog.
6. The host renders the surface in the chat and receives useful action events.

```tsx
import { VizualRenderer } from 'vizual'

const spec = {
  root: 'main',
  elements: {
    main: {
      type: 'Column',
      props: {},
      children: ['summary', 'chart'],
    },
    summary: {
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        metrics: [
          { label: 'Revenue', value: '$1.2M', trend: 'up', trendValue: '+18%' },
          { label: 'Profit', value: '$140K', trend: 'down', trendValue: '-9%' },
        ],
      },
      children: [],
    },
    chart: {
      type: 'LineChart',
      props: {
        type: 'line',
        title: 'Revenue vs Profit',
        x: 'month',
        y: ['revenue', 'profit'],
        data: [
          { month: 'Jan', revenue: 6400, profit: 2400 },
          { month: 'Feb', revenue: 7200, profit: 2500 },
          { month: 'Mar', revenue: 8800, profit: 2700 },
        ],
      },
      children: [],
    },
  },
}

export function AgentVisual() {
  return <VizualRenderer spec={spec} />
}
```

`VizualRenderer` is the recommended React entry point. It wraps the registry,
providers, actions, computed values, state binding, and visibility context needed
to render native Vizual surfaces.

## Core Capabilities

### Native Core

The native core is the stable contract between agents and hosts. It validates,
normalizes, previews, and renders structured visual surfaces. It rejects removed
or unsafe component names instead of silently rendering fake UI.

### Unified Protocol Input

Vizual accepts multiple agent-facing shapes and normalizes them into the same
native model:

- `vizual.native.v1` style native surfaces
- A2UI-style messages and component blocks
- AG-UI event streams
- tool-call envelopes such as `present_vizual_ui`

This means different agent platforms can speak their natural protocol while the
host renders one consistent UI catalog.

### Agent Autonomy

Vizual does not force every answer into UI. The agent should use it when visual
or interactive expression helps, and avoid it for short text-only answers,
explicit webpage/game/HTML creation requests, or situations where the host has
no useful interaction to offer.

### Useful Interaction

Vizual supports host-visible actions such as:

- `submitForm`
- `applyFilter`
- `drillDown`
- `selectLocation`
- `updatePlan`

Actions are events. Vizual itself does not approve, dispatch, save to a business
system, or pretend an integration exists. The host decides what happens after an
event is received.

### Artifacts and Follow-Up Editing

Host apps can persist `VizualArtifact` objects so later turns can modify or
export a previous surface:

```text
User: Change this to a line chart and only show East China.
Agent: [patches the existing Vizual artifact]
```

### Export and Theme

Vizual includes export helpers for rendered visuals and artifact data, plus a
theme system that can be controlled by the host or generated from a Design.md
style document.

## Component Catalog

The current agent-facing catalog includes:

- **Charts**: Bar, Line, Area, Pie, Scatter, Bubble, Boxplot, Histogram,
  Waterfall, XMR, Sankey, Funnel, Heatmap, Calendar, Sparkline, Combo, Dumbbell,
  Radar, Mermaid.
- **Data**: DataTable.
- **Business surfaces**: KpiDashboard, GanttChart, OrgChart, Timeline.
- **Input**: FormBuilder.
- **Content, media, and A2UI primitives**: Markdown, Container, Row, Column,
  Card, Text, Image, Icon, List, Divider, Button, CheckBox, TextField,
  ChoicePicker, Slider, DateTimeInput, Tabs, Video, AudioPlayer.

Removed from native core: DocView, GridLayout, SplitLayout, FreeformHtml, Modal,
Kanban, AuditLog. These are product-level surfaces or unsafe/freeform containers,
not native core primitives.

See [docs/COMPONENTS.md](docs/COMPONENTS.md) for the catalog.

## Install

```bash
npm install vizual
```

Peer dependencies:

```bash
npm install react react-dom
```

## Use In A Host App

```tsx
import { VizualRenderer } from 'vizual'

export function ChatMessageVisual({ spec }) {
  return <VizualRenderer spec={spec} />
}
```

For chat products that need history, patches, and export:

```tsx
import {
  createHostRuntime,
  createMemoryArtifactStore,
  VizualArtifactView,
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
  conversationId,
  messageId,
  spec,
  container,
})
```

## Give Vizual To An Agent

The recommended integration paths are:

1. **Skill**: install `skills/vizual/` into an agent runtime that supports skills.
2. **MCP**: run the Vizual MCP server so an agent can discover the catalog and validate payloads.
3. **SDK tool**: expose `createVizualAgentToolDefinition()` as a host tool such as `present_vizual_ui`.

```ts
import { createVizualAgentToolDefinition, renderVizualAgentInput } from 'vizual'

const tool = createVizualAgentToolDefinition({ includeCatalogManifest: true })

async function presentVizualUi(args) {
  const result = renderVizualAgentInput(args.input, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })

  if (!result.ok) {
    return {
      ok: false,
      errors: result.preview.issues,
      repair: 'Rebuild the payload with supported native Vizual components.',
    }
  }

  return {
    ok: true,
    envelope: result.envelope,
    renderEvidence: result.preview,
  }
}
```

See [docs/AI-INTEGRATION.md](docs/AI-INTEGRATION.md) for the full agent contract.

## When Should An Agent Use Vizual?

Use Vizual when:

- the answer depends on trends, comparisons, rankings, distributions, or flows
- a chart or table is needed to prove the conclusion
- structured user input would be clearer than free-form text
- the user is exploring scenarios or parameters
- the agent needs a persistent artifact that can be updated later

Avoid Vizual when:

- the user asked for a short text answer
- the user explicitly asked to build a webpage, HTML artifact, game, React app, or custom UI
- the interaction would be decorative or fake
- the host cannot receive the action the UI claims to support

## Validation

```bash
npm test
npm run typecheck
npm run build
```

For real agent integration, JSON validation is not enough. Test in a browser with
natural-language tasks and inspect the rendered result visually:

- data analysis with charts and tables
- A2UI and AG-UI normalization
- FormBuilder submit-back
- pure-text negative cases
- explicit webpage/HTML negative cases
- unsupported component errors

## Documentation

- [Getting Started](docs/GETTING-STARTED.md)
- [Agent Integration](docs/AI-INTEGRATION.md)
- [Components](docs/COMPONENTS.md)
- [Chinese README](README.zh-CN.md)
- [中文接入指南](docs/AI-INTEGRATION.zh-CN.md)

## License

MIT
