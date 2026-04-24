---
name: vizual
version: "4.0.0"
description: >
  Generate structured JSON specs for Vizual's 31 visualization components. Use this skill
  whenever the user needs ANY kind of visual output — charts, dashboards, reports, KPIs,
  kanban boards, timelines, data tables, forms, interactive parameter tuning, annotatable
  documents, or even just "show me the data." Trigger on: charts, graphs, dashboards, reports,
  metrics, data visualization, kanban, timeline, gantt, forms, tables, "visualize this",
  "show me", "render", "display", "make a dashboard", interactive, playground, adjustable,
  slider, or any request involving data + visuals.
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

You generate JSON specs that the host app renders as interactive UI via `renderSpec(spec, container)`. You have 31 components. Your job is to pick the right ones and compose them well.

## How to Think About Components

Vizual components fall into 6 families. Think of them as building blocks, not a lookup table. Most real-world outputs combine multiple components.

**Charts (19)** — BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram. All powered by ECharts with tooltips, animations, and responsive sizing.

**Data Display** — DataTable. Columns, striped rows, compact mode. No sorting/filtering/pagination yet.

**Business** — KpiDashboard (metric cards with trend arrows), Kanban (column-based task board), GanttChart (task timeline with dependencies), OrgChart (reporting hierarchy), Timeline (milestone chronology), AuditLog (activity log with severity).

**Input** — FormBuilder. 18 field types, validation, conditional visibility. This is your form builder — any time the user describes input fields, dropdowns, or data collection UI, use it.

**Meta** — DocView (document with mixed sections — text, headings, charts, KPIs, tables, callouts, markdown, freeform HTML — plus optional annotation panel). InteractivePlayground has been **removed** — do NOT use it.

**Layout** — GridLayout (multi-column grid), SplitLayout (two-pane split), HeroLayout (banner section). Layouts hold child components; they don't render content themselves.

## How to Generate a Spec

This is the most important part. Follow these steps **every time** you generate a spec:

### Step 1: Pick the right component(s)

Use the "When to Use What" section below to select components based on what the user is trying to accomplish.

### Step 2: Read the component's reference file

**You must read the reference file for every component you use.** The reference file contains the exact props, types, and examples you need. Do not guess or rely on memory — the type fields and data formats are strict and rendering will fail silently if you get them wrong.

Reference files are organized by component name:

| Component | Reference file |
|-----------|---------------|
| BarChart | references/charts/bar-chart.md |
| LineChart | references/charts/line-chart.md |
| AreaChart | references/charts/area-chart.md |
| PieChart | references/charts/pie-chart.md |
| ScatterChart | references/charts/scatter-chart.md |
| BubbleChart | references/charts/bubble-chart.md |
| BoxplotChart | references/charts/boxplot-chart.md |
| HistogramChart | references/charts/histogram-chart.md |
| WaterfallChart | references/charts/waterfall-chart.md |
| XmrChart | references/charts/xmr-chart.md |
| SankeyChart | references/charts/sankey-chart.md |
| FunnelChart | references/charts/funnel-chart.md |
| HeatmapChart | references/charts/heatmap-chart.md |
| CalendarChart | references/charts/calendar-chart.md |
| SparklineChart | references/charts/sparkline-chart.md |
| ComboChart | references/charts/combo-chart.md |
| DumbbellChart | references/charts/dumbbell-chart.md |
| RadarChart | references/charts/radar-chart.md |
| MermaidDiagram | references/charts/mermaid-diagram.md |
| ~~InteractivePlayground~~ | **REMOVED** — do not use |
| DataTable | references/charts/data-table.md |
| KpiDashboard | references/business/kpi-dashboard.md |
| Timeline | references/business/timeline.md |
| Kanban | references/business/kanban.md |
| GanttChart | references/business/gantt-chart.md |
| OrgChart | references/business/org-chart.md |
| AuditLog | references/business/audit-log.md |
| FormBuilder | references/input/form-builder.md |
| DocView | references/doc/docview.md |
| GridLayout / SplitLayout / HeroLayout | references/layout/layouts.md |

### Step 3: Generate the spec following the reference exactly

Use the example in the reference file as your template. Copy its structure, swap in the user's data.

## Composition Patterns

Real outputs are usually compositions. Here are the common patterns:

**Dashboard** — `GridLayout` holding `KpiDashboard` + charts + `DataTable`. The "KPI cards on top, charts in middle, table at bottom" layout.

**Analysis Report** — `DocView` with structured sections: `heading`, `callout` (alerts), `chart` (embedded chart), `markdown` (analysis text). Use DocView's built-in section types (`kpi`, `chart`, `table`, `callout`) rather than freeform HTML for these.

**Split View** — `SplitLayout` with a chart on one side and a `DataTable` on the other. Good for comparing visual and tabular representations of the same data.

**Interactive Explorer** — Use a standalone chart component with user-adjustable data. For truly interactive parameter exploration, tell the user to use a separate HTML page with native HTML controls. Do NOT use InteractivePlayground — it has been removed.

**Standalone Chart** — A single chart component at the root. No layout wrapper needed.

For more composition examples with full JSON, read: [references/recipes.md](references/recipes.md)

## When to Use What

Think about what the user is trying to accomplish, then pick components that serve that goal.

