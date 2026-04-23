---
name: vizual
version: "1.1.0"
description: >
  Generate structured JSON specs for Vizual's 32 visualization components, or use freeform HTML
  for unlimited design freedom. Use this skill whenever the user needs ANY kind of visual output
  — charts, dashboards, reports, KPIs, kanban boards, timelines, data tables, forms, annotatable
  documents, or even just "show me the data." Vizual provides 32 schema-validated components for
  charts and complex UI, plus DocView freeform sections where AI can write arbitrary HTML/CSS for
  dashboards, metrics, cards, and any visual design. Trigger on: charts, graphs, dashboards,
  reports, metrics, data visualization, kanban, timeline, gantt, forms, tables, "visualize this",
  "show me", "render", "display", "make a dashboard", or any request involving data + visuals.
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

You have access to Vizual: 32 pre-built, schema-validated visualization components that render from JSON specs, plus the ability to design freely with HTML/CSS inside DocView freeform sections.

## Two Design Modes

### 1. Components (for charts & complex UI)

Use Vizual components when you need:
- **Charts** (19 types) — ECharts-powered with tooltips, animations, interactivity
- **Complex UI** — DataTable, Kanban, Timeline, GanttChart, OrgChart
- **Business** — KpiDashboard, AuditLog
- **Forms** — FormBuilder with 18 field types and validation
- **Layouts** — GridLayout, SplitLayout, HeroLayout

### 2. Freeform HTML (for everything else)

Use DocView freeform sections when you need:
- **Dashboards** — grid/flexbox layouts, KPI cards, metric panels
- **Cards & Metrics** — styled numbers, trends, comparisons
- **Alerts & Banners** — styled callouts, warnings, info boxes
- **Text & Typography** — paragraphs, descriptions, headings with custom styling
- **Code/JSON display** — monospace blocks with custom styling
- **Progress indicators** — custom progress bars, gauges
- **Anything unique** — unlimited creative freedom with inline CSS

**What's allowed in freeform:** All structural HTML tags + inline `style` attributes. Semantic elements (h1-h6, section, article, aside, header, footer, figure, details) auto-receive annotation targeting.

**What's blocked:** `class` attribute, event handlers (`onclick`, `onerror`, `onload`), `script`, `iframe`, `style` tags.

## Decision Rule

| What user needs | Your approach |
|----------------|---------------|
| A chart or graph | Vizual component JSON spec |
| A data table with sorting | Vizual DataTable component |
| A kanban board | Vizual Kanban component |
| A gantt chart / timeline | Vizual GanttChart / Timeline component |
| A form with validation | Vizual FormBuilder component |
| **A dashboard with KPIs** | **DocView with freeform HTML sections** |
| **Metric cards / big numbers** | **DocView freeform HTML** |
| **Alerts, notes, callouts** | **DocView freeform HTML** |
| **A report with mixed content** | **DocView: freeform HTML + chart components** |
| Multiple charts composed | DocView with multiple chart sections, or GridLayout with single column |
| A chart inside custom HTML | Write HTML, embed `vizual.standalone.js` |
| Something Vizual doesn't cover | Write code freely |

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
- `type` in the element definition = **PascalCase component name** (e.g. `BarChart`, `DocView`)
- `type` inside `props` = **lowercase/snake_case literal** (e.g. `"bar"`, `"doc_view"`)
- Every element needs `children: []` (even if empty)
- Props must match the component's schema — don't invent fields

## Two Usage Modes

### Mode 1: React App (npm)

```tsx
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

const spec = { /* your JSON spec */ }

<StateProvider>
  <Renderer spec={spec} registry={registry} />
</StateProvider>
```

### Mode 2: Standalone HTML (any environment)

```html
<script src="./vizual.standalone.js"></script>
<div id="chart"></div>
<script>
  const spec = {
    root: 'main',
    elements: {
      main: {
        type: 'BarChart',
        props: { type: 'bar', x: 'quarter', y: 'revenue', data: [...] },
        children: []
      }
    }
  }
  Vizual.renderSpec(spec, document.getElementById('chart'))
</script>
```

## Component Selection Guide

| User says | Use |
|-----------|-----|
| "bar chart", "column chart" | BarChart (`bar`) |
| "line chart", "trend" | LineChart (`line`) |
| "area chart" | AreaChart (`area`) |
| "pie chart", "donut" | PieChart (`pie`) |
| "scatter plot", "correlation" | ScatterChart (`scatter`) |
| "bubble chart" | BubbleChart (`bubble`) |
| "box plot", "distribution" | BoxplotChart (`boxplot`) |
| "histogram", "frequency" | HistogramChart (`histogram`) |
| "waterfall" | WaterfallChart (`waterfall`) |
| "control chart", "SPC" | XmrChart (`xmr`) |
| "flow", "sankey" | SankeyChart (`sankey`) |
| "funnel", "conversion" | FunnelChart (`funnel`) |
| "heatmap", "matrix" | HeatmapChart (`heatmap`) |
| "calendar heatmap" | CalendarChart (`calendar`) |
| "sparkline", "mini chart" | SparklineChart (`sparkline`) |
| "combo chart", "mixed chart" | ComboChart (`combo`) |
| "dumbbell", "range comparison" | DumbbellChart (`dumbbell`) |
| "flowchart", "diagram", "sequence" | MermaidDiagram (`mermaid`) |
| "radar", "spider chart" | RadarChart (`radar`) |
| "table", "data grid" | DataTable (`table`) |
| "kanban", "board" | Kanban (`kanban`) |
| "gantt", "schedule" | GanttChart (`gantt`) |
| "org chart", "hierarchy" | OrgChart (`org_chart`) |
| "KPI dashboard", "metrics" | KpiDashboard (`kpi_dashboard`) or **freeform HTML** |
| "audit log" | AuditLog (`audit_log`) |
| "timeline", "milestones" | Timeline (`timeline`) |
| "form builder", "dynamic form" | FormBuilder (`form_builder`) |
| "document", "report" + annotation | DocView (`doc_view`) |
| "grid", "card grid" | GridLayout (`grid_layout`) |
| "split", "side by side" | SplitLayout (`split_layout`) |
| "hero", "banner section" | HeroLayout (`hero_layout`) |
| "dashboard", "big number", "metric" | **DocView freeform HTML** |
| "alert", "warning", "note" | **DocView freeform HTML** |
| "progress bar" | **DocView freeform HTML** |
| "code display", "JSON viewer" | **DocView freeform HTML** |

