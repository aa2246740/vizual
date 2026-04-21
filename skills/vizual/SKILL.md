---
name: vizual
version: "1.1.0"
description: >
  Generate structured JSON specs for Vizual's 43 visualization components, or embed them
  directly into any HTML page. Use this skill whenever the user needs ANY kind of visual output
  — charts, dashboards, reports, KPIs, kanban boards, timelines, data tables, forms, annotatable
  documents, or even just "show me the data." This skill is for AI agents (Claude Code, Cursor,
  Windsurf, etc.) that can both generate structured specs AND write arbitrary code. You are not
  limited to Vizual's components — they are your most reliable building blocks for data
  visualization, and you combine them with your full coding ability to exceed any closed
  design tool. Trigger on: charts, graphs, dashboards, reports, metrics, data visualization,
  kanban, timeline, gantt, forms, tables, "visualize this", "show me", "render", "display",
  "make a dashboard", or any request involving data + visuals.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Vizual — Your Visualization Toolkit

You have access to Vizual: 43 pre-built, schema-validated visualization components that render from JSON specs. Combined with your ability to write any code, install packages, and manipulate files, you can produce visual output that exceeds what any closed design tool offers.

## What You Can Do

**Structured rendering** — Output a JSON spec, and Vizual renders it as an interactive chart, dashboard, or document. Every component has a Zod schema — if you follow it, the output will work. No guessing.

**Embed in anything** — Vizual ships as a single `vizual.standalone.js` file (includes React + ECharts). Drop it into any HTML page and call `Vizual.renderSpec(spec, container)`. Works offline, zero dependencies.

**Full freedom** — Vizual handles data visualization. You handle everything else. Write HTML, CSS, React, install npm packages, call APIs — Vizual is one tool in your toolkit, not a constraint.

## Decision Rule

When the user wants visual output, pick the right approach:

| What user needs | Your approach |
|----------------|---------------|
| A chart, graph, or dashboard | Vizual JSON spec → `renderSpec()` |
| A data table, kanban, timeline | Vizual JSON spec → `renderSpec()` |
| A form with validation | Vizual FormBuilder JSON spec |
| A document with annotation | Vizual DocView JSON spec |
| Multiple charts composed together | Vizual multi-element spec with VerticalLayout |
| A chart inside a custom HTML page | Write HTML, embed `vizual.standalone.js`, use `renderSpec()` |
| A slide deck / prototype / animation | Write your own HTML/CSS/JS, embed Vizual charts where needed |
| Something Vizual doesn't cover | Write code freely. Vizual is a tool, not a cage. |