**The user wants to see data visually** → Pick the chart that matches the data shape: categorical comparison → BarChart, time series → LineChart, proportions → PieChart, correlations → ScatterChart, flow → SankeyChart, funnel → FunnelChart, distribution → BoxplotChart/HistogramChart, multi-dimensional → RadarChart, calendar patterns → CalendarChart, etc. ComboChart handles dual-axis (bar + line). MermaidDiagram handles flowcharts and sequence diagrams.

**The user wants metrics at a glance** → KpiDashboard. It has `trend` and `trendValue` on each metric. Use it for big numbers with trend arrows.

**The user wants a table** → DataTable.

**The user wants a form, input fields, settings panel, survey** → FormBuilder. Even if they don't say "form" — if they describe input fields, dropdowns, or data collection, use FormBuilder.

**The user wants a board, timeline, org chart, or activity log** → Kanban, GanttChart, Timeline, OrgChart, AuditLog respectively.

**The user wants to adjust parameters interactively** → **InteractivePlayground has been removed.** Use a plain chart component with hardcoded data instead. If the user explicitly needs interactivity, tell them to use a standalone HTML page with native HTML controls and the Vizual JS API.

**REMOVED: InteractivePlayground** — Do NOT generate specs with `type: "InteractivePlayground"` or `type: "interactive_playground"`. This component no longer exists.

**The user wants a document or report** → DocView. Use its structured section types: `heading`, `text`, `kpi`, `chart`, `table`, `callout`, `markdown`, `freeform`. Set `enableAnnotations: true` if the user wants highlighting/comments.

**The user wants things arranged in a layout** → GridLayout (multi-column), SplitLayout (two-pane), HeroLayout (top banner). These are containers — they hold other components as children. **Use GridLayout for dashboards and reports.** Only use DocView when the user explicitly wants an annotatable document with a sidebar panel.

**Something none of the above covers** → DocView's `freeform` section type for static visual content (styled text, code blocks, custom progress bars). This is your last resort.

## Anti-Patterns — What NOT to Do

These are the most common mistakes. Avoiding them is more important than memorizing the component list.

1. **Don't use freeform HTML when a dedicated component exists.** KPI metrics → KpiDashboard (not freeform `<div>` cards). Data tables → DataTable (not freeform `<table>`). Forms and inputs → FormBuilder (not freeform `<input>` elements). Freeform HTML controls are non-functional because event handlers are blocked. **Do NOT use InteractivePlayground** — it has been removed from Vizual.

2. **Don't embed components as freeform HTML inside DocView.** DocView has structured section types for charts, KPIs, and tables. Use `{ "type": "chart", "data": {...} }` not `{ "type": "freeform", "content": "<div>...</div>" }` for these.

3. **Don't invent props.** Only use props that exist in the schema. When unsure, read the component's reference file. Common invented props that don't exist: `sort`, `filter`, `pagination` on DataTable; `drag` on Kanban; `height` on BarChart.

4. **Don't mix up the two `type` fields.** In the element definition: PascalCase (`"BarChart"`, `"DocView"`). Inside `props`: lowercase/snake_case literal (`"bar"`, `"doc_view"`). Layout components (GridLayout, SplitLayout, HeroLayout) have no `type` in props.

5. **Don't use removed components.** BigValue, Delta, Alert, Note, TextBlock, **InteractivePlayground** no longer exist. Use KpiDashboard for metrics, DocView `callout` sections for alerts.

6. **Don't hardcode brand colors in freeform HTML.** Vizual has a default dark theme that works out of the box. For light mode, set `theme: "light"` on chart components. For custom brand colors, tell the user the host app can call `loadDesignMd()`. Don't try to bypass the theme system with inline styles.

## Output Format

```json
{
  "root": "<element-id>",
  "elements": {
    "<element-id>": {
      "type": "<ComponentName>",
      "props": { ... },
      "children": []
    }
  }
}
```

Every element needs `children: []`. Chart components need `data: [...]`. Use realistic placeholder data when the user doesn't provide any.

## Data Field Names — Match the User's Language

Chart legends, axis labels, and table headers come from the field names in your `data` array. **Use the same language the user is speaking.** If the user writes in Chinese, use Chinese field names. If English, use English.

```json
// User speaks Chinese → Chinese field names
{ "x": "分群", "y": ["用户数", "7日留存率"], "data": [{"分群": "A", "用户数": 100, "7日留存率": 0.7}] }

// User speaks English → English field names
{ "x": "segment", "y": ["users", "retention_day7"], "data": [{"segment": "A", "users": 100, "retention_day7": 0.7}] }
```

This applies to **all** chart types, DataTable columns, KpiDashboard labels, and any user-facing text.

## Theme

Default is dark. For light mode, set `theme: "light"` on chart components. For full brand customization, the host app calls `loadDesignMd(markdown)` — this is outside the JSON spec.

## Export

All components support PNG export via `Vizual.exportToPNG(element, { scale: 2 })` or `Vizual.downloadPNG(element, { scale: 2, filename: 'chart' })`. Only PNG, no SVG. DocView: target `[data-docview-viewport]` for document-only export.

## Combining with Other Skills

- **LiveKit** — When the user wants theme-level or custom-level interactivity (multi-component interactive pages, theme preview, dark/light comparison).
- **design-md-parser** — When the user provides a design document and wants to extract theme tokens.
- **design-md-creator** — When the user wants to create a design system from scratch with an interactive preview.