## DocView — Your Primary Canvas

DocView supports mixed content: freeform HTML sections alongside chart/table components.

```json
{
  "type": "DocView",
  "props": {
    "type": "doc_view",
    "title": "Quarterly Report",
    "sections": [
      { "type": "freeform", "content": "<section style='padding:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;margin-bottom:24px;'><h1 style='color:#fff;font-size:28px;margin:0;'>Q3 Performance</h1><p style='color:rgba(255,255,255,0.8);font-size:16px;margin-top:8px;'>Revenue exceeded targets by 18%</p></section>" },
      { "type": "chart", "content": "", "data": { "chartType": "BarChart", "x": "quarter", "y": "revenue", "data": [...] } },
      { "type": "freeform", "content": "<div style='display:flex;gap:16px;'><div style='flex:1;padding:20px;background:#1e293b;border-radius:8px;'><div style='color:#94a3b8;font-size:12px;'>REVENUE</div><div style='color:#e2e8f0;font-size:32px;font-weight:bold;'>$12.3M</div><div style='color:#10b981;font-size:13px;'>+15% YoY</div></div></div>" },
      { "type": "table", "content": "", "data": { "columns": [...], "data": [...] } }
    ]
  }
}
```

### Freeform CSS Variables

Use these theme-aware CSS variables in inline styles:

| Variable | Value | Usage |
|----------|-------|-------|
| `--rk-bg-primary` | #0f1117 | Main background |
| `--rk-bg-secondary` | #1e293b | Card/secondary background |
| `--rk-bg-tertiary` | #252836 | Input/hover background |
| `--rk-text-primary` | #e2e8f0 | Primary text |
| `--rk-text-secondary` | #94a3b8 | Secondary text |
| `--rk-text-tertiary` | #64748b | Muted text |
| `--rk-accent` | #667eea | Accent/brand color |
| `--rk-border-subtle` | #2d3148 | Subtle borders |
| `--rk-success` | #10b981 | Success color |
| `--rk-warning` | #f59e0b | Warning color |
| `--rk-error` | #ef4444 | Error color |
| `--rk-radius-md` | 8px | Standard border radius |

## Data Handling

When the user provides data:
- Use it exactly as given — don't modify numbers or labels
- Map user's column/field names to the `x`, `y`, `value`, etc. props

When the user does NOT provide data:
- Use realistic placeholder data that tells a story
- Don't use obviously fake data like "aaa", "xxx"

## Export API

All 32 components support PNG export.

### React (npm)

```tsx
import { exportToPNG, downloadPNG } from 'vizual'
const blob = await exportToPNG(element, { scale: 2 })
await downloadPNG(element, { scale: 2, filename: 'my-chart' })
```

### Standalone HTML

```js
const blob = await Vizual.exportToPNG(element, { scale: 2 })
await Vizual.downloadPNG(element, { scale: 2, filename: 'chart' })
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scale` | number | 2 | Resolution multiplier (2 = Retina) |
| `backgroundColor` | string | from theme | Override background color |
| `filename` | string | `'vizual-export'` | Download filename (no extension) |

**DocView export**: Target `[data-docview-viewport]` to export document content only (without annotation panel).

**Note**: Only PNG export is supported. SVG export is not available.

## Common Mistakes to Avoid

1. **Wrong type literal**: `BarChart` uses `"bar"`, not `"BarChart"`. `KpiDashboard` uses `"kpi_dashboard"`, not `"kpi"`.
2. **Missing data array**: All chart components need `data: [...]`.
3. **Inventing props**: Only use props defined in the schema.
4. **Forgetting children**: Every element needs `children: []`.
5. **String vs number**: Numeric values should be numbers, not strings.
6. **SVG export**: There is no SVG export. Use `exportToPNG` or `downloadPNG` instead.
7. **Using removed components**: BigValue, Delta, Alert, Note, TextBlock, etc. are removed — use freeform HTML instead.

## Combining with Other Skills

### When to combine with LiveKit

If the user wants to **interactively adjust** the visualization — tune parameters, compare options, explore data — combine this skill with **livekit**. Wrap the component in `InteractivePlayground` (component-level) or generate a full HTML page (theme-level / custom-level).

Trigger signals: "调一下", "试试看", "interactive", "playground", "slider", "能拖参数吗", "对比一下", "让我调调"

### When to combine with DESIGN.md Parser

If the user wants to **apply a custom theme** before rendering, use **design-md-parser** to extract tokens, then render with the applied theme.

Trigger signals: "用我们的品牌色", "apply this theme", "换成我们的配色", user pastes a design doc

### When to combine with DESIGN.md Creator

If the user wants to **create a design system from scratch** and then see components in it, use **design-md-creator** first to produce the DESIGN.md + preview page.

Trigger signals: "创建设计系统", "make our brand guide", "从零开始设计", user wants to define visual identity

## Reference

For the complete schema of every component, read: [references/component-catalog.md](references/component-catalog.md)

For composition patterns and real-world examples, read: [references/recipes.md](references/recipes.md)
