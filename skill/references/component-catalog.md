# AI RenderKit Component Catalog — Complete Reference

This file contains the complete schema for all 42 components.
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
- `type`: must match one of the 42 registered component names
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

## Charts (19) — ECharts via mviz Bridge

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

### RadarChart
**type value:** `"radar"`

Radar chart for multi-dimensional comparison. Supports indicator mode (indicators + series) and table mode (data + x + y).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"radar"` | yes | fixed literal |
| title | string | no | chart title |
| indicators | { name: string, max?: number }[] | no | dimension definitions |
| series | { name: string, values: number[] }[] | no | data series (one per indicator set) |
| x | string | no | category field (table mode) |
| y | string \| string[] | no | value field(s) (table mode) |
| data | object[] | no | data array (table mode) |

Indicator mode:
```json
{
  "type": "radar",
  "title": "Car Comparison",
  "indicators": [
    { "name": "Speed", "max": 100 },
    { "name": "Safety", "max": 100 },
    { "name": "Comfort", "max": 100 },
    { "name": "Fuel", "max": 100 },
    { "name": "Price", "max": 100 }
  ],
  "series": [
    { "name": "Car A", "values": [85, 70, 90, 60, 80] },
    { "name": "Car B", "values": [70, 90, 75, 85, 65] }
  ]
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

---

## Interactive/Input Components (4)

### InputText
**type value:** `"input_text"`

Single-line text input field.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"input_text"` | yes | fixed literal |
| label | string | no | field label |
| placeholder | string | no | placeholder text |
| value | string | no | current value |
| inputType | `"text"` \| `"email"` \| `"password"` \| `"number"` \| `"url"` \| `"tel"` | no | HTML input type (default `"text"`) |
| disabled | boolean | no | disable input |
| required | boolean | no | mark as required |
| description | string | no | help text below input |
| error | string | no | error message |

```json
{
  "type": "input_text",
  "label": "Email Address",
  "placeholder": "you@example.com",
  "inputType": "email",
  "required": true,
  "description": "We will never share your email."
}
```

### InputSelect
**type value:** `"input_select"`

Dropdown select input.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"input_select"` | yes | fixed literal |
| label | string | no | field label |
| placeholder | string | no | placeholder text |
| value | string | no | currently selected value |
| options | { label: string, value: string }[] | yes | selectable options |
| disabled | boolean | no | disable select |
| required | boolean | no | mark as required |
| description | string | no | help text below select |
| error | string | no | error message |

```json
{
  "type": "input_select",
  "label": "Department",
  "placeholder": "Select a department",
  "options": [
    { "label": "Engineering", "value": "eng" },
    { "label": "Marketing", "value": "mkt" },
    { "label": "Sales", "value": "sales" },
    { "label": "HR", "value": "hr" }
  ],
  "required": true
}
```

### InputFile
**type value:** `"input_file"`

File upload input.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"input_file"` | yes | fixed literal |
| label | string | no | field label |
| accept | string | no | accepted file types (e.g. `".png,.jpg"`, `"image/*"`) |
| multiple | boolean | no | allow multiple file selection |
| maxFiles | number | no | max number of files (only when `multiple` is true) |
| disabled | boolean | no | disable input |
| description | string | no | help text |
| error | string | no | error message |
| asBase64 | boolean | no | return file contents as base64 string |

> **Note:** When `multiple` is false or omitted, the component operates in single-file mode and returns one file. When `multiple` is true, it accepts up to `maxFiles` files.

```json
{
  "type": "input_file",
  "label": "Upload Avatar",
  "accept": "image/png,image/jpeg",
  "description": "PNG or JPEG, max 2MB.",
  "asBase64": true
}
```

Multi-file mode:
```json
{
  "type": "input_file",
  "label": "Attach Documents",
  "accept": ".pdf,.doc,.docx",
  "multiple": true,
  "maxFiles": 5,
  "description": "Upload up to 5 documents."
}
```

### FormBuilder
**type value:** `"form_builder"`

Dynamic form with multiple field types, validation, and conditional visibility.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"form_builder"` | yes | fixed literal |
| title | string | no | form title |
| columns | number | no | layout columns (default 1) |
| submitLabel | string | no | submit button text (default `"Submit"`) |
| fields | FormField[] | yes | array of field definitions |

**Supported field types (18):**

| Field type | Description |
|------------|-------------|
| `text` | Single-line text input |
| `email` | Email input with validation |
| `password` | Password input (masked) |
| `number` | Numeric input |
| `url` | URL input with validation |
| `tel` | Telephone input |
| `select` | Dropdown select |
| `file` | File upload |
| `textarea` | Multi-line text input |
| `radio` | Radio button group |
| `checkbox` | Checkbox (single or group) |
| `switch` | Toggle switch |
| `slider` | Range slider |
| `color` | Color picker |
| `date` | Date picker |
| `datetime` | Date and time picker |
| `time` | Time picker |
| `rating` | Star rating |

**Common field definition props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| name | string | yes | field identifier (used as form data key) |
| type | string | yes | one of the 18 field types above |
| label | string | no | field label |
| required | boolean | no | mark as required |
| disabled | boolean | no | disable field |
| description | string | no | help text |
| defaultValue | any | no | initial value |
| dependsOn | string | no | name of another field this field depends on |
| showWhen | { field: string, value: any } | no | show this field only when `dependsOn` field matches `value` |

**Field-specific props:**

| Field type | Additional props |
|------------|-----------------|
| `select` | `options: { label: string, value: string }[]` |
| `radio` | `options: { label: string, value: string }[]` |
| `checkbox` | `options?: { label: string, value: string }[]` (omit for single boolean checkbox) |
| `slider` | `min?: number`, `max?: number`, `step?: number` |
| `rating` | `max?: number` (default 5) |
| `file` | `accept?: string`, `multiple?: boolean`, `maxFiles?: number`, `asBase64?: boolean` |
| `textarea` | `rows?: number`, `maxLength?: number` |

```json
{
  "type": "form_builder",
  "title": "Event Registration",
  "columns": 2,
  "submitLabel": "Register Now",
  "fields": [
    {
      "name": "fullName",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "description": "As shown on your ID"
    },
    {
      "name": "email",
      "type": "email",
      "label": "Email",
      "required": true
    },
    {
      "name": "phone",
      "type": "tel",
      "label": "Phone Number"
    },
    {
      "name": "ticketType",
      "type": "select",
      "label": "Ticket Type",
      "options": [
        { "label": "Standard — $99", "value": "standard" },
        { "label": "VIP — $249", "value": "vip" },
        { "label": "Speaker", "value": "speaker" }
      ],
      "required": true
    },
    {
      "name": "dietaryNotes",
      "type": "textarea",
      "label": "Dietary Requirements",
      "rows": 3
    },
    {
      "name": "agreeTerms",
      "type": "checkbox",
      "label": "I agree to the terms and conditions",
      "required": true
    }
  ]
}
```

Conditional field example (show `companyName` only when `attendeeType` is `"corporate"`):
```json
{
  "type": "form_builder",
  "title": "Registration",
  "fields": [
    {
      "name": "attendeeType",
      "type": "radio",
      "label": "Attendee Type",
      "options": [
        { "label": "Individual", "value": "individual" },
        { "label": "Corporate", "value": "corporate" }
      ]
    },
    {
      "name": "companyName",
      "type": "text",
      "label": "Company Name",
      "dependsOn": "attendeeType",
      "showWhen": { "field": "attendeeType", "value": "corporate" }
    }
  ]
}
```
