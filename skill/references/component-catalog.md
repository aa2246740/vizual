# AI RenderKit Component Catalog — Complete Reference

This file contains the complete schema for all 37 components.
Read this when you need to generate JSON specs for ai-render-kit.

---

## Spec Format

All AI RenderKit output follows this structure:

```json
{
  "root": "<element-id>",
  "elements": {
    "<element-id>": {
      "type": "<ComponentType>",
      "props": { ... },
      "children": ["<child-id>", ...]
    }
  }
}
```

- `root`: the ID of the top-level element
- `elements`: map of element IDs to their definitions
- `type`: must match one of the 37 registered component names
- `props`: must match the component's Zod schema exactly
- `children`: array of child element IDs (for composition)

## Multi-component composition

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "VerticalLayout",
      "props": {},
      "children": ["header", "chart", "footer"]
    },
    "header": {
      "type": "KpiDashboard",
      "props": { ... },
      "children": []
    },
    "chart": {
      "type": "BarChart",
      "props": { ... },
      "children": []
    },
    "footer": {
      "type": "DataTable",
      "props": { ... },
      "children": []
    }
  }
}
```

---

## Charts (18) — ECharts via mviz Bridge

All chart components share these optional props:
- `title?: string` — chart title
- `theme?: "light" | "dark"` — color theme
- `height?: number` — chart height in pixels (default 300)

### BarChart
**type value:** `"bar"`

Column chart with grouped, stacked, and horizontal variants.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"bar"` | yes | fixed literal |
| x | string | yes | X axis field name |
| y | string \| string[] | yes | Y axis field(s). Array = multiple series |
| data | object[] | yes | data array |
| stacked | boolean | no | stack series |
| horizontal | boolean | no | rotate axes |

```json
{
  "type": "bar",
  "title": "Quarterly Revenue",
  "x": "quarter",
  "y": "revenue",
  "data": [
    { "quarter": "Q1", "revenue": 120 },
    { "quarter": "Q2", "revenue": 200 },
    { "quarter": "Q3", "revenue": 180 },
    { "quarter": "Q4", "revenue": 310 }
  ]
}
```

Multi-series:
```json
{
  "type": "bar",
  "x": "quarter",
  "y": ["online", "offline"],
  "data": [
    { "quarter": "Q1", "online": 80, "offline": 40 },
    { "quarter": "Q2", "online": 120, "offline": 80 }
  ],
  "stacked": true
}
```

### LineChart
**type value:** `"line"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"line"` | yes | |
| x | string | no | X axis field |
| y | string \| string[] | no | Y axis field(s) |
| data | object[] | yes | data |
| smooth | boolean | no | smooth curves |
| multiSeries | boolean | no | auto multi-series mode |

```json
{
  "type": "line",
  "x": "month",
  "y": ["users", "revenue"],
  "data": [
    { "month": "Jan", "users": 1200, "revenue": 45000 },
    { "month": "Feb", "users": 1500, "revenue": 52000 }
  ],
  "smooth": true
}
```

### AreaChart
**type value:** `"area"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"area"` | yes | |
| x | string | no | |
| y | string \| string[] | no | |
| data | object[] | yes | |
| stacked | boolean | no | stack areas |
| smooth | boolean | no | smooth curves |

### PieChart
**type value:** `"pie"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"pie"` | yes | |
| value | string | no | value field |
| label | string | no | label field |
| data | object[] | yes | |
| donut | boolean | no | donut/ring mode |

```json
{
  "type": "pie",
  "label": "category",
  "value": "amount",
  "data": [
    { "category": "Product A", "amount": 40 },
    { "category": "Product B", "amount": 35 },
    { "category": "Product C", "amount": 25 }
  ],
  "donut": true
}
```

