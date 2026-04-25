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

**Meta** — DocView (annotatable document with mixed sections, annotation panel, revision loop, and version history). DocView is not the default report layout. Use it only when the output is meant to behave like a document. InteractivePlayground has been **removed** — do NOT use it.

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

**Dashboard / Chat Analysis** — `GridLayout` holding `KpiDashboard` + charts + `DataTable`. Put explanatory prose in the host chat/message text when the host supports text next to the Vizual render. Do not wrap ordinary chat analysis in DocView just to show headings or paragraphs.

**Annotatable Document** — `DocView` with structured sections: `heading`, `text`, `callout`, `kpi`, `chart`, `table`, `markdown`. Use this when the user explicitly wants comments, annotations, revisions, document review, report-document export, or a long-form document UI. Set `showPanel: true` when annotations are part of the workflow; set `showPanel: false` only for read-only document previews.

For charts inside DocView, read `references/doc/docview.md`: use `chart` sections with `data.chartType` for ordinary embedded charts, or `component` sections with `data.componentType` when exact standalone chart props are clearer.

**Split View** — `SplitLayout` with a chart on one side and a `DataTable` on the other. Good for comparing visual and tabular representations of the same data.

**Interactive Explorer** — In `validation/vizual-test.html`, use the host bridge `renderInteractiveVizInMsg(id, config)`: FormBuilder controls on the left, live Vizual preview on the right, and `makeSpec(state)` to regenerate the chart. This is host JavaScript, not pure JSON. Do NOT use InteractivePlayground — it has been removed.

**Standalone Chart** — A single chart component at the root. No layout wrapper needed.

For more composition examples with full JSON, read: [references/recipes.md](references/recipes.md)

## Host Runtime and Test Page Bridge

Vizual specs are JSON artifacts. A host page must render them. When the host is `validation/vizual-test.html`, use the page's JavaScript bridge; simply typing JSON into the chat input will not render anything.

Required bridge flow for agents with browser script execution (`evaluate_script`, Playwright `page.evaluate`, Chrome DevTools Protocol, etc.):

```js
const msg = window._pendingMsg;       // read the latest user message
const id = window.createAiMsg();      // create the AI reply bubble
window.streamText(id, answerText);    // optional narrative answer
window.finishText(id);                // finish text streaming
window.renderVizInMsg(id, spec);      // mount the Vizual JSON spec
window._pendingMsg = null;            // mark the user message handled
```

For real-time adjust-preview tasks in `vizual-test.html`, call the interactive bridge instead of returning a pure spec:

```js
const id = window.createAiMsg();
window.streamText(id, answerText);
window.finishText(id);
window.renderInteractiveVizInMsg(id, {
  initialState: { controls: { points: 8, mode: 'grouped', brandColor: '#ff6b35' } },
  controlsSpec: {
    root: 'controls',
    elements: {
      controls: {
        type: 'FormBuilder',
        props: {
          type: 'form_builder',
          value: { $bindState: '/controls' },
          fields: [
            { name: 'points', label: 'Data points', type: 'slider', min: 3, max: 15 },
            { name: 'mode', label: 'Mode', type: 'select', options: ['grouped', 'stacked'] },
            { name: 'brandColor', label: 'Brand color', type: 'color' },
          ],
        },
      },
    },
  },
  designMd: 'Primary: #ff6b35',
  applyTheme: (state, Vizual) => Vizual.loadDesignMd(`Primary: ${state.controls.brandColor}`, { apply: true }),
  makeSpec: (state) => ({
    root: 'chart',
    elements: {
      chart: {
        type: 'BarChart',
        props: {
          x: Array.from({ length: state.controls.points }, (_, i) => `D${i + 1}`),
          y: Array.from({ length: state.controls.points }, (_, i) => 20 + i * 4),
          stacked: state.controls.mode === 'stacked',
        },
      },
    },
  }),
});
```

If an agent can only click and type in the browser but cannot execute JavaScript in the page, it cannot complete `vizual-test.html` rendering or live interactivity by itself. In that case, provide a static spec plus explanation, or use a host bridge, Playwright/CDP, or an auto-poll backend that calls `renderVizInMsg()` / `renderInteractiveVizInMsg()`.

