# Vizual Component Catalog — Complete Reference

This file contains the complete schema for all 32 components.
Simple display components (KPIs, alerts, notes, text, code, progress bars) are handled by DocView freeform HTML sections instead of dedicated components.
Read this when you need to generate JSON specs for Vizual.

---

## Spec Format

All Vizual output follows this structure:

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
- `type`: must match one of the 32 registered component names
- `props`: must match the component's Zod schema exactly
- `children`: array of child element IDs (for composition)

## Multi-component composition

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "GridLayout",
      "props": { "type": "grid_layout", "columns": 1 },
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

## Data Components (1)

### DataTable
**type value:** `"table"`

Structured data table.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| columns | { key: string, label?: string, align?: `"left"` \| `"center"` \| `"right"` }[] | no | column defs |
| data | object[] | yes | row data |
| striped | boolean | no | alternate row colors |
| compact | boolean | no | reduce padding |

---

## Complex UI Components (4)

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

---

## Business Components (2)

### KpiDashboard
**type value:** `"kpi_dashboard"`

Multi-metric dashboard cards.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| metrics | { label: string, value: string \| number, prefix?: string, suffix?: string, trend?: `"up"` \| `"down"` \| `"flat"`, trendValue?: string, color?: string }[] | yes | |
| columns | number | no | grid columns |

### AuditLog
**type value:** `"audit_log"`

Operation log with timestamps.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| entries | { timestamp: string, user: string, action: string, target?: string, details?: string, severity?: `"info"` \| `"warning"` \| `"error"` }[] | yes | |

---

## Input Components (1)

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

---

## DocView — Annotatable Document (1)

### DocView
**type value:** `"doc_view"`

Interactive document with sections (text, headings, charts, KPIs, tables, callouts, embedded components) and annotation support. Users can annotate any text or component target, submit annotations for AI revision, and the library automatically detects orphaned annotations when content changes.

```json
{
  "type": "doc_view",
  "title": "Quarterly Report",
  "sections": [
    { "type": "heading", "content": "Q1 Performance Report" },
    { "type": "text", "content": "Revenue grew 15% year-over-year, driven by strong enterprise sales and new market penetration." },
    { "type": "chart", "content": "", "data": { "chartType": "BarChart", "x": "quarter", "y": "revenue", "data": [{"quarter":"Q1","revenue":120},{"quarter":"Q2","revenue":200}] } },
    { "type": "kpi", "content": "", "data": { "metrics": [{"label":"Revenue","value":"$12.3M","trend":"up","trendValue":"+15%"}] } },
    { "type": "table", "content": "", "data": { "columns": [{"key":"name","label":"Name"},{"key":"value","label":"Value"}], "data": [{"name":"Q1","value":120},{"name":"Q2","value":200}] } },
    { "type": "callout", "content": "Note: All figures are preliminary and subject to audit." },
    { "type": "component", "content": "", "data": { "componentType": "KpiDashboard", "metrics": [{"label":"Revenue","value":"$1.2M","trend":"up"}] } }
  ],
  "showPanel": true,
  "panelPosition": "right"
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"doc_view"` | yes | Fixed literal |
| title | string | no | Document title |
| sections | Section[] | yes | Array of document sections (see below) |
| showPanel | boolean | no | Show annotation panel sidebar (default: true) |
| panelPosition | `"right"` \| `"left"` \| `"bottom"` | no | Panel position (default: right) |
| annotations | Annotation[] | no | Controlled annotations (external state) |
| onAnnotationsChange | function | no | Callback when annotations change |
| onAction | function | no | Callback for annotation actions |

**Section fields** (all section types support these optional fields):
- `aiContext: string` — AI-written semantic description for annotation context. Helps the AI agent understand what a section contains when processing annotations.
- `layout: "default" \| "hero" \| "split" \| "grid" \| "banner" \| "card" \| "compact"` — visual layout variant for the section.

**Layout variants:**
| Layout | Effect |
|--------|--------|
| `default` | No special wrapping |
| `hero` | Gradient background, centered text, min-height 180px |
| `split` | 1:1 two-column grid |
| `grid` | N-column grid (KPI sections default to 3 columns) |
| `banner` | Accent left border + secondary background |
| `card` | Elevated card with shadow |
| `compact` | Dense layout, small text |

**Section Types:**

