# Vizual

Use Vizual when a host Agent should answer with a native visual or interactive UI surface instead of plain text only: charts, KPI dashboards, tables, timelines, org charts, gantt charts, markdown blocks, structured forms, lightweight A2UI composition, live controls, and artifact updates.

Do not use Vizual as a keyword router or product gate. The user speaks naturally; the Agent decides whether a visual surface helps. If the user explicitly asks for a webpage, HTML, React app, landing page, game, custom SVG, or other creative artifact, follow that request unless the user also asks to embed a Vizual surface.

## Core Rules

1. **Use the live catalog when available.** Prefer MCP/tool discovery (`vizual_catalog`) or SDK manifest over this static file. The catalog is the source of truth.
2. **Text and Vizual may be mixed.** Put narrative conclusions in the host message and place Vizual blocks where they help prove or explore the answer.
3. **Interaction must be useful.** Add buttons/forms/filters only when the host or Agent can use the event. Never add interaction just to show that interaction exists.
4. **FormBuilder only collects input.** It submits structured data through `submitForm` for the host Agent to decide what to do next. Do not promise save, approval, dispatch, ticketing, or external writes unless the host explicitly provides that action.
5. **Separate Vizual actions from host product actions.** Local playground controls may update the current surface; agent round-trip actions must use real host-visible actions. Copy, export, download, share, and persistence controls belong to the host product shell, not Vizual native core.
6. **Do not invent components or props.** Validate before rendering whenever possible.
7. **Do not silently hide failures.** If a component is unsupported, return a clear unsupported-component error or gap metadata; do not fake success.

## Fastest Correct Shape (copy, then replace the data)

If you remember nothing else, emit a `components` array. Every item is one
native component. This is the shortest shape that validates:

```json
{ "components": [
  { "type": "BarChart", "title": "月度销量", "x": "month", "y": "sales",
    "data": [ { "month": "1月", "sales": 120 }, { "month": "2月", "sales": 168 } ] }
] }
```

Swap `type` and the fields for other surfaces — the data stays a flat array of
`{ key: value }` rows:

| Surface | `type` | Required props |
| --- | --- | --- |
| Bar / line / area | `BarChart` / `LineChart` / `AreaChart` | `x` (label key), `y` (numeric key or `[keys]`), `data` |
| Multi-series | same | `y: ["a","b"]`, each row has both numeric keys |
| Pie / funnel | `PieChart` / `FunnelChart` | `data` of `{ "name": "...", "value": 12 }` |
| Mixed bar+line | `ComboChart` | `x`, `data`, `series: [{ "type":"bar","y":"a" },{ "type":"line","y":"b" }]` |
| KPI cards | `KpiDashboard` | `metrics: [{ "label":"营收","value":"¥1.2M","trend":"up" }]` |
| Table | `DataTable` | `data` (array of row objects); `columns` optional |
| Scatter | `ScatterChart` | `x`, `y` (both numeric keys), `data` |

Rules that make charts actually render:
- `y` fields must be **real numbers** in every row (`120`, not `"120分"` and not `"1,234"` left as an unparseable label). Thousands separators like `"1,234"` are tolerated, but prefer raw numbers.
- The `x` value is the label/category and matches the `x` key in each row.
- `data` is never empty. If you have no data, answer in text instead.

## Self-Check Before Returning

1. Is every `type` in the catalog below? (No `DocView`, `Modal`, `Kanban`, raw HTML/React/ECharts/Chart.js.)
2. Does every chart have non-empty `data` with the referenced `x`/`y` keys present in each row, and are `y` values numeric?
3. Did you avoid inventing thresholds, industry averages, YoY %, or dates the user did not provide?
4. Is narrative prose in the assistant text, with only the structured UI in the tool input?

## If the Tool Reports `ok: false`

The result includes a `fixes` array and each issue carries a `fix` field with one
concrete action. Apply **every** fix and call `present_vizual_ui` again until
`ok: true`. Do not tell the user it rendered until the tool confirms `ok: true`.

If you accidentally emit an ECharts `option`, a Chart.js config, or a stringified
JSON blob for a simple bar/line/pie chart, the runtime auto-converts it and reports
an info-level `vizual.repair.*` note. That is a safety net, not the target — emit
native components directly.

## Chart Data Contract

Simple charts may use the fastest `x` / `y` / `data` shape above. For complex charts, multi-series charts, mixed-axis charts, or long-form grouped data, prefer `props.data` plus typed `props.encoding`, with optional `props.measures`.