For ordinary data-analysis prompts in `vizual-test.html`, answer in host message text and render a `GridLayout`/chart/dashboard spec. Do not choose DocView unless the user explicitly asks for annotation, comments, review, revision, or a document artifact.

## Rendered DocView Interaction Checklist

When the task is to operate an already-rendered DocView page, the Agent should use the UI, not regenerate the document:

1. Click a KPI/card/chart/table/section target, or select text in a text/markdown section.
2. Wait for the annotation popup.
3. Enter the comment or revision request.
4. Confirm the popup.
5. Verify the annotation appears in the annotation panel and the target is highlighted.
6. If the workflow requires submission, use the panel's submit/revision action and watch the host `onAction` event.

Expected host events include `annotationAdded` with target metadata, and submission/revision actions when the user requests a revision loop.

## When to Use What

Think about what the user is trying to accomplish, then pick components that serve that goal.

### First Decision: Is This a Document or a Visualization?

Most requests are **not** DocView requests.

Use `GridLayout` or standalone components when:
- The user asks for a chart, dashboard, KPI board, table, comparison, analysis answer, or visual summary.
- The host/chat can display normal text outside the Vizual component.
- The output is meant to be read, not annotated or revised in-place.

Use `DocView` only when:
- The user explicitly asks for an annotatable document, report document, review workflow, comments, highlights, revisions, version history, or document export.
- The product surface supports DocView interactions (`onAction`, annotation panel, revision loop), not just static rendering.
- The document itself is the artifact, not merely a way to add paragraphs around charts.

If unsure between DocView and GridLayout, choose `GridLayout` and put the written explanation in the host text response.

**The user wants to see data visually** → Pick the chart that matches the data shape: categorical comparison → BarChart, time series → LineChart, proportions → PieChart, correlations → ScatterChart, flow → SankeyChart, funnel → FunnelChart, distribution → BoxplotChart/HistogramChart, multi-dimensional → RadarChart, calendar patterns → CalendarChart, etc. ComboChart handles dual-axis (bar + line). MermaidDiagram handles flowcharts and sequence diagrams.

**The user wants metrics at a glance** → KpiDashboard. It has `trend` and `trendValue` on each metric. Use it for big numbers with trend arrows.

**The user wants a table** → DataTable.

**The user wants a form, input fields, settings panel, survey** → FormBuilder. Even if they don't say "form" — if they describe input fields, dropdowns, or data collection, use FormBuilder.

**The user wants a board, timeline, org chart, or activity log** → Kanban, GanttChart, Timeline, OrgChart, AuditLog respectively.

**The user wants to adjust parameters interactively** → In `vizual-test.html`, call `renderInteractiveVizInMsg()` with a FormBuilder `value: { "$bindState": "/controls" }`, `initialState.controls`, and `makeSpec(state)`. Outside that test page, the host application must provide the same state-change bridge. If you cannot execute page JavaScript, generate a static spec and clearly say live interactivity needs a host bridge.

**REMOVED: InteractivePlayground** — Do NOT generate specs with `type: "InteractivePlayground"` or `type: "interactive_playground"`. This component no longer exists.

**The user wants a document with annotation/revision behavior** → DocView. Use its structured section types: `heading`, `text`, `kpi`, `chart`, `table`, `callout`, `markdown`, `freeform`. Set `showPanel: true` if the user wants highlighting/comments.

**The user wants things arranged in a layout** → GridLayout (multi-column), SplitLayout (two-pane), HeroLayout (top banner). These are containers — they hold other components as children. **Use GridLayout for dashboards and reports.** Only use DocView when the user explicitly wants an annotatable document with a sidebar panel.

**Something none of the above covers** → Use a host text answer plus the closest Vizual component. Use DocView `freeform` only inside a true document. Freeform HTML controls are static because event handlers are blocked.

## Anti-Patterns — What NOT to Do

These are the most common mistakes. Avoiding them is more important than memorizing the component list.

