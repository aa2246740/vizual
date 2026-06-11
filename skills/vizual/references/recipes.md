# Vizual Recipes

Use these recipes as examples of current native core composition. They intentionally avoid removed product/page-level components.

## Business Dashboard

Use host message text for the conclusion, then render KPI cards, evidence charts, detail rows, and optional structured follow-up input.

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "Column",
      "props": { "gap": 16 },
      "children": ["kpis", "trend", "detail", "followup"]
    },
    "kpis": {
      "type": "KpiDashboard",
      "props": {
        "type": "kpi_dashboard",
        "title": "经营概览",
        "metrics": [
          { "label": "销量", "value": "+162.5%", "trend": "up" },
          { "label": "利润", "value": "-4.2%", "trend": "down" }
        ]
      },
      "children": []
    },
    "trend": {
      "type": "ComboChart",
      "props": {
        "type": "combo",
        "title": "营收、成本、利润趋势",
        "data": [
          { "month": "1月", "revenue": 6400, "cost": 4000, "profit": 2400 },
          { "month": "6月", "revenue": 16800, "cost": 14500, "profit": 2300 }
        ],
        "encoding": { "x": { "field": "month", "type": "ordinal" } },
        "measures": [
          { "field": "revenue", "label": "营收", "mark": "bar", "axis": "left" },
          { "field": "cost", "label": "成本", "mark": "bar", "axis": "left" },
          { "field": "profit", "label": "利润", "mark": "line", "axis": "right" }
        ]
      },
      "children": []
    },
    "detail": {
      "type": "DataTable",
      "props": {
        "type": "table",
        "title": "月度明细",
        "data": [
          { "month": "1月", "revenue": 6400, "cost": 4000, "profit": 2400 },
          { "month": "6月", "revenue": 16800, "cost": 14500, "profit": 2300 }
        ],
        "columns": [
          { "key": "month", "label": "月份" },
          { "key": "revenue", "label": "营收" },
          { "key": "cost", "label": "成本" },
          { "key": "profit", "label": "利润" }
        ]
      },
      "children": []
    },
    "followup": {
      "type": "FormBuilder",
      "props": {
        "type": "form_builder",
        "title": "下一步分析",
        "submitLabel": "提交给 Agent",
        "fields": [
          {
            "name": "focus",
            "type": "select",
            "label": "优先追问方向",
            "options": ["渠道结构", "营销投入", "成本率", "退货风险"]
          }
        ]
      },
      "children": []
    }
  }
}
```

## Bank Branch Operating Analysis

For bank branch scenarios, combine KPI cards, trend/comparison charts, a detail table, and a risk/action note.

Suggested components:

- `KpiDashboard` for deposits, AUM, customers, loan balance, NPL ratio, conversion rate.
- `LineChart` for monthly trend.
- `BarChart` or `DumbbellChart` for branch/region comparison.
- `ScatterChart` for revenue vs risk or customer value vs activity.
- `DataTable` for branch-level details.
- `Markdown` for concise diagnosis and hidden risk.
- `FormBuilder` only if the user needs to choose next analysis assumptions or focus.

## Concept Playground

Use liveControl/FormBuilder when parameter changes teach the concept.

Example tasks:

- "解释梯度下降，能让我调学习率和迭代次数看收敛过程吗？"
- "讲排队论，调整窗口数量和到达率看等待时间。"
- "解释贷款等额本息，调期限和利率看月供变化。"

Pattern:

1. Host message explains the concept.
2. FormBuilder controls real parameters.
3. Preview chart/table changes from `makeSpec(state)`.
4. No fake submit button unless submitted values matter to the Agent.

## Project Schedule

Use `GanttChart` when tasks have date ranges, progress, dependencies, or owners.

Use `Timeline` when the user only needs chronological events or milestones.

Do not claim the chart writes back to a project-management system. If user edits are needed, use `FormBuilder` to collect a proposed update and return it to the Agent or host.

## Organization / Responsibility

Use `OrgChart` for hierarchy. Pair with a `DataTable` when responsibilities, KPIs, or branch metrics must be compared.

## Choosing The Right Surface

| Need | Component |
| --- | --- |
| Metric cards | `KpiDashboard` |
| Time trend | `LineChart`, `AreaChart`, `SparklineChart` |
| Category comparison | `BarChart`, `DumbbellChart` |
| Contribution/proportion | `PieChart`, `FunnelChart`, `SankeyChart` |
| Correlation/risk-return | `ScatterChart`, `BubbleChart` |
| Distribution/process stability | `HistogramChart`, `BoxplotChart`, `XmrChart` |
| Matrix/time intensity | `HeatmapChart`, `CalendarChart` |
| Mixed chart layers | `ComboChart` |
| Flow or concept diagram | `MermaidDiagram` |
| Detailed rows | `DataTable` |
| Project schedule | `GanttChart` |
| Chronology | `Timeline` |
| Hierarchy | `OrgChart` |
| Structured input | `FormBuilder` |
| Narrative inside a surface | `Markdown` |
| Lightweight composition | `Column`, `Row`, `Container`, `Card`, `Tabs` |

## Negative Examples

- Do not add a button that submits to an unknown operations team.
- Do not wrap ordinary analysis in a product-level document/editor surface.
- Do not create page-level layouts inside native core when the host page owns layout.
- Do not use arbitrary HTML as an escape hatch.
- Do not use removed components; they should produce unsupported-component errors.
