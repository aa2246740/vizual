# Common Recipes — AI RenderKit

Patterns for combining components to solve real-world visualization needs.

## Dashboard Layout

KPI cards on top, chart in middle, table at bottom:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "GridLayout",
      "props": { "columns": 1 },
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

## Chat Analysis / Dashboard Report

Use host message text for the written conclusion, and render the visual artifact as GridLayout + components. Do not use DocView just because the user says "report" or "analysis".

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "GridLayout",
      "props": { "columns": 1, "gap": 16 },
      "children": ["kpi", "funnel", "table"]
    },
    "kpi": {
      "type": "KpiDashboard",
      "props": {
        "type": "kpi_dashboard",
        "columns": 3,
        "metrics": [
          { "label": "Landing", "value": "10,000", "trend": "flat", "trendValue": "baseline" },
          { "label": "Signup", "value": "3,000", "trend": "down", "trendValue": "-70%" },
          { "label": "Purchase", "value": "450", "trend": "down", "trendValue": "-85% from signup" }
        ]
      },
      "children": []
    },
    "funnel": {
      "type": "FunnelChart",
      "props": {
        "type": "funnel",
        "title": "Conversion Funnel",
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
    "table": {
      "type": "DataTable",
      "props": {
        "type": "table",
        "columns": [
          { "key": "stage", "label": "Stage" },
          { "key": "count", "label": "Count", "align": "right" },
          { "key": "drop", "label": "Drop-off" }
        ],
        "data": [
          { "stage": "Landing", "count": 10000, "drop": "-" },
          { "stage": "Signup", "count": 3000, "drop": "70%" },
          { "stage": "Trial", "count": 1500, "drop": "50%" },
          { "stage": "Purchase", "count": 450, "drop": "70%" }
        ]
      },
      "children": []
    }
  }
}
```

## Historical Follow-Up Update

When the user points back to an existing rendered chart ("this chart", "the previous dashboard", "three days later in chat history"), do not reconstruct it from memory. Read the saved artifact, locate a target from `targetMap`, apply a Vizual typed patch, and let the host render a new AI bubble by default so the historical message remains unchanged.

```js
const artifact = window.getLastArtifact();
const target = artifact.targetMap.find(t => t.id === 'element:chart')
  || artifact.targetMap.find(t => t.type === 'element');

const updated = window.updateArtifactInMsg(artifact.id, [
  { type: 'changeChartType', targetId: target.id, chartType: 'LineChart' },
  { type: 'filterData', targetId: target.id, field: 'region', values: '华东' },
  { type: 'limitData', targetId: target.id, limit: 8 },
], { answerText: '已生成新的修改版图表。' });