### ScatterChart
**type value:** `"scatter"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| x | string | no | |
| y | string \| string[] | no | |
| data | object[] | yes | |
| size | string | no | bubble size field |
| groupField | string | no | group/category field |

### BubbleChart
**type value:** `"bubble"`

Same as ScatterChart, `size` field is the bubble radius dimension.

### BoxplotChart
**type value:** `"boxplot"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| valueField | string | no | numeric field |
| groupField | string | no | grouping field |
| data | object[] | yes | |

### HistogramChart
**type value:** `"histogram"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | string | no | field to histogram |
| bins | number | no | number of bins |
| data | object[] | yes | |

### WaterfallChart
**type value:** `"waterfall"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | no | category label field |
| value | string | no | numeric field (positive/negative) |
| data | object[] | yes | |

### XmrChart
**type value:** `"xmr"`

Control chart for process monitoring.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | string | no | measurement field |
| data | object[] | yes | |

### SankeyChart
**type value:** `"sankey"`

Flow diagram with explicit nodes and links.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| nodes | { name: string }[] | no | node definitions |
| links | { source: string, target: string, value: number }[] | no | flow connections |

```json
{
  "type": "sankey",
  "nodes": [
    { "name": "Visit" }, { "name": "Signup" }, { "name": "Purchase" }
  ],
  "links": [
    { "source": "Visit", "target": "Signup", "value": 100 },
    { "source": "Signup", "target": "Purchase", "value": 30 }
  ]
}
```

### FunnelChart
**type value:** `"funnel"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | string | no | numeric field |
| label | string | no | stage label field |
| data | object[] | yes | |

### HeatmapChart
**type value:** `"heatmap"`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| xField | string | no | X dimension |
| yField | string | no | Y dimension |
| valueField | string | no | intensity field |
| data | object[] | yes | |

### CalendarChart
**type value:** `"calendar"`

Calendar heatmap for time-series patterns.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| dateField | string | no | date field (YYYY-MM-DD) |
| valueField | string | no | intensity field |
| range | string | no | year range (e.g. "2024") |
| data | object[] | yes | |

### SparklineChart
**type value:** `"sparkline"`

Inline mini chart.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | string | no | value field |
| sparkType | `"line"` \| `"bar"` \| `"pct_bar"` | no | chart variant |
| data | object[] | yes | |

### ComboChart
**type value:** `"combo"`

Mixed bar + line chart.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| x | string | no | X axis field |
| series | { type: `"bar"` \| `"line"`, y: string }[] | no | series config |
| data | object[] | yes | |

```json
{
  "type": "combo",
  "x": "month",
  "series": [
    { "type": "bar", "y": "revenue" },
    { "type": "line", "y": "growth" }
  ],
  "data": [
    { "month": "Jan", "revenue": 100, "growth": 5 },
    { "month": "Feb", "revenue": 150, "growth": 8 }
  ]
}
```

### DumbbellChart
**type value:** `"dumbbell"`

Range comparison chart.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| low | string | no | low value field |
| high | string | no | high value field |
| groupField | string | no | group field |
| data | object[] | yes | |

### MermaidDiagram
**type value:** `"mermaid"`

Renders Mermaid syntax diagrams (flowchart, sequence, gantt, etc.).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| code | string | yes | Mermaid syntax |
| theme | `"default"` \| `"dark"` \| `"forest"` \| `"neutral"` | no | |

```json
{
  "type": "mermaid",
  "code": "graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Execute]\n  B -->|No| D[End]"
}
```

---

## UI Components (8)

### BigValue
**type value:** `"big_value"`

Large metric display with trend indicator.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"big_value"` | yes | |
| title | string | no | label above value |
| value | string \| number | yes | the main number |
| prefix | string | no | e.g. "$" |
| suffix | string | no | e.g. "%", "USD" |
| trend | `"up"` \| `"down"` \| `"flat"` | no | direction |
| trendValue | string | no | e.g. "+15.3%" |

### Delta
**type value:** `"delta"`

