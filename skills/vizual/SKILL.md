---
name: vizual
version: "4.1.1"
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

You generate Vizual specs/artifacts that the host app renders as interactive UI. A raw JSON spec is enough for one-time static rendering. A `VizualArtifact` is required when the output must be recovered from chat history, edited later, targeted by natural language, reviewed, or exported.

## How to Think About Components

Vizual components fall into 6 families. Think of them as building blocks, not a lookup table. Most real-world outputs combine multiple components.

**Charts (19)** — BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram. All powered by ECharts with tooltips, animations, and responsive sizing.

**Data Display** — DataTable. Columns, striped rows, compact mode. No sorting/filtering/pagination yet.

**Business** — KpiDashboard (metric cards with trend arrows), Kanban (column-based task board), GanttChart (task timeline with dependencies), OrgChart (reporting hierarchy), Timeline (milestone chronology), AuditLog (activity log with severity).

**Input** — FormBuilder. 18 field types, validation, conditional visibility. This is your form builder — any time the user describes input fields, dropdowns, or data collection UI, use it.

**Meta** — DocView (annotatable document with mixed sections, annotation panel, revision loop, and version history). DocView is not the default report layout. Use it only when the output must behave like a reviewable document, with comments/annotations/revisions as part of the workflow. InteractivePlayground has been **removed** — do NOT use it.

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

**Annotatable Document** — `DocView` with structured sections: `heading`, `text`, `callout`, `kpi`, `chart`, `table`, `markdown`. Use this when the user explicitly wants comments, annotations, revisions, document review, or asks to turn an output into a reviewable document artifact. Do not choose DocView merely because the user says "report", "analysis", "dashboard", or "export"; ordinary report/export outputs should stay as host text plus `GridLayout`/charts/tables. Set `showPanel: true` when annotations are part of the workflow; set `showPanel: false` only for read-only previews of a document that can later enter review. For revisable documents, give important sections stable `id` fields so Agent patches can target `sectionId`.

For charts inside DocView, read `references/doc/docview.md`: use `chart` sections with `data.chartType` for ordinary embedded charts, or `component` sections with `data.componentType` when exact standalone chart props are clearer.

**Split View** — `SplitLayout` with a chart on one side and a `DataTable` on the other. Good for comparing visual and tabular representations of the same data.

**Interactive Explorer** — In `validation/vizual-test.html`, use the host bridge `renderInteractiveVizInMsg(id, config)`: FormBuilder controls on the left, live Vizual preview on the right, and `makeSpec(state)` to regenerate the chart. Use `bubbleWidth` (`compact`, `normal`, `wide`, `full`) to choose the visual bubble size. This is host JavaScript, not pure JSON. Do NOT use InteractivePlayground — it has been removed.

**Standalone Chart** — A single chart component at the root. No layout wrapper needed.

For more composition examples with full JSON, read: [references/recipes.md](references/recipes.md)

## Runtime Model: Spec vs Artifact vs Bridge

Use the smallest runtime shape that satisfies the task:

| Need | What to output/call | Why |
|------|---------------------|-----|
| One static chart/dashboard/table | JSON spec + `renderVizInMsg(id, spec)` | Fast, compatible, page wraps it into an artifact automatically |
| Historical recovery or follow-up edits | `VizualArtifact` + `renderArtifactInMsg(id, artifact)` or `updateArtifactInMsg(ref, patch)` | Preserves `id`, `targetMap`, `versions`, `theme`, `exports`; follow-ups render as a new AI bubble by default |
| "Change this chart to line / filter region / make it less dense" | Read `getLastArtifact()` then call `updateArtifactInMsg()` | Do not regenerate from memory; patch the saved artifact and keep the old bubble as history |
| Live adjustable preview | `renderInteractiveVizInMsg(id, config)` | Requires host JavaScript, FormBuilder state, and `makeSpec(state)` |
| DocView review loop | `renderDocViewInMsg(id, config)` in `vizual-test.html`, or DocView UI + review controller in a custom host | User annotates, Agent reads submitted threads, returns revision proposal, user applies/rejects |

Artifact patch examples:

```js
const artifact = window.getLastArtifact();
window.updateArtifactInMsg(artifact.id, [
  { type: 'changeChartType', targetId: 'element:chart', chartType: 'LineChart' },
  { type: 'filterData', targetId: 'element:chart', field: 'region', values: '华东' },
  { type: 'limitData', targetId: 'element:chart', limit: 8 },
], { answerText: '已按华东区改成折线图。' });
```