The key insight: use Vizual components for data visualization (they're validated and reliable), write your own code for everything else.

## Output Format

ALWAYS output valid JSON in this structure:

```json
{
  "root": "<element-id>",
  "elements": {
    "<element-id>": {
      "type": "<ComponentName>",
      "props": {
        "type": "<type-literal>",
        ...component-specific props
      },
      "children": []
    }
  }
}
```

Rules:
- `type` in the element definition = **PascalCase component name** (e.g. `BarChart`, `KpiDashboard`)
- `type` inside `props` = **lowercase/snake_case literal** specific to each component (e.g. `"bar"`, `"kpi_dashboard"`)
- Every element needs `children: []` (even if empty)
- Props must match the component's schema — don't invent fields

## Two Usage Modes

### Mode 1: React App (npm)

For users with a React project:

```tsx
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

const spec = { /* your JSON spec */ }

<StateProvider>
  <Renderer spec={spec} registry={registry} />
</StateProvider>
```

### Mode 2: Standalone HTML (any environment)

For any HTML page — no build tools, no npm, works offline:

```html
<script src="./vizual.standalone.js"></script>
<div id="chart"></div>
<script>
  const spec = {
    root: 'main',
    elements: {
      main: {
        type: 'BarChart',
        props: {
          type: 'bar',
          x: 'quarter', y: 'revenue',
          data: [
            { quarter: 'Q1', revenue: 120 },
            { quarter: 'Q2', revenue: 200 }
          ]
        },
        children: []
      }
    }
  }
  Vizual.renderSpec(spec, document.getElementById('chart'))
</script>
```

This mode lets you embed Vizual charts inside custom HTML pages — dashboards, reports, slides, prototypes, anything. You write the surrounding HTML/CSS/JS, and drop in Vizual components for the data visualization parts.

## Component Selection Guide

| User says | Component | type value |
|-----------|-----------|------------|
| "bar chart", "column chart" | BarChart | `bar` |
| "line chart", "trend" | LineChart | `line` |
| "area chart" | AreaChart | `area` |
| "pie chart", "donut" | PieChart | `pie` |
| "scatter plot", "correlation" | ScatterChart | `scatter` |
| "bubble chart" | BubbleChart | `bubble` |
| "box plot", "distribution" | BoxplotChart | `boxplot` |
| "histogram", "frequency" | HistogramChart | `histogram` |
| "waterfall" | WaterfallChart | `waterfall` |
| "control chart", "SPC" | XmrChart | `xmr` |
| "flow", "sankey" | SankeyChart | `sankey` |
| "funnel", "conversion" | FunnelChart | `funnel` |
| "heatmap", "matrix" | HeatmapChart | `heatmap` |
| "calendar heatmap" | CalendarChart | `calendar` |
| "sparkline", "mini chart" | SparklineChart | `sparkline` |
| "combo chart", "mixed chart" | ComboChart | `combo` |
| "dumbbell", "range comparison" | DumbbellChart | `dumbbell` |
| "flowchart", "diagram", "sequence" | MermaidDiagram | `mermaid` |
| "radar", "spider chart" | RadarChart | `radar` |
| "big number", "metric" | BigValue | `big_value` |
| "change", "delta" | Delta | `delta` |
| "alert", "warning banner" | Alert | `alert` |
| "note", "callout", "tip" | Note | `note` |
| "text", "paragraph" | TextBlock | `text` |
| "code block", "query" | TextArea | `textarea` |
| "table", "data grid" | DataTable | `table` |
| "space", "spacer" | EmptySpace | `empty_space` |
| "timeline", "milestones" | Timeline | `timeline` |
| "kanban", "board" | Kanban | `kanban` |
| "gantt", "schedule" | GanttChart | `gantt` |
| "org chart", "hierarchy" | OrgChart | `org_chart` |
| "KPI dashboard", "metrics" | KpiDashboard | `kpi_dashboard` |
| "budget", "budget vs actual" | BudgetReport | `budget_report` |
| "comparison table" | FeatureTable | `feature_table` |
| "audit log" | AuditLog | `audit_log` |
| "JSON viewer" | JsonViewer | `json_viewer` |
| "code block" | CodeBlock | `code_block` |
| "form", "key-value" | FormView | `form_view` |
| "text input" | InputText | `input_text` |
| "select", "dropdown" | InputSelect | `input_select` |
| "file upload" | InputFile | `input_file` |
| "form builder", "dynamic form" | FormBuilder | `form_builder` |
| "document", "report" + annotation | DocView | `doc_view` |

## Multi-Component Composition

For dashboards, use layout elements to compose:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "VerticalLayout",
      "props": {},
      "children": ["kpi", "chart", "table"]
    },
    "kpi": {
      "type": "KpiDashboard",
      "props": { "type": "kpi_dashboard", "metrics": [...], "columns": 3 },
      "children": []
    },
    "chart": {
      "type": "LineChart",
      "props": { "type": "line", "x": "month", "y": "revenue", "data": [...] },
      "children": []
    },
    "table": {
      "type": "DataTable",
      "props": { "type": "table", "columns": [...], "data": [...] },
      "children": []
    }
  }
}
```

## Data Handling

When the user provides data:
- Use it exactly as given — don't modify numbers or labels
- Map user's column/field names to the `x`, `y`, `value`, etc. props

When the user does NOT provide data:
- Use realistic placeholder data that tells a story (upward trend, seasonal dip, top performer)
- Don't use obviously fake data like "aaa", "xxx", or sequential numbers only

### WaterfallChart data convention

A data item with `value: 0` (except the first) is a **subtotal** — it displays the running total. Positive = green, negative = red, subtotal = accent color.

```json
{ "type": "waterfall", "label": "item", "value": "amount",
  "data": [
    { "item": "期初余额", "amount": 1200 },
    { "item": "销售收入", "amount": 800 },
    { "item": "小计", "amount": 0 },
    { "item": "产品成本", "amount": -420 },
    { "item": "期末余额", "amount": 0 }
  ]
}
```

## Export API

All 43 components support PNG export. The API is designed to be called by your code — the caller decides when and what to export.

### React (npm)

```tsx
import { exportToPNG, downloadPNG } from 'vizual'

// Get a Blob (for upload, preview, etc.)
const blob = await exportToPNG(element, { scale: 2, filename: 'chart' })

// Direct download
await downloadPNG(element, { scale: 2, filename: 'my-chart' })
```

### Standalone HTML

```js
// Get Blob
const blob = await Vizual.exportToPNG(element, { scale: 2 })

// Direct download
await Vizual.downloadPNG(element, { scale: 2, filename: 'chart' })
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scale` | number | 2 | Resolution multiplier (2 = Retina) |
| `backgroundColor` | string | from theme | Override background color |
| `filename` | string | `'vizual-export'` | Download filename (no extension) |

### How it works internally

- **ECharts charts**: Uses ECharts native `getDataURL()` — fast, pixel-perfect
- **HTML components**: Uses html2canvas — accurate DOM rendering
- **Background**: Reads `--rk-bg-primary` from current theme automatically

### DocView export

DocView renders a content viewport (`[data-docview-viewport]`) and an annotation panel side by side. To export only the document content (without the annotation panel), target the viewport element:

```tsx
const viewport = document.querySelector('[data-docview-viewport]')
await downloadPNG(viewport, { filename: 'report' })
```

**Note**: Only PNG export is supported. SVG export is not available because HTML components use CSS variables which cannot be resolved inside SVG `foreignObject`.

## Common Mistakes to Avoid

1. **Wrong type literal**: `BarChart` uses `"bar"`, not `"BarChart"`. `KpiDashboard` uses `"kpi_dashboard"`, not `"kpi"`.
2. **Missing data array**: All chart components need `data: [...]`.
3. **Inventing props**: Only use props defined in the schema.
4. **Forgetting children**: Every element needs `children: []`.
5. **String vs number**: Numeric values should be numbers, not strings.
6. **SVG export**: There is no SVG export. Use `exportToPNG` or `downloadPNG` instead.

## Reference

For the complete schema of every component, read: [references/component-catalog.md](references/component-catalog.md)

For composition patterns and real-world examples, read: [references/recipes.md](references/recipes.md)

Read the reference files when:
- You're unsure about a component's exact props
- The user asks for a complex multi-component layout
- You need to verify the correct `type` literal value