- Use `encoding.x`, `encoding.y`, `encoding.value`, `encoding.label`, `encoding.color`, `encoding.size`, `encoding.date`, `encoding.source`, `encoding.target`, `encoding.low`, and `encoding.high` to point at fields in the data rows.
- Use `measures` for multiple numeric series or `ComboChart` layers. Each measure should include `field` and can include `label`, `mark` (`bar`, `line`, `scatter`), `axis` (`left` or `right`), and `size`.
- Use `encoding.color`, `seriesBy`, `colorBy`, or `groupBy` for categorical grouping in long-form data.
- Do not use a string `series` prop as the recommended path. Numeric series belong in `measures` or explicit series arrays; categorical grouping belongs in `encoding.color` / `seriesBy`.

## Current Agent-Facing Catalog

Charts: `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `ScatterChart`, `BubbleChart`, `BoxplotChart`, `HistogramChart`, `WaterfallChart`, `XmrChart`, `SankeyChart`, `FunnelChart`, `HeatmapChart`, `CalendarChart`, `SparklineChart`, `ComboChart`, `DumbbellChart`, `RadarChart`, `MermaidDiagram`.

Data: `DataTable`.

Business surfaces: `KpiDashboard`, `GanttChart`, `OrgChart`, `Timeline`.

Input: `FormBuilder`.

Content / composition / media / A2UI: `Markdown`, `Container`, `Row`, `Column`, `Card`, `Text`, `Image`, `Icon`, `List`, `Divider`, `Button`, `CheckBox`, `TextField`, `ChoicePicker`, `Slider`, `DateTimeInput`, `Tabs`, `Video`, `AudioPlayer`.

Runtime compatibility only: `HeroLayout` may exist in old artifacts but is not agent-facing. Do not generate it for new chat UI.

Removed from native core: `DocView`, `GridLayout`, `SplitLayout`, `FreeformHtml`, `Modal`, `Kanban`, `AuditLog`. Do not use these in new outputs, examples, or validation fixtures.

## When To Use Vizual

Use Vizual when visual structure materially improves the answer:

- Data analysis: trend, comparison, distribution, relationship, contribution, funnel, control, matrix, table detail.
- Business diagnosis: KPI cards, charts, risk notes, detail table, optional FormBuilder for follow-up inputs.
- Concept explanation: interactive sliders/choices only when changing parameters teaches the concept.
- Planning: `Timeline` or `GanttChart` when dates, dependencies, milestones, or progress matter.
- Organization or responsibility: `OrgChart` when hierarchy matters.
- User input collection: `FormBuilder` when structured fields are clearer than a long text prompt.

Do not use Vizual for short facts, pure text requests, lightweight writing/editing, or when the user explicitly asks for text only.

## Choosing Components

| Need | Prefer |
| --- | --- |
| KPI summary | `KpiDashboard` |
| Trend over time | `LineChart`, `AreaChart`, `SparklineChart` |
| Category comparison | `BarChart`, `DumbbellChart`, `DataTable` |
| Proportion | `PieChart`, `FunnelChart`, `SankeyChart` |
| Correlation / risk-return | `ScatterChart`, `BubbleChart` |
| Distribution / quality | `HistogramChart`, `BoxplotChart`, `XmrChart` |
| Calendar/time heat | `CalendarChart`, `HeatmapChart` |
| Mixed axes/layers | `ComboChart` |
| Process or concept diagram | `MermaidDiagram` |
| Detailed rows | `DataTable` |
| Narrative/risk/action note | host text or `Markdown` |
| Project schedule | `GanttChart` |
| Milestones/events | `Timeline` |
| Hierarchy | `OrgChart` |
| Structured user input | `FormBuilder` |
| Lightweight layout | `Column`, `Row`, `Container`, `Card`, `Tabs` |

Read specific references when needed:

| Component | Reference |
| --- | --- |
| Charts and DataTable | `references/charts/*.md` |
| KpiDashboard | `references/business/kpi-dashboard.md` |
| GanttChart | `references/business/gantt-chart.md` |
| OrgChart | `references/business/org-chart.md` |
| Timeline | `references/business/timeline.md` |
| FormBuilder | `references/input/form-builder.md` |
| Runtime patterns | `references/native-runtime.md` |
| Recipes | `references/recipes.md` |

## Output Shape: Native Operations

For Agent platforms that expose `present_vizual_ui`, return native operations. This is the preferred shape because it supports data binding, updates, and protocol fusion.

```json
{
  "surfaceId": "profit-diagnosis",
  "fallbackText": "销量和营收增长，但利润下降，核心原因是成本率、营销投入和低价高退货渠道拖累。",
  "display": { "mode": "inline", "title": "利润下降诊断", "persist": true },
  "input": [
    {
      "version": "v0.10",
      "createSurface": { "surfaceId": "profit-diagnosis", "catalogId": "vizual" }
    },
    {
      "version": "v0.10",
      "updateDataModel": {
        "surfaceId": "profit-diagnosis",
        "path": "/",
        "value": {
          "monthly": [
            { "month": "1月", "sales": 8, "revenue": 6400, "cost": 4000, "profit": 2400 },
            { "month": "6月", "sales": 21, "revenue": 16800, "cost": 14500, "profit": 2300 }
          ]
        }
      }
    },
    {
      "version": "v0.10",
      "updateComponents": {
        "surfaceId": "profit-diagnosis",
        "components": [
          {
            "id": "root",
            "type": "Column",
            "props": { "gap": 16 },
            "children": ["kpis", "profit-trend", "detail"]
          },
          {
            "id": "kpis",
            "type": "KpiDashboard",
            "props": {
              "type": "kpi_dashboard",
              "title": "关键判断",
              "metrics": [
                { "label": "销量变化", "value": "+162.5%", "trend": "up" },
                { "label": "利润变化", "value": "-4.2%", "trend": "down" }
              ]
            }
          },
          {
            "id": "profit-trend",
            "type": "ComboChart",
            "props": {
              "type": "combo",
              "title": "营收、成本、利润趋势",
              "data": "{{monthly}}",
              "encoding": { "x": { "field": "month", "type": "ordinal" } },
              "measures": [
                { "field": "revenue", "label": "营收", "mark": "bar", "axis": "left" },
                { "field": "cost", "label": "成本", "mark": "bar", "axis": "left" },
                { "field": "profit", "label": "利润", "mark": "line", "axis": "right" }
              ]
            }
          },
          {
            "id": "detail",
            "type": "DataTable",
            "props": {
              "type": "table",
              "title": "月度明细",
              "data": "{{monthly}}",
              "columns": [
                { "key": "month", "label": "月份" },
                { "key": "sales", "label": "销量" },
                { "key": "revenue", "label": "营收" },
                { "key": "cost", "label": "成本" },
                { "key": "profit", "label": "利润" }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

## Output Shape: Flat Vizual Spec

Use this shape when the host only accepts direct specs.

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "Column",
      "props": { "gap": 16 },
      "children": ["summary", "chart"]
    },
    "summary": {
      "type": "Markdown",
      "props": { "content": "### 结论\n利润下降不是销量问题，而是成本率和渠道结构问题。" },
      "children": []
    },
    "chart": {
      "type": "LineChart",
      "props": {
        "type": "line",
        "title": "利润趋势",
        "data": [
          { "month": "1月", "profit": 2400 },
          { "month": "6月", "profit": 2300 }
        ],
        "encoding": {
          "x": { "field": "month", "type": "ordinal" },
          "y": { "field": "profit", "type": "quantitative" }
        }
      },
      "children": []
    }
  }
}
```

## Actions

Available host-visible action names:

- `submitForm`: form/input submission to the host Agent.
- `applyFilter`: user changed a filter that should update visible state or host context.
- `drillDown`: user selected a chart point/table row/entity for deeper analysis.
- `selectLocation`: user selected a region, branch, store, or location-like entity.
- `updatePlan`: user updated a visible plan/status item.

Only bind an action when the output can use it. If the host has no relevant handler, leave the visual static or use a FormBuilder field that submits context back to the Agent.

Host product utilities are separate from Vizual actions. Copy, export, download, share, and persistence controls may be added by the host shell, but Vizual native core does not provide or promise those operations.

## Follow-Up Updates

When modifying a previous visual, use artifact patches if the host supports them:

```json
[
  { "type": "changeChartType", "targetId": "element:chart", "chartType": "LineChart" },
  { "type": "filterData", "targetId": "element:chart", "field": "region", "values": ["华东"] },
  { "type": "updateElementProps", "targetId": "element:kpis", "props": { "title": "华东区指标" } }
]
```

Use `targetMap` target IDs. Do not guess JSON paths when target IDs are available.

## liveControl

Use liveControl when changing parameters helps the user explore a concept or decision. It is a host bridge pattern, not a standalone spec. The host renders a FormBuilder bound to state and re-renders the preview from `makeSpec(state)`. For live preview controls, set `FormBuilder.props.showSubmit` to `false`; only show submit when the user is sending data back to the Agent.

Quality rules:

- Only expose controls that change something real.
- Keep state paths scoped, usually `/controls`.
- Do not use controls as decoration.

## Catalog Gaps

If no native component can express the useful surface, prefer a good text answer plus the closest native component. When the host supports gap capture, add metadata outside the UI spec so maintainers can later absorb the missing capability. Gap metadata must not block rendering or degrade the answer.

## Validation

Run local validation when possible:

```bash
node skills/vizual/scripts/validate-spec.js spec.json
```

Acceptance is visual: charts must actually render in a browser; FormBuilder must submit host-visible data; removed components must fail clearly; pure text and explicit webpage/code requests must not be forced into Vizual.