Important patch types: `changeChartType`, `filterData`, `limitData`, `updateElementProps`, `replaceElement`, `replaceSpec`, `mergeState`, `setTheme`, `addExportRecord`.

Use these Vizual typed patch objects. Do not generate RFC-style JSON Patch (`{ op, path, value }`) unless you are maintaining a legacy host. The runtime accepts basic JSON Patch as a compatibility fallback, but typed patches are clearer, target-map aware, and less likely to mutate the wrong path.

Use `targetMap` instead of guessing component paths. Common target ids look like `element:chart`, `section:trend`, `metric:revenue`, and `column:region`.

## Host Runtime and Test Page Bridge

Vizual specs are JSON artifacts. A host page must render them. When the host is `validation/vizual-test.html`, use the page's JavaScript bridge; simply typing JSON into the chat input will not render anything.

Required bridge flow for agents with browser script execution (`evaluate_script`, Playwright `page.evaluate`, Chrome DevTools Protocol, etc.):

```js
const pending = window.getPendingMessage?.() ?? { rawText: window._pendingMsg, text: window._pendingMsg };
const msg = pending.rawText || pending.text; // read the exact user message; do not scrape DOM bubbles
const id = window.createAiMsg();      // create the AI reply bubble
window.streamText(id, answerText);    // optional narrative answer
window.finishText(id);                // finish text streaming
window.renderVizInMsg(id, spec);      // mount the Vizual JSON spec; page auto-infers bubble width
if (window.markPendingHandled) window.markPendingHandled();
else window._pendingMsg = null;
```

When `getPendingMessage()` exists, use it instead of `getMsgs()` or DOM text. It preserves pasted line breaks and raw table text. After rendering, `window.__lastVizualRender` records the last spec for QA; `window.getLastArtifact()` records the editable artifact with `targetMap`, `versions`, and export metadata.

For QA and browser automation, do not guess chat DOM selectors such as `.message`. Prefer `window.getVizualConversationState()` and `window.getVizualDebugState()`. If you must inspect DOM, use the stable host attributes: `[data-message-row="true"]`, `[data-ai-msg="true"]`, `[data-user-msg="true"]`, `[data-viz-container="true"]`, and `[data-artifact-id]`.

For historical follow-up requests, use the artifact bridge:

```js
const artifact = window.getLastArtifact();
const target = artifact.targetMap.find(t => t.componentType === 'BarChart' || t.type === 'element');
const updated = window.updateArtifactInMsg(artifact.id, [
  { type: 'changeChartType', targetId: target.id, chartType: 'LineChart' },
  { type: 'filterData', targetId: target.id, field: 'region', values: '华东' },
], { answerText: '已生成新的修改版图表。' });
const pdf = await window.exportArtifact(updated.id, { format: 'pdf', filename: 'east-china-line' });
const xlsx = await window.exportArtifact(updated.id, { format: 'xlsx', filename: 'east-china-data' });
```

Built-in export formats are `png`, `pdf`, `csv`, and `xlsx`. PNG/PDF export the rendered visual surface. CSV/XLSX export the first tabular `props.data` dataset unless the host passes explicit rows/columns.

`updateArtifactInMsg()` creates a new AI reply bubble by default so historical chat records remain stable. Pass `{ mode: 'replace' }` only for temporary in-place preview/debug.

For static charts, omit `bubbleWidth` unless you have a reason to override. The page infers `normal` for KPI/sparkline, `wide` for ordinary charts, and `full` for layouts, DocView, Sankey, Radar, FormBuilder, and tables. Pass `{ bubbleWidth: 'compact' | 'normal' | 'wide' | 'full' }` only when the user asks for a specific density.

For real-time adjust-preview tasks in `vizual-test.html`, call the interactive bridge instead of returning a pure spec:

```js
const id = window.createAiMsg();
window.streamText(id, answerText);
window.finishText(id);
window.renderInteractiveVizInMsg(id, {
  bubbleWidth: 'full',
  initialState: {
    controls: {
      chartType: 'bar',
      points: 8,
      orientation: 'vertical',
      stacked: false,
      smooth: false,
      secondaryMetric: 'growth',
      brandColor: '#ff6b35',
    },
  },
  controlsSpec: {
    root: 'controls',
    elements: {
      controls: {
        type: 'FormBuilder',
        props: {
          type: 'form_builder',
          value: { $bindState: '/controls' },
          fields: [
            {
              name: 'chartType',
              label: 'Chart type',
              type: 'select',
              options: [
                { label: 'Bar', value: 'bar' },
                { label: 'Line', value: 'line' },
                { label: 'Combo', value: 'combo' },
              ],
            },
            { name: 'points', label: 'Data points', type: 'slider', min: 3, max: 15 },
            {
              name: 'orientation',
              label: 'Bar orientation',
              type: 'select',
              options: [{ label: 'Vertical', value: 'vertical' }, { label: 'Horizontal', value: 'horizontal' }],
              dependsOn: 'chartType',
              showWhen: 'bar',
            },
            { name: 'stacked', label: 'Stack bars', type: 'switch', dependsOn: 'chartType', showWhen: 'bar' },
            { name: 'smooth', label: 'Smooth line', type: 'switch', dependsOn: 'chartType', showWhen: 'line' },
            {
              name: 'secondaryMetric',
              label: 'Combo line metric',
              type: 'select',
              options: [{ label: 'Growth', value: 'growth' }, { label: 'ARPPU', value: 'arppu' }],
              dependsOn: 'chartType',
              showWhen: 'combo',
            },
            { name: 'brandColor', label: 'Brand color', type: 'color' },
          ],
        },
        children: [],
      },
    },
  },
  designMd: 'Primary: #ff6b35',
  applyTheme: (state, Vizual) => Vizual.loadDesignMd(`Primary: ${state.controls.brandColor}`, { apply: true }),
  makeSpec: (state) => {
    const points = Number(state.controls.points || 8);
    const data = Array.from({ length: points }, (_, i) => ({
      day: `D${i + 1}`,
      value: 20 + i * 4,
      growth: 8 + i * 1.5,
      arppu: 4.5 + i * 0.35,
    }));
    const chartType = state.controls.chartType;
    const chart =
      chartType === 'line'
        ? { type: 'LineChart', props: { type: 'line', x: 'day', y: 'value', data, smooth: !!state.controls.smooth }, children: [] }
        : chartType === 'combo'
          ? { type: 'ComboChart', props: { type: 'combo', x: 'day', y: ['value', state.controls.secondaryMetric || 'growth'], data }, children: [] }
          : { type: 'BarChart', props: { type: 'bar', x: 'day', y: 'value', data, stacked: !!state.controls.stacked, horizontal: state.controls.orientation === 'horizontal' }, children: [] };
    return { root: 'chart', elements: { chart } };
  },
});
```

For interactive controls, expose only options that make sense for the current component. `horizontal` and `stacked` are BarChart options; do not show or pass them to LineChart or ComboChart. Use FormBuilder `dependsOn` / `showWhen` for visibility and still normalize in `makeSpec(state)` so invalid props never reach the chart.

For automated QA of an interactive preview, prefer the stable host APIs instead of simulating React DOM input events:

```js
window.updateInteractiveVizInMsg(id, { controls: { points: 12 } }, { immediate: true });
window.updateInteractiveVizInMsg(id, { controls: { chartType: 'line', brandColor: '#123456' } }, { immediate: true });
const state = window.getInteractiveVizState(id);
const spec = state.lastPreviewSpec;
```

`getInteractiveVizState(ref?)` details:

- Pass the artifact id or message id when you want one interactive widget. Pass `'last'` or omit `ref` only for quick debugging of the most recent widget.
- The returned object is `{ id, messageId, artifact, state, lastPreviewSpec, renderCount, lastUpdatedAt }`.
- Current control values live under `state.controls`; the current rendered chart spec lives under `lastPreviewSpec`.
- Multiple interactive widgets are isolated. Do not reuse one widget's `state.controls` or `applyTheme` callback for another widget.

Use real UI interactions only when testing the browser UX itself. If you must drive native inputs from JavaScript, use the DOM prototype value setter before dispatching `input` / `change`; simple `el.value = ...` can be ignored by React's value tracker.

If an agent can only click and type in the browser but cannot execute JavaScript in the page, it cannot complete `vizual-test.html` rendering or live interactivity by itself. In that case, provide a static spec plus explanation, or use a host bridge, Playwright/CDP, or an auto-poll backend that calls `renderVizInMsg()` / `renderInteractiveVizInMsg()`.

For ordinary data-analysis prompts in `vizual-test.html`, answer in host message text and render a `GridLayout`/chart/dashboard spec. Do not choose DocView unless the user explicitly asks for annotation, comments, review, revision, or a reviewable document artifact.

