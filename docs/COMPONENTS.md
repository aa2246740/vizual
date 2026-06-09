# Vizual Components

This document describes the current native core component catalog. The live Zod catalog in `src/catalog.ts` and `createVizualCatalogManifest()` remain the source of truth for schemas.

[中文版本](COMPONENTS.zh-CN.md)

Runtime registers 44 native core components. The runtime catalog and Agent-facing catalog use the same component set.

## Charts (19)

All chart components use native ECharts option builders owned by Vizual.

| Component | `props.type` | Use |
| --- | --- | --- |
| BarChart | `bar` | Category comparison, grouped/stacked/horizontal bars |
| LineChart | `line` | Time trend and multi-series trend |
| AreaChart | `area` | Filled trend and cumulative series |
| PieChart | `pie` | Proportion and donut charts |
| ScatterChart | `scatter` | Correlation, risk-return, two numeric dimensions |
| BubbleChart | `bubble` | Correlation with a size dimension |
| BoxplotChart | `boxplot` | Distribution and outliers |
| HistogramChart | `histogram` | Frequency distribution |
| WaterfallChart | `waterfall` | Incremental contribution and bridge analysis |
| XmrChart | `xmr` | Process monitoring and control limits |
| SankeyChart | `sankey` | Flow and contribution paths |
| FunnelChart | `funnel` | Conversion stages |
| HeatmapChart | `heatmap` | Matrix intensity |
| CalendarChart | `calendar` | Date-based intensity |
| SparklineChart | `sparkline` | Compact trend indicators |
| ComboChart | `combo` | Mixed bar/line layers and dual-axis comparisons |
| DumbbellChart | `dumbbell` | Before/after or range comparison |
| RadarChart | `radar` | Multi-dimensional profile comparison |
| MermaidDiagram | `mermaid` | Flowcharts, sequence diagrams, and conceptual diagrams |

Common chart guidance:

- Data must be non-empty unless the host is intentionally showing an empty state.
- Field names referenced by chart props must exist in the data rows.
- Use `action: "drillDown"` only when selecting a point should trigger deeper analysis.
- Do not add arbitrary chart props that are not in the schema.

## Data (1)

### DataTable

`props.type`: `table`

Use for detailed rows, ranked lists, branch/customer/product details, and evidence tables. Current native core does not promise built-in sorting, filtering, or pagination unless those props exist in the live schema.

## Business Surfaces (4)

### KpiDashboard

`props.type`: `kpi_dashboard`

Use for compact metric cards with value, trend, trend value, and optional color. Good for executive summaries and bank/retail/operations dashboards.

### GanttChart

`props.type`: `gantt`

Use for project schedules with dates, progress, owners, and dependencies. It is a visual schedule surface, not a project-management system.

### OrgChart

`props.type`: `org_chart`

Use for hierarchy, reporting lines, responsibility mapping, and branch/team structures.

### Timeline

`props.type`: `timeline`

Use for chronology, milestones, incident sequence, roadmap events, or process history.

## Input (1)

### FormBuilder

`props.type`: `form_builder`

Use when structured input is clearer than asking the user to type a long free-form answer. Supported field types include text, number, select, textarea, radio, checkbox, switch, slider, date/time, rating, and related variants in the schema.

Boundary:

- It submits data to the host Agent through `submitForm`.
- It can be used for liveControl state when bound with `$bindState`.
- It does not save, approve, dispatch, create tickets, or write external systems by itself.

## Content, Composition, Media, A2UI (20)

These components do not require a `props.type` literal unless the live schema says otherwise.

| Component | Use |
| --- | --- |
| Markdown | Short narrative blocks, risk notes, explanations inside a surface |
| Container | Flex container with direction, spacing, wrapping, sizing, background, border |
| Row | Horizontal composition |
| Column | Vertical composition and common root for multi-part surfaces |
| Card | Small framed group for repeated or self-contained items |
| Text | Typography primitive |
| Image | Image display |
| Icon | Icon or emoji-like marker display |
| List | Ordered or unordered text lists |
| Divider | Separator |
| Button | Host-visible action trigger when useful |
| CheckBox | Boolean input |
| TextField | Text-like input |
| ChoicePicker | Select/radio-like choice input |
| Slider | Numeric range input |
| DateTimeInput | Date/time input |
| Tabs | Compact tabbed grouping |
| Video | Video player |
| AudioPlayer | Audio player |

Composition guidance:

- Prefer `Column` root for chat visuals.
- Use `Row` for compact side-by-side controls or comparisons.
- Use `Container` only when spacing/sizing/background details matter.
- Keep layout lightweight; the host page owns page-level design.

## Removed From Native Core

The former document editor, page-layout, hero layout, free HTML, modal, board, and log surfaces have been removed from native core. New specs must use the current catalog above. Old payloads using removed component names should fail with stable unsupported-component errors instead of rendering a fake fallback.

## Actions

| Action | Emitted by | Meaning |
| --- | --- | --- |
| `submitForm` | FormBuilder, Button | Send structured input to the host Agent |
| `applyFilter` | DataTable, Button, ChoicePicker, Slider | Apply a host-visible filter |
| `drillDown` | Charts, DataTable | Request deeper analysis for a selected item |
| `selectLocation` | DataTable, Button, ChoicePicker | Select branch/region/store/location |
| `updatePlan` | Timeline, FormBuilder, Button | Return a plan/status update to the host |

Actions are events, not business promises. The host decides what happens after receiving them.

## Validation

Use the live catalog or:

```bash
node skills/vizual/scripts/validate-spec.js spec.json
```

Browser acceptance must inspect actual rendered output, including charts and forms. JSON-only validation is not enough for UI changes.