const exportRecord = await window.exportArtifact(updated.id, {
  format: 'pdf',
  filename: 'east-china-line-chart',
});
```

Patch choice guide:

- Change chart type: `changeChartType`.
- Change title/axis/options: `updateElementProps`.
- Replace the whole chart/table: `replaceElement`.
- Filter rows already present in `props.data`: `filterData`.
- Make a dense chart sparser: `limitData` or regenerate fewer bins in a new `replaceElement`.
- Change Design.md theme: call `Vizual.loadDesignMd()` first or use `setTheme` metadata plus host theme application.

Prefer the Vizual typed patch objects shown above. Do not use RFC-style JSON Patch (`{ op, path, value }`) for normal agent work; it is only a runtime compatibility fallback for older hosts or accidental usage.

Built-in export formats:

- Rendered surface: `png`, `pdf`.
- Data: `csv`, `xlsx`.

Use `window.exportArtifact(artifact.id, { format, filename })` in `vizual-test.html`. For follow-up edits, export the returned `updated.id`, not the old artifact. Use lower-level `Vizual.exportToPNG/exportToPDF/exportDataToCSV/exportDataToXLSX` in custom hosts.

## AI Answer Review / Scoring Dashboard

When the user asks to evaluate an AI answer, score reasoning quality, or compare analysis quality, use host text for the critique and render a compact dashboard. Do not use DocView unless the user asks to annotate or revise the critique as a document.

Do not invent the original business dataset. If the prompt mentions a missing insight such as "D7 structural breakpoint" but does not provide the underlying day-by-day data, show that as a finding in the table or penalty chart. Do not create fake D1-D14 values.

Good component mix:

- `KpiDashboard` for total score and category scores.
- `ComboChart` for explicit score breakdown, such as dimension score vs max score.
- `BarChart` for penalties by issue type.
- `RadarChart` for reasoning dimensions such as chart use, insight depth, causal caution, and visualization design.
- `DataTable` for concrete findings and recommended improvements.

Example component plan for the prompt "score this AI answer":

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "GridLayout",
      "props": { "columns": 1, "gap": 16 },
      "children": ["summary", "scoreBreakdown", "penalties", "reasoningRadar", "findings"]
    },
    "summary": {
      "type": "KpiDashboard",
      "props": {
        "type": "kpi_dashboard",
        "columns": 4,
        "metrics": [
          { "label": "总分", "value": "78/100", "trend": "flat", "trendValue": "中上水平" },
          { "label": "图表正确性", "value": "32/40", "trend": "up", "trendValue": "选图正确" },
          { "label": "因果推理", "value": "14/20", "trend": "down", "trendValue": "过度归因" },
          { "label": "可视化设计", "value": "6/10", "trend": "down", "trendValue": "组合图不足" }
        ]
      },
      "children": []
    },
    "scoreBreakdown": {
      "type": "ComboChart",
      "props": {
        "type": "combo",
        "title": "评分维度",
        "x": "维度",
        "y": ["得分", "满分"],
        "data": [
          { "维度": "图表正确性", "得分": 32, "满分": 40 },
          { "维度": "洞察深度", "得分": 26, "满分": 30 },
          { "维度": "因果推理", "得分": 14, "满分": 20 },
          { "维度": "可视化设计", "得分": 6, "满分": 10 }
        ]
      },
      "children": []
    },
    "penalties": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "title": "主要扣分点",
        "x": "问题",
        "y": "扣分",
        "data": [
          { "问题": "没有读出斜率/滞后", "扣分": 8 },
          { "问题": "虚假相关风险", "扣分": 6 },
          { "问题": "漏掉 selection effect", "扣分": 5 },
          { "问题": "组合图表达不足", "扣分": 4 }
        ]
      },
      "children": []
    },
    "reasoningRadar": {
      "type": "RadarChart",
      "props": {
        "type": "radar",
        "title": "推理能力画像",
        "indicators": [
          { "name": "读图", "max": 10 },
          { "name": "洞察", "max": 10 },
          { "name": "因果谨慎", "max": 10 },
          { "name": "业务假设", "max": 10 },
          { "name": "图表设计", "max": 10 }
        ],
        "series": [
          { "name": "当前答案", "values": [6, 8, 5, 7, 6] },
          { "name": "顶级答案", "values": [9, 9, 9, 9, 9] }
        ]
      },
      "children": []
    },
    "findings": {
      "type": "DataTable",
      "props": {
        "type": "table",
        "columns": [
          { "key": "缺陷", "label": "缺陷" },
          { "key": "为什么重要", "label": "为什么重要" },
          { "key": "改进", "label": "改进" }
        ],
        "data": [
          { "缺陷": "没提斜率和滞后", "为什么重要": "说明没有真正读图", "改进": "描述 Day5-7 active_users 增速放缓" },
          { "缺陷": "过度因果归因", "为什么重要": "AI_ratio 和 churn 可能都是时间趋势", "改进": "明确 spurious correlation / 混杂变量风险" },
          { "缺陷": "漏掉 selection effect", "为什么重要": "ARPPU 上升不一定代表产品变好", "改进": "解释低价值用户流失、高价值用户留下" }
        ],
        "striped": true
      },
      "children": []
    }
  }
}
```

## Annotatable Document (DocView)

Use DocView when the user needs comments, highlights, revision loop, version history, or a reviewable document artifact. Do not use it just because the user asks for a report, dashboard, summary, or export; those should normally be host text plus GridLayout/charts/tables and artifact export APIs.