For DocView review/revision tasks in `vizual-test.html`, use the DocView bridge instead of plain `renderVizInMsg()`:

```js
const id = window.createAiMsg();
window.streamText(id, '我生成了一份可批注报告。');
window.finishText(id);
const artifact = window.renderDocViewInMsg(id, {
  sections: [
    { id: 'title', type: 'heading', content: '经营分析报告', level: 1 },
    { id: 'summary', type: 'text', content: '收入下滑主要来自活跃用户下降。' },
  ],
  showPanel: true,
});
window.markPendingHandled?.();
```

When the user submits a DocView annotation, read the review state and create a proposal:

```js
// For automated QA or host-side simulation, create a thread through the bridge.
window.createDocViewThread?.(artifact.id, {
  sectionId: 'summary',
  selectedText: '收入下滑',
  body: '写详细一点',
});
window.submitDocViewThreads?.(artifact.id);

const state = window.getDocViewReviewState(artifact.id);
const submitted = state.threads.filter(t => t.status === 'submitted');
window.createDocViewRevision(artifact.id, {
  fromThreadIds: submitted.map(t => t.id),
  summary: '补充经营解释',
  patches: [
    { op: 'updateSection', sectionId: 'summary', updates: { content: '收入下滑主要来自活跃用户下降，同时高价值用户留存推高 ARPPU。' } },
  ],
});
```

`createDocViewThread(ref, input)` accepts:

- `sectionId` or `sectionIndex`: preferred target section. Use stable `sectionId` whenever the section has one.
- `selectedText` / `targetText` / `quote`: the text being commented on. The bridge uses this to infer a text range anchor.
- `targetType`: optional target kind such as `'text'`, `'chart'`, `'kpi'`, `'table'`, or `'section'`.
- `label`: optional human-readable target label.
- `body` or `content`: the comment text.
- `author`: optional `{ id, name, role }`.
- `anchor`: optional full DocView anchor. If omitted, `vizual-test.html` infers it from section metadata and selected text.

`submitDocViewThreads(ref, threadIds?)` returns the submitted thread list. Omit `threadIds` to submit every open thread in that DocView. `getDocViewReviewState(ref?)` returns `{ artifact, sections, threads, revisionProposals, events }`; a rendered section can produce multiple DOM targets, so do not count `[data-section-id]` nodes as the number of top-level document sections.

Do not directly overwrite the DocView artifact in response to a submitted annotation. The correct loop is: read submitted threads → create a revision proposal → let the user apply it in the panel, or call `applyDocViewRevision()` only when the user/host asked for automatic application.

## Rendered DocView Interaction Checklist

When the task is to operate an already-rendered DocView page, the Agent should use the UI, not regenerate the document:

1. Click a KPI/card/chart/table/section target, or select text in a text/markdown section.
2. Wait for the annotation popup.
3. Enter the comment or revision request.
4. Confirm the popup.
5. Verify the annotation appears in the annotation panel and the target is highlighted.
6. If the workflow requires submission, use the panel's submit/revision action and watch the host `onReviewAction` event. Legacy hosts may also emit `onAction`.

Expected host events include `threadCreated`, `threadsSubmitted`, `revisionProposalCreated`, and `revisionApplied`. Legacy `annotationAdded`, `batchSubmit`, and `requestRevision` events may also be present.

For Agent-driven revision loops, DocView is an SDK:

- The Agent/host must obtain `controllerRef` from the page/app.
- In `validation/vizual-test.html`, use `createDocViewThread()` for host-side simulated comments, then `getDocViewReviewState()`, `createDocViewRevision()`, and `applyDocViewRevision()`; the page bridge owns `controllerRef`.
- When `threadsSubmitted` fires, the Agent should return a `RevisionProposal`, not directly overwrite the document.
- Then call `controller.createRevisionProposal({ fromThreadIds, summary, patches, author, risk })`.
- Apply with `controller.applyRevision(proposalId)` or reject with `controller.rejectRevision(proposalId)`.
- Patches should target stable `sectionId` when available; use `sectionIndex` only as fallback.

## When to Use What

Think about what the user is trying to accomplish, then pick components that serve that goal.

### First Decision: Is This a Document or a Visualization?

Most requests are **not** DocView requests.

Use `GridLayout` or standalone components when:
- The user asks for a chart, dashboard, KPI board, table, comparison, analysis answer, or visual summary.
- The host/chat can display normal text outside the Vizual component.
- The output is meant to be read, not annotated or revised in-place.