Value change indicator.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | string \| number | yes | current value |
| previousValue | string \| number | no | previous value |
| label | string | no | |
| direction | `"up"` \| `"down"` \| `"flat"` | no | |
| showPercentage | boolean | no | |

### Alert
**type value:** `"alert"`

Banner with severity level.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| message | string | yes | alert text |
| severity | `"info"` \| `"warning"` \| `"error"` \| `"success"` | no | |

### Note
**type value:** `"note"`

Callout with variant style.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | note text |
| variant | `"info"` \| `"tip"` \| `"warning"` \| `"important"` | no | |

### TextBlock
**type value:** `"text"`

Styled text display.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | text content |
| fontSize | number | no | |
| fontWeight | `"normal"` \| `"bold"` \| `"light"` | no | |
| align | `"left"` \| `"center"` \| `"right"` | no | |
| color | string | no | CSS color |

### TextArea
**type value:** `"textarea"`

Monospace multi-line text.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | text content |
| title | string | no | |
| maxLines | number | no | |

### DataTable
**type value:** `"table"`

Structured data table.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| columns | { key: string, label?: string, align?: `"left"` \| `"center"` \| `"right"` }[] | no | column defs |
| data | object[] | yes | row data |
| striped | boolean | no | alternate row colors |
| compact | boolean | no | reduce padding |

### EmptySpace
**type value:** `"empty_space"`

Vertical spacer.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| height | number | no | pixels (default 16) |

---

## Business Components (11)

### Timeline
**type value:** `"timeline"`

Vertical event timeline.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| events | { date: string, title: string, description?: string }[] | yes | events |

### Kanban
**type value:** `"kanban"`

Task board with columns and cards.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| columns | { id: string, title: string, color?: string, cards: { id: string, title: string, description?: string, tags?: string[], assignee?: string, priority?: `"low"` \| `"medium"` \| `"high"` }[] }[] | yes | |

### GanttChart
**type value:** `"gantt"`

Project schedule with task bars.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| tasks | { id: string, name: string, start: string, end: string, progress?: number(0-100), color?: string, dependencies?: string[] }[] | yes | |

### OrgChart
**type value:** `"org_chart"`

Organization hierarchy.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| nodes | { id: string, name: string, role?: string, parentId?: string \| null, avatar?: string }[] | yes | |

### KpiDashboard
**type value:** `"kpi_dashboard"`

Multi-metric dashboard cards.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| metrics | { label: string, value: string \| number, prefix?: string, suffix?: string, trend?: `"up"` \| `"down"` \| `"flat"`, trendValue?: string, color?: string }[] | yes | |
| columns | number | no | grid columns |

### BudgetReport
**type value:** `"budget_report"`

Budget vs actual with variance bars.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| categories | { name: string, budget: number, actual: number, color?: string }[] | yes | |
| showVariance | boolean | no | |

### FeatureTable
**type value:** `"feature_table"`

Product comparison matrix.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| products | string[] | yes | column headers |
| features | { name: string, category?: string, values: (boolean \| string \| number)[] }[] | yes | one value per product |

### AuditLog
**type value:** `"audit_log"`

Operation log with timestamps.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| entries | { timestamp: string, user: string, action: string, target?: string, details?: string, severity?: `"info"` \| `"warning"` \| `"error"` }[] | yes | |

### JsonViewer
**type value:** `"json_viewer"`

Syntax-highlighted JSON display.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data | any | yes | JSON data to display |
| expanded | boolean | no | expand all by default |
| maxDepth | number | no | max expansion depth |

### CodeBlock
**type value:** `"code_block"`

Code display with syntax hints.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| code | string | yes | source code |
| language | string | no | language identifier |
| showLineNumbers | boolean | no | |

### FormView
**type value:** `"form_view"`

Key-value data display in form layout.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| fields | { label: string, value: any, type?: `"text"` \| `"number"` \| `"date"` \| `"email"` \| `"url"` \| `"boolean"` }[] | yes | |
| columns | number | no | layout columns |
