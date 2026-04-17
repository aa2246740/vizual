# Common Recipes — AI RenderKit

Patterns for combining components to solve real-world visualization needs.

## Dashboard Layout

KPI cards on top, chart in middle, table at bottom:

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
      "props": {
        "type": "kpi_dashboard",
        "columns": 4,
        "metrics": [
          { "label": "DAU", "value": "12.3K", "trend": "up", "trendValue": "+5%" },
          { "label": "Revenue", "value": "¥89K", "trend": "up", "trendValue": "+12%" },
          { "label": "Conversion", "value": "3.2%", "trend": "down", "trendValue": "-0.3%" },
          { "label": "AOV", "value": "¥128", "trend": "flat", "trendValue": "0%" }
        ]
      },
      "children": []
    },
    "chart": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "title": "Monthly Revenue",
        "x": "month",
        "y": "revenue",
        "data": [
          { "month": "Jan", "revenue": 45000 },
          { "month": "Feb", "revenue": 52000 }
        ]
      },
      "children": []
    },
    "table": {
      "type": "DataTable",
      "props": {
        "type": "table",
        "columns": [
          { "key": "product", "label": "Product" },
          { "key": "sales", "label": "Sales", "align": "right" }
        ],
        "data": [
          { "product": "Widget A", "sales": 1500 },
          { "product": "Widget B", "sales": 2300 }
        ],
        "striped": true
      },
      "children": []
    }
  }
}
```

## Analysis Report

Title + alert + chart + insight notes:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "VerticalLayout",
      "props": {},
      "children": ["title", "alert", "funnel", "note"]
    },
    "title": {
      "type": "TextBlock",
      "props": { "type": "text", "content": "Conversion Funnel Analysis", "fontSize": 18, "fontWeight": "bold" },
      "children": []
    },
    "alert": {
      "type": "Alert",
      "props": { "type": "alert", "message": "Signup→Purchase conversion dropped 15% this week", "severity": "warning" },
      "children": []
    },
    "funnel": {
      "type": "FunnelChart",
      "props": {
        "type": "funnel",
        "label": "stage",
        "value": "count",
        "data": [
          { "stage": "Landing", "count": 10000 },
          { "stage": "Signup", "count": 3000 },
          { "stage": "Trial", "count": 1500 },
          { "stage": "Purchase", "count": 450 }
        ]
      },
      "children": []
    },
    "note": {
      "type": "Note",
      "props": { "type": "note", "content": "The biggest drop is at Signup (70% loss). Consider simplifying the registration form.", "variant": "tip" },
      "children": []
    }
  }
}
```

## Project Management View

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "VerticalLayout",
      "props": {},
      "children": ["title", "gantt", "kanban"]
    },
    "title": {
      "type": "BigValue",
      "props": { "type": "big_value", "title": "Sprint Progress", "value": "67%", "trend": "up", "trendValue": "+8% this week" },
      "children": []
    },
    "gantt": {
      "type": "GanttChart",
      "props": {
        "type": "gantt",
        "title": "Timeline",
        "tasks": [
          { "id": "1", "name": "Design", "start": "2024-01-01", "end": "2024-01-15", "progress": 100 },
          { "id": "2", "name": "Frontend", "start": "2024-01-10", "end": "2024-02-01", "progress": 60, "dependencies": ["1"] },
          { "id": "3", "name": "Backend", "start": "2024-01-10", "end": "2024-02-01", "progress": 45, "dependencies": ["1"] }
        ]
      },
      "children": []
    },
    "kanban": {
      "type": "Kanban",
      "props": {
        "type": "kanban",
        "title": "Task Board",
        "columns": [
          {
            "id": "todo", "title": "To Do",
            "cards": [
              { "id": "1", "title": "API integration", "priority": "high", "assignee": "Alice" }
            ]
          },
          {
            "id": "inprogress", "title": "In Progress",
            "cards": [
              { "id": "2", "title": "Auth module", "priority": "medium", "tags": ["backend"] }
            ]
          },
          {
            "id": "done", "title": "Done",
            "cards": [
              { "id": "3", "title": "Database schema" }
            ]
          }
        ]
      },
      "children": []
    }
  }
}
```

## Choosing the Right Component

| User wants | Use this | type value |
|-----------|----------|------------|
| Bar/column chart | BarChart | `bar` |
| Trend over time | LineChart | `line` |
| Filled area trend | AreaChart | `area` |
| Proportions/parts-of-whole | PieChart | `pie` |
| Correlation between 2 variables | ScatterChart | `scatter` |
| Correlation + size dimension | BubbleChart | `bubble` |
| Distribution statistics | BoxplotChart | `boxplot` |
| Frequency distribution | HistogramChart | `histogram` |
| Incremental changes | WaterfallChart | `waterfall` |
| Process monitoring | XmrChart | `xmr` |
| Flow/transfer between stages | SankeyChart | `sankey` |
| Conversion stages | FunnelChart | `funnel` |
| Matrix data intensity | HeatmapChart | `heatmap` |
| Calendar patterns | CalendarChart | `calendar` |
| Tiny inline trend | SparklineChart | `sparkline` |
| Mixed bar + line | ComboChart | `combo` |
| Range comparison | DumbbellChart | `dumbbell` |
| Flowchart/sequence/gantt diagram | MermaidDiagram | `mermaid` |
| Radar/spider chart | RadarChart | `radar` |
| Big number with trend | BigValue | `big_value` |
| Change from previous | Delta | `delta` |
| Warning/notification | Alert | `alert` |
| Tip/callout | Note | `note` |
| Text paragraph | TextBlock | `text` |
| Code/query display | TextArea | `textarea` |
| Data grid | DataTable | `table` |
| Spacing | EmptySpace | `empty_space` |
| Event timeline | Timeline | `timeline` |
| Task board | Kanban | `kanban` |
| Project schedule | GanttChart | `gantt` |
| Org hierarchy | OrgChart | `org_chart` |
| Metric cards | KpiDashboard | `kpi_dashboard` |
| Budget comparison | BudgetReport | `budget_report` |
| Feature comparison | FeatureTable | `feature_table` |
| Operation log | AuditLog | `audit_log` |
| JSON display | JsonViewer | `json_viewer` |
| Source code display | CodeBlock | `code_block` |
| Key-value form | FormView | `form_view` |

## Multi-Dimensional Comparison

Radar chart for comparing entities across multiple dimensions:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "RadarChart",
      "props": {
        "type": "radar",
        "title": "Team Skill Assessment",
        "indicators": [
          { "name": "Frontend", "max": 100 },
          { "name": "Backend", "max": 100 },
          { "name": "DevOps", "max": 100 },
          { "name": "Design", "max": 100 },
          { "name": "Testing", "max": 100 }
        ],
        "series": [
          { "name": "Team A", "values": [90, 70, 60, 80, 75] },
          { "name": "Team B", "values": [65, 85, 80, 55, 90] }
        ]
      },
      "children": []
    }
  }
}
```