In `validation/vizual-test.html`, render reviewable documents through `renderDocViewInMsg()` so the page exposes `createDocViewThread()`, `getDocViewReviewState()`, `createDocViewRevision()`, and `applyDocViewRevision()` for the Agent revision loop. The JSON below is the document spec shape; the bridge call should pass the `sections` array or the spec.

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "DocView",
      "props": {
        "type": "doc_view",
        "title": "Conversion Funnel Review",
        "showPanel": true,
        "sections": [
          { "type": "heading", "content": "Conversion Funnel Review", "level": 1 },
          { "type": "text", "content": "This document is intended for stakeholder review and inline comments." },
          { "type": "callout", "content": "Signup to purchase conversion dropped 15% this week." },
          { "type": "chart", "content": "", "data": { "chartType": "FunnelChart", "label": "stage", "value": "count", "data": [
            { "stage": "Landing", "count": 10000 },
            { "stage": "Signup", "count": 3000 },
            { "stage": "Trial", "count": 1500 },
            { "stage": "Purchase", "count": 450 }
          ] } }
        ]
      },
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
      "type": "GridLayout",
      "props": { "columns": 1 },
      "children": ["title", "gantt", "kanban"]
    },
    "title": {
      "type": "KpiDashboard",
      "props": {
        "type": "kpi_dashboard",
        "columns": 1,
        "metrics": [
          { "label": "Sprint Progress", "value": "67%", "trend": "up", "trendValue": "+8% this week" }
        ]
      },
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
| Big number with trend | KpiDashboard | `kpi_dashboard` |
| Warning/notification | Host message text, or DocView callout inside a document | — |
| Tip/callout | Host message text, or DocView callout inside a document | — |
| Text paragraph / heading | Host message text, or DocView heading/text inside a document | — |
| Code/query display | Host message text, or DocView freeform HTML `<pre>` inside a document | — |
| Data grid | DataTable | `table` |
| Event timeline | Timeline | `timeline` |
| Task board | Kanban | `kanban` |
| Project schedule | GanttChart | `gantt` |
| Org hierarchy | OrgChart | `org_chart` |
| Metric cards | KpiDashboard | `kpi_dashboard` |
| Operation log | AuditLog | `audit_log` |
| Dynamic form | FormBuilder | `form_builder` |
| Rich document with annotation | DocView | `doc_view` |
| Multi-column layout | GridLayout | no props.type |
| Side-by-side split | SplitLayout | no props.type |
| Hero banner section | HeroLayout | no props.type |

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

## Grid Dashboard

KPI cards in a responsive grid with a chart below:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "GridLayout",
      "props": { "columns": 1 },
      "children": ["kpi_grid", "chart"]
    },
    "kpi_grid": {
      "type": "KpiDashboard",
      "props": {
        "type": "kpi_dashboard",
        "columns": 4,
        "metrics": [
          { "label": "DAU", "value": "12.3K", "trend": "up", "trendValue": "+5%" },
          { "label": "Revenue", "value": "$89K", "trend": "up", "trendValue": "+12%" },
          { "label": "Conversion", "value": "3.2%", "trend": "down", "trendValue": "-0.3%" },
          { "label": "Churn", "value": "1.8%", "trend": "flat", "trendValue": "0%" }
        ]
      },
      "children": []
    },
    "chart": {
      "type": "AreaChart",
      "props": {
        "type": "area",
        "title": "Monthly Active Users",
        "x": "month", "y": "users",
        "data": [
          { "month": "Jan", "users": 8200 },
          { "month": "Feb", "users": 9100 },
          { "month": "Mar", "users": 10500 },
          { "month": "Apr", "users": 12300 }
        ],
        "smooth": true
      },
      "children": []
    }
  }
}
```

## Split Report

Chart and table side by side:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "SplitLayout",
      "props": { "direction": "horizontal", "ratio": 55 },
      "children": ["chart", "table"]
    },
    "chart": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "title": "Revenue by Region",
        "x": "region", "y": "revenue",
        "data": [
          { "region": "North America", "revenue": 450 },
          { "region": "Europe", "revenue": 320 },
          { "region": "Asia Pacific", "revenue": 280 },
          { "region": "Latin America", "revenue": 150 }
        ]
      },
      "children": []
    },
    "table": {
      "type": "DataTable",
      "props": {
        "type": "table",
        "columns": [
          { "key": "region", "label": "Region" },
          { "key": "revenue", "label": "Revenue ($K)", "align": "right" },
          { "key": "growth", "label": "Growth", "align": "right" }
        ],
        "data": [
          { "region": "North America", "revenue": 450, "growth": "+12%" },
          { "region": "Europe", "revenue": 320, "growth": "+8%" },
          { "region": "Asia Pacific", "revenue": 280, "growth": "+22%" },
          { "region": "Latin America", "revenue": 150, "growth": "+15%" }
        ],
        "striped": true
      },
      "children": []
    }
  }
}
```

## Annotatable Hero Document

Hero heading with markdown body and data sections:

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "DocView",
      "props": {
        "type": "doc_view",
        "title": "Annual Performance Review",
        "sections": [
          { "type": "heading", "content": "FY2024 Annual Report", "layout": "hero", "aiContext": "Main title for annual performance report" },
          { "type": "markdown", "content": "## Executive Summary\n\nRevenue grew **23%** year-over-year, reaching **$48.2M**. Key drivers:\n\n- Enterprise sales up 35%\n- New markets: Southeast Asia, Latin America\n- NRR improved to 118%\n\n> Strategic partnerships accounted for 40% of new ARR.", "aiContext": "Executive summary with 4 key findings" },
          { "type": "kpi", "content": "", "layout": "grid", "data": { "metrics": [{"label":"Revenue","value":"$48.2M","trend":"up","trendValue":"+23%"},{"label":"NRR","value":"118%","trend":"up","trendValue":"+6%"},{"label":"Customers","value":"1,240","trend":"up","trendValue":"+180"}] } },
          { "type": "chart", "content": "", "data": { "chartType": "LineChart", "x": "quarter", "y": "revenue", "data": [{"quarter":"Q1","revenue":10.2},{"quarter":"Q2","revenue":11.8},{"quarter":"Q3","revenue":12.5},{"quarter":"Q4","revenue":13.7}] } },
          { "type": "callout", "content": "All figures audited by Deloitte. Full report available in the investor portal.", "layout": "banner" }
        ],
        "showPanel": true,
        "panelPosition": "right"
      },
      "children": []
    }
  }
}
```