Use `DocView` only when:
- The user explicitly asks for an annotatable/revisable document, review workflow, comments, highlights, revisions, version history, or asks to turn a generated output into a document review surface.
- The product surface supports DocView interactions (`onAction`, annotation panel, revision loop), not just static rendering.
- The document itself is the artifact, not merely a way to add paragraphs around charts.

If unsure between DocView and GridLayout, choose `GridLayout` and put the written explanation in the host text response.

**The user wants to see data visually** → Pick the chart that matches the data shape: categorical comparison → BarChart, time series → LineChart, proportions → PieChart, correlations → ScatterChart, flow → SankeyChart, funnel → FunnelChart, distribution → BoxplotChart/HistogramChart, multi-dimensional → RadarChart, calendar patterns → CalendarChart, etc. ComboChart handles dual-axis (bar + line). MermaidDiagram handles flowcharts and sequence diagrams.

**The user wants metrics at a glance** → KpiDashboard. It has `trend` and `trendValue` on each metric. Use it for big numbers with trend arrows.

**The user wants a table** → DataTable.

**The user wants a form, input fields, settings panel, survey** → FormBuilder. Even if they don't say "form" — if they describe input fields, dropdowns, or data collection, use FormBuilder.

**The user wants a board, timeline, org chart, or activity log** → Kanban, GanttChart, Timeline, OrgChart, AuditLog respectively.

**The user wants to adjust parameters interactively** → In `vizual-test.html`, call `renderInteractiveVizInMsg()` with a FormBuilder `value: { "$bindState": "/controls" }`, `initialState.controls`, `bubbleWidth`, and `makeSpec(state)`. Outside that test page, the host application must provide the same state-change bridge. If one control changes the target component, use conditional controls and generate only props that belong to that component. If you cannot execute page JavaScript, generate a static spec and clearly say live interactivity needs a host bridge.

**REMOVED: InteractivePlayground** — Do NOT generate specs with `type: "InteractivePlayground"` or `type: "interactive_playground"`. This component no longer exists.

**The user wants a document with annotation/revision behavior** → DocView. Use its structured section types: `heading`, `text`, `kpi`, `chart`, `table`, `callout`, `markdown`, `freeform`. Set `showPanel: true` if the user wants highlighting/comments. If the user only wants a normal report, dashboard, or exportable visual answer, use GridLayout and the artifact export APIs instead.

**The user wants things arranged in a layout** → GridLayout (multi-column), SplitLayout (two-pane), HeroLayout (top banner). These are containers — they hold other components as children. **Use GridLayout for dashboards and reports.** Only use DocView when the user explicitly wants an annotatable document with a sidebar panel.

**Something none of the above covers** → Use a host text answer plus the closest Vizual component. Use DocView `freeform` only inside a true document. Freeform HTML controls are static because event handlers are blocked.

## Anti-Patterns — What NOT to Do

These are the most common mistakes. Avoiding them is more important than memorizing the component list.

1. **Don't use freeform HTML when a dedicated component exists.** KPI metrics → KpiDashboard (not freeform `<div>` cards). Data tables → DataTable (not freeform `<table>`). Forms and inputs → FormBuilder (not freeform `<input>` elements). Freeform HTML controls are non-functional because event handlers are blocked. **Do NOT use InteractivePlayground** — it has been removed from Vizual.

2. **Don't embed components as freeform HTML inside DocView.** DocView has structured section types for charts, KPIs, and tables. Use `{ "type": "chart", "data": {...} }` not `{ "type": "freeform", "content": "<div>...</div>" }` for these.

3. **Don't use DocView as a generic chat/report wrapper.** If the user did not ask for annotations, comments, document review, revisions, or a reviewable document artifact, use `GridLayout`/standalone components and keep prose in the host message.

4. **Don't invent props.** Only use props that exist in the schema. When unsure, read the component's reference file. Common invented props that don't exist: `sort`, `filter`, `pagination` on DataTable; `drag` on Kanban; `height` on BarChart; `enableAnnotations` on DocView.

5. **Don't mix up the two `type` fields.** In the element definition: PascalCase (`"BarChart"`, `"DocView"`). Inside `props`: lowercase/snake_case literal (`"bar"`, `"doc_view"`). Layout components (GridLayout, SplitLayout, HeroLayout) have no `type` in props.

