---
name: vizual
version: "1.0.0"
description: >
  Generate structured JSON specs for Vizual's 43 visualization components
  (19 ECharts charts, 8 UI components, 11 business components, 4 interactive/input
  components, plus DocView annotatable document) that render via the json-render
  platform. Use this skill whenever the user asks for charts, graphs, dashboards,
  KPIs, kanban boards, timelines, data tables, forms, or any kind of data
  visualization — even if they don't mention Vizual by name. This skill is designed
  for AI agents (Claude Code, Cursor, etc.) that generate code, not for chatbots.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Vizual Skill

You help users generate JSON specs that the Vizual npm package renders as interactive visualizations. The package bridges mviz's chart builder, ECharts, and custom React components into a unified json-render catalog.

## How It Works

1. User describes what they want to visualize (in natural language or with data)
2. You output a JSON spec following the exact format below
3. The developer passes this JSON to `<Renderer spec={spec} registry={registry} />` in their React app
4. The matching React component renders (ECharts chart, styled HTML, etc.)

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

Critical rules:
- `type` in the element definition is the **PascalCase component name** (e.g. `BarChart`, `KpiDashboard`)
- `type` inside `props` is a **lowercase/snake_case literal** specific to each component (e.g. `"bar"`, `"kpi_dashboard"`, `"big_value"`)
- Every element must have `children: []` (even if empty)
- Props must exactly match the component's schema — don't invent fields

## Single Component

For simple requests, use a single element:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "title": "Monthly Sales",
        "x": "month",
        "y": "sales",
        "data": [
          { "month": "Jan", "sales": 100 },
          { "month": "Feb", "sales": 150 }
        ]
      },
      "children": []
    }
  }
}
```

## Multi-Component Composition

For dashboards or reports, use json-render layout elements to compose:

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

## Component Selection Guide

When deciding which component to use, consider the user's intent:

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
| "radar", "spider chart", "multi-dimensional" | RadarChart | `radar` |
| "big number", "metric" | BigValue | `big_value` |
| "change", "delta", "difference" | Delta | `delta` |
| "alert", "warning banner" | Alert | `alert` |
| "note", "callout", "tip" | Note | `note` |
| "text", "paragraph" | TextBlock | `text` |
| "code block", "query" | TextArea | `textarea` |
| "table", "data grid" | DataTable | `table` |
| "space", "spacer" | EmptySpace | `empty_space` |
| "timeline", "milestones" | Timeline | `timeline` |
| "kanban", "board", "task board" | Kanban | `kanban` |
| "gantt", "schedule", "timeline chart" | GanttChart | `gantt` |
| "org chart", "hierarchy" | OrgChart | `org_chart` |
| "KPI dashboard", "metrics dashboard" | KpiDashboard | `kpi_dashboard` |
| "budget", "budget vs actual" | BudgetReport | `budget_report` |
| "comparison table", "feature matrix" | FeatureTable | `feature_table` |
| "audit log", "operation log" | AuditLog | `audit_log` |
| "JSON viewer" | JsonViewer | `json_viewer` |
| "code block" | CodeBlock | `code_block` |
| "form", "key-value" | FormView | `form_view` |
| "text input", "text field" | InputText | `input_text` |
| "select", "dropdown" | InputSelect | `input_select` |
| "file upload", "file input" | InputFile | `input_file` |
| "form builder", "dynamic form" | FormBuilder | `form_builder` |

## Data Handling

When the user provides data:
- Use it exactly as given — don't modify numbers or labels
- Map user's column/field names to the `x`, `y`, `value`, etc. props
- If the user gives summary statistics, embed them directly

When the user does NOT provide data:
- Use realistic placeholder data that makes sense for the domain
- Don't use obviously fake data like "aaa", "xxx", or sequential numbers only
- Make the sample data tell a story (e.g., upward trend, seasonal dip, top performer)

## Common Mistakes to Avoid

1. **Wrong type literal**: Each component has a specific `type` value in props. `BarChart` uses `"bar"`, not `"BarChart"`. `KpiDashboard` uses `"kpi_dashboard"`, not `"kpi"`. Check the catalog if unsure.

2. **Missing data array**: All chart components need `data: [...]`. Even if showing a single value, wrap it in an array.

3. **Inventing props**: Only use props defined in the schema. Don't add `color`, `width`, `style` etc. unless the schema lists them.

4. **Forgetting children**: Every element needs `children: []` — even single-component specs.

5. **String vs number**: Numeric values (revenue, counts) should be numbers, not strings. Only use strings for labels and categories.

## Reference

For the complete schema of every component, read: [references/component-catalog.md](references/component-catalog.md)

For composition patterns and real-world examples, read: [references/recipes.md](references/recipes.md)

Read the reference files when:
- You're unsure about a component's exact props
- The user asks for a complex multi-component layout
- You need to verify the correct `type` literal value