| type | content | data | Description |
|------|---------|------|-------------|
| heading | string | - | Section heading |
| text | string | - | Text paragraph |
| chart | "" | { chartType, x, y, data, ... } | Embedded chart (uses chart component props) |
| kpi | "" | { metrics: [{label, value, trend, trendValue}] } | KPI dashboard cards |
| table | "" | { columns: [{key, label}], data: [...] } | Data table |
| callout | string | - | Highlighted callout note |
| component | "" | { componentType, ...props } | Embedded vizual component |
| markdown | string (markdown content) | - | Renders markdown with headings, lists, code blocks, tables, blockquotes, links, images. Sanitized via DOMPurify with theme-aware scoped CSS. |
| freeform | string (HTML with inline CSS) | - | Renders arbitrary HTML with inline `style` allowed. Blocks `class` attribute and event handlers. Semantic elements (h1-h6, section, article, aside, header, footer, figure, details) auto-receive annotation targeting. |

**Annotation Actions (via onAction callback):**

| Action | Trigger | Params |
|--------|---------|--------|
| annotationAdded | User creates annotation | { annotation, sectionContexts: Map<sectionIndex, SectionContext>, sectionContext?: SectionContext } |
| annotationDeleted | User deletes annotation | { annotation } |
| annotationClicked | User clicks annotation | { annotation } |
| requestRevision | User submits single annotation for revision | { annotationId, text, note, target, sectionContext?: SectionContext } |
| batchSubmit | User submits all draft annotations | { annotations: [{id, text, note, color, target, sectionContext?}] } |

**SectionContext structure** (included in annotation payloads):
```typescript
interface SectionContext {
  sectionIndex: number   // 0-based index in sections array
  sectionType: string    // "heading", "text", "chart", "kpi", "markdown", etc.
  title?: string         // heading text if applicable
  aiContext?: string     // the aiContext field from the section
  contentSummary: string // auto-generated summary, e.g. "Revenue: $12.3M (+15%)"
}
```

**Annotation Lifecycle:**
- draft -> active (submitted for revision)
- active -> resolved (AI has addressed the annotation)
- active -> orphaned (AI revised the text, annotation no longer matches)

**Hooks for Custom Integration:**
- `useAnnotations` — annotation CRUD + orphan detection
- `useTextSelection` — browser text selection detection
- `useRevisionLoop` — submitAllDrafts, requestRevision, onContentRevised
- `useVersionHistory` — document version snapshots and rollback

**Sub-components for Custom Layouts:**
- `AnnotationOverlay` — highlights annotations on text
- `AnnotationPanel` — sidebar panel for annotation management
- `AnnotationInput` — popup for creating new annotations
- `SectionRenderer` — renders sections array into React elements

---

## Layout Components (3)

### GridLayout
**type value:** `"grid_layout"`

CSS Grid container for arranging child components in a grid.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"grid_layout"` | yes | fixed literal |
| columns | number | no | number of grid columns (default 3) |
| gap | number | no | gap between items in pixels (default 16) |
| columnWidths | string[] | no | explicit column widths (CSS values) |

```json
{
  "type": "GridLayout",
  "props": { "type": "grid_layout", "columns": 3, "gap": 16 },
  "children": ["card1", "card2", "card3"]
}
```

### SplitLayout
**type value:** `"split_layout"`

Two-pane layout with configurable direction and ratio.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"split_layout"` | yes | fixed literal |
| direction | `"horizontal"` \| `"vertical"` | no | split direction (default horizontal) |
| ratio | number | no | split ratio 10-90, percentage for first pane (default 50) |

```json
{
  "type": "SplitLayout",
  "props": { "type": "split_layout", "direction": "horizontal", "ratio": 40 },
  "children": ["leftPane", "rightPane"]
}
```

### HeroLayout
**type value:** `"hero_layout"`

Hero banner section with configurable height and background.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"hero_layout"` | yes | fixed literal |
| height | number | no | hero section height in pixels (default 240) |
| background | `"gradient"` \| `"solid"` \| `"transparent"` | no | background style (default gradient) |
| align | `"left"` \| `"center"` \| `"right"` | no | content alignment (default center) |

```json
{
  "type": "HeroLayout",
  "props": { "type": "hero_layout", "height": 300, "background": "gradient", "align": "center" },
  "children": ["heroContent"]
}
```