6. **Don't use removed components.** BigValue, Delta, Alert, Note, TextBlock, **InteractivePlayground** no longer exist. Use KpiDashboard for metrics. Use host text or DocView `callout` only when you are already using DocView.

7. **Don't expose incompatible interactive controls.** If a FormBuilder control switches chart type, make dependent controls conditional. BarChart-only options such as `horizontal` and `stacked` must not appear for LineChart or ComboChart, and `makeSpec(state)` must not pass those props to the wrong component.

8. **Don't treat `theme` as brand-color injection.** Chart `theme: "dark"` / `"light"` only selects a preset mode. For custom brand colors, the host must call `Vizual.loadDesignMd(markdown, { apply: true })`, or `renderInteractiveVizInMsg()` must provide `designMd` / `applyTheme`. Don't try to bypass the theme system with inline styles.

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

### Evidence extraction for messy user input

User input may come from spreadsheets, web pages, PDFs, chats, or copied reports. It may be malformed. Your job is to extract usable evidence, not require a perfect Markdown table.

Use this flow before generating charts from user-provided data:

1. Work from the raw user message (`pending.rawText` in `vizual-test.html`), not DOM-rendered chat text.
2. Look for structured blocks first: Markdown tables, CSV/TSV, pipe-separated rows, tab-separated spreadsheet copies, HTML tables, code blocks, and repeated lines with the same delimiter.
3. Then try semi-structured evidence: `label: value` lines, bullet lists with numbers, day/month/category records, Chinese metric labels, percentages, currency, durations, and counts.
4. Normalize only for parsing: trim whitespace, remove zero-width characters, repair headers split by spaces, accept `new user`, `new_user`, `new users`, and `新增用户` as equivalent candidates when the prompt makes that intent clear. Keep user-facing labels in the user's language.
5. Before rendering, do a quick evidence check in your answer text: mention the rows/columns or metrics you extracted, for example "解析到 14 行 × 8 列 daily_metric 数据". Keep it short.
6. If extraction is partial, render a `DataTable` preview of the rows you are confident about and state what is uncertain. Use charts only for fields you actually parsed.
7. If no numeric evidence can be extracted, ask for clarification or a cleaner paste. Do not silently fall back to fake data.

Hard rule: if the user's message contains an apparent table or multi-row numeric data, never answer "no raw data was provided" unless you have explicitly attempted extraction and can explain why every candidate failed. Never use placeholder/demo values in that case.

For analysis-review prompts, never invent missing business time series such as fake D1-D14 values just because the text mentions a breakpoint. Say in host text that the raw series is required to chart the real breakpoint, and use a table or rubric chart to show the issue instead.

Placeholder data is acceptable only when the user asks for an example/demo or gives no domain data at all. Keep placeholders obviously illustrative and do not present them as evidence.

## Theme

Default is dark. For light mode, set `theme: "light"` on chart components. This prop is not a brand palette. For full brand customization, the host app calls `Vizual.loadDesignMd(markdown, { apply: true })` before rendering, or the `vizual-test.html` interactive bridge uses `designMd` / `applyTheme`. Brand colors are outside the pure JSON spec.

## Export

Visual surfaces support `png` and `pdf`:

```js
await window.exportArtifact(artifact.id, { format: 'png', filename: 'chart' });
await window.exportArtifact(artifact.id, { format: 'pdf', filename: 'report' });
```

Tabular data supports `csv` and `xlsx`:

```js
await window.exportArtifact(artifact.id, { format: 'csv', filename: 'data' });
await window.exportArtifact(artifact.id, { format: 'xlsx', filename: 'data', sheetName: '明细' });
```

In `vizual-test.html`, `exportArtifact(ref, options)` exports the artifact resolved by `ref` (artifact id, message id, or `'last'`), not the whole chat page. PNG/PDF use the rendered DOM surface for that artifact; CSV/XLSX use the first tabular dataset in the artifact unless explicit rows/columns are provided by the host. Re-exporting an artifact after it has been modified or expanded can change PDF size because the rendered DOM is different.

Lower-level APIs are also available: `Vizual.exportToPNG`, `exportToPDF`, `exportDataToCSV`, `exportDataToXLSX`, and `downloadExport`. DocView export should target `[data-docview-viewport]` when the host wants document-only output without the annotation sidebar.

## Combining with Other Skills

- **design-md-parser** — When the user provides a design document and wants to extract theme tokens.
- **design-md-creator** — When the user wants to create a design system from scratch with an interactive preview.