1. **Don't use freeform HTML when a dedicated component exists.** KPI metrics → KpiDashboard (not freeform `<div>` cards). Data tables → DataTable (not freeform `<table>`). Forms and inputs → FormBuilder (not freeform `<input>` elements). Freeform HTML controls are non-functional because event handlers are blocked. **Do NOT use InteractivePlayground** — it has been removed from Vizual.

2. **Don't embed components as freeform HTML inside DocView.** DocView has structured section types for charts, KPIs, and tables. Use `{ "type": "chart", "data": {...} }` not `{ "type": "freeform", "content": "<div>...</div>" }` for these.

3. **Don't use DocView as a generic chat/report wrapper.** If the user did not ask for annotations, comments, document review, revisions, or a document artifact, use `GridLayout`/standalone components and keep prose in the host message.

4. **Don't invent props.** Only use props that exist in the schema. When unsure, read the component's reference file. Common invented props that don't exist: `sort`, `filter`, `pagination` on DataTable; `drag` on Kanban; `height` on BarChart; `enableAnnotations` on DocView.

5. **Don't mix up the two `type` fields.** In the element definition: PascalCase (`"BarChart"`, `"DocView"`). Inside `props`: lowercase/snake_case literal (`"bar"`, `"doc_view"`). Layout components (GridLayout, SplitLayout, HeroLayout) have no `type` in props.

6. **Don't use removed components.** BigValue, Delta, Alert, Note, TextBlock, **InteractivePlayground** no longer exist. Use KpiDashboard for metrics. Use host text or DocView `callout` only when you are already using DocView.

7. **Don't treat `theme` as brand-color injection.** Chart `theme: "dark"` / `"light"` only selects a preset mode. For custom brand colors, the host must call `Vizual.loadDesignMd(markdown, { apply: true })`, or `renderInteractiveVizInMsg()` must provide `designMd` / `applyTheme`. Don't try to bypass the theme system with inline styles.

## Output Format

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "x": "category",
        "y": "value",
        "data": []
      },
      "children": []
    }
  }
}
```

Every element needs `children: []`. Chart components need `data: [...]`. Use realistic placeholder data when the user doesn't provide any.

## Data Field Names — Match the User's Language

Chart legends, axis labels, and table headers come from the field names in your `data` array. **Use the same language the user is speaking.** If the user writes in Chinese, use Chinese field names. If English, use English.

```jsonc
// User speaks Chinese → Chinese field names
{ "x": "分群", "y": ["用户数", "7日留存率"], "data": [{"分群": "A", "用户数": 100, "7日留存率": 0.7}] }

// User speaks English → English field names
{ "x": "segment", "y": ["users", "retention_day7"], "data": [{"segment": "A", "users": 100, "retention_day7": 0.7}] }
```

This applies to **all** chart types, DataTable columns, KpiDashboard labels, and any user-facing text.

## Data Integrity

Do not fabricate source data for analytical claims. If the user gives raw rows, metrics, dates, or scores, visualize those values. If the user only gives a written assessment, visualize the explicit scores, categories, quoted findings, or clearly labeled qualitative severity/rubric values.

For analysis-review prompts, never invent missing business time series such as fake D1-D14 values just because the text mentions a breakpoint. Say in host text that the raw series is required to chart the real breakpoint, and use a table or rubric chart to show the issue instead.

Placeholder data is acceptable only when the user asks for an example/demo or gives no domain data at all. Keep placeholders obviously illustrative and do not present them as evidence.

## Theme

Default is dark. For light mode, set `theme: "light"` on chart components. This prop is not a brand palette. For full brand customization, the host app calls `Vizual.loadDesignMd(markdown, { apply: true })` before rendering, or the `vizual-test.html` interactive bridge uses `designMd` / `applyTheme`. Brand colors are outside the pure JSON spec.

## Export

All components support PNG export via `Vizual.exportToPNG(element, { scale: 2 })` or `Vizual.downloadPNG(element, { scale: 2, filename: 'chart' })`. Only PNG, no SVG. DocView: target `[data-docview-viewport]` for document-only export.

## Combining with Other Skills

- **design-md-parser** — When the user provides a design document and wants to extract theme tokens.
- **design-md-creator** — When the user wants to create a design system from scratch with an interactive preview.
