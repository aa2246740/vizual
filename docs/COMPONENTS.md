# 组件参考文档 — AI RenderKit

完整列出 32 个注册组件的 Schema、props 说明和使用示例。

> 所有图表组件（Charts 19 种）共享以下可选 props：`title?: string`、`theme?: 'light' | 'dark'`、`height?: number`

---

## Charts (19) — ECharts via mviz Bridge

所有图表组件基于 ECharts，通过 mviz Bridge 封装。每个组件接受 `type`（固定字面量）、`data`（数据数组）及图表特有 props。

### BarChart

柱状图，支持分组、堆叠、横向。

```json
{
  "type": "bar",
  "title": "季度销售额",
  "x": "quarter",
  "y": "revenue",
  "data": [
    { "quarter": "Q1", "revenue": 120 },
    { "quarter": "Q2", "revenue": 200 }
  ],
  "stacked": false,
  "horizontal": false
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"bar"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 是 | X 轴字段名 |
| y | string \| string[] | 是 | Y 轴字段名，数组表示多系列 |
| data | object[] | 是 | 数据数组 |
| stacked | boolean | 否 | 是否堆叠 |
| horizontal | boolean | 否 | 是否横向 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### LineChart

折线图，支持多系列、平滑曲线。

```json
{
  "type": "line",
  "x": "month",
  "y": ["users", "revenue"],
  "data": [
    { "month": "1月", "users": 1200, "revenue": 45000 },
    { "month": "2月", "users": 1500, "revenue": 52000 }
  ],
  "smooth": true
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"line"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| smooth | boolean | 否 | 平滑曲线 |
| multiSeries | boolean | 否 | 多系列模式 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### AreaChart

面积图，支持堆叠。

```json
{
  "type": "area",
  "x": "month",
  "y": ["pv", "uv"],
  "data": [
    { "month": "1月", "pv": 5000, "uv": 3000 },
    { "month": "2月", "pv": 6000, "uv": 3500 }
  ],
  "stacked": true
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"area"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| stacked | boolean | 否 | 堆叠面积 |
| smooth | boolean | 否 | 平滑曲线 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### PieChart

饼图/环形图。

```json
{
  "type": "pie",
  "value": "amount",
  "label": "category",
  "data": [
    { "category": "A", "amount": 100 },
    { "category": "B", "amount": 200 }
  ],
  "donut": true
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"pie"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | 分类字段（替代 label） |
| y | string \| string[] | 否 | 数值字段（替代 value） |
| data | object[] | 是 | 数据数组 |
| value | string | 否 | 数值字段 |
| label | string | 否 | 标签字段 |
| donut | boolean | 否 | 环形图模式 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### ScatterChart

散点图。

```json
{
  "type": "scatter",
  "x": "height",
  "y": "weight",
  "data": [
    { "height": 170, "weight": 65 },
    { "height": 180, "weight": 80 }
  ],
  "groupField": "gender"
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"scatter"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| size | string | 否 | 气泡大小字段 |
| groupField | string | 否 | 分组字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### BubbleChart

气泡图（散点图 + 大小维度）。

```json
{
  "type": "bubble",
  "x": "gdp",
  "y": "lifeExpectancy",
  "size": "population",
  "data": [
    { "gdp": 50000, "lifeExpectancy": 80, "population": 300 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"bubble"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| size | string | 否 | 气泡大小字段 |
| groupField | string | 否 | 分组字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### BoxplotChart

箱线图。

```json
{
  "type": "boxplot",
  "groupField": "department",
  "valueField": "salary",
  "data": [
    { "department": "Engineering", "salary": 15000 },
    { "department": "Engineering", "salary": 22000 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"boxplot"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| valueField | string | 否 | 数值字段 |
| groupField | string | 否 | 分组字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### HistogramChart

直方图。

```json
{
  "type": "histogram",
  "value": "age",
  "bins": 10,
  "data": [
    { "age": 25 }, { "age": 30 }, { "age": 35 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"histogram"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| value | string | 否 | 统计数值字段 |
| bins | number | 否 | 分箱数量 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### WaterfallChart

瀑布图。

```json
{
  "type": "waterfall",
  "label": "item",
  "value": "amount",
  "data": [
    { "item": "收入", "amount": 1000 },
    { "item": "成本", "amount": -400 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"waterfall"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| label | string | 否 | 标签字段 |
| value | string | 否 | 数值字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### XmrChart

XMR 控制图（过程监控）。

```json
{
  "type": "xmr",
  "value": "measurement",
  "data": [
    { "measurement": 10.2 }, { "measurement": 10.5 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"xmr"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| value | string | 否 | 测量值字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### SankeyChart

桑基图（流量可视化）。

```json
{
  "type": "sankey",
  "nodes": [
    { "name": "访问" }, { "name": "注册" }, { "name": "购买" }
  ],
  "links": [
    { "source": "访问", "target": "注册", "value": 100 },
    { "source": "注册", "target": "购买", "value": 30 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"sankey"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| data | object[] | 是 | 数据数组 |
| nodes | { name: string }[] | 否 | 节点列表 |
| links | { source, target, value }[] | 否 | 连接列表 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### FunnelChart

漏斗图。

```json
{
  "type": "funnel",
  "value": "count",
  "label": "stage",
  "data": [
    { "stage": "访问", "count": 1000 },
    { "stage": "注册", "count": 500 },
    { "stage": "购买", "count": 100 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"funnel"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| value | string | 否 | 数值字段 |
| label | string | 否 | 标签字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### HeatmapChart

热力图。

```json
{
  "type": "heatmap",
  "xField": "hour",
  "yField": "day",
  "valueField": "count",
  "data": [
    { "hour": "9", "day": "Mon", "count": 120 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"heatmap"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| xField | string | 否 | X 维度字段 |
| yField | string | 否 | Y 维度字段 |
| valueField | string | 否 | 数值字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### CalendarChart

日历热力图。

```json
{
  "type": "calendar",
  "dateField": "date",
  "valueField": "count",
  "range": "2024",
  "data": [
    { "date": "2024-01-01", "count": 50 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"calendar"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| dateField | string | 否 | 日期字段 |
| valueField | string | 否 | 数值字段 |
| range | string | 否 | 年份范围（如 "2024"） |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### SparklineChart

迷你图。

```json
{
  "type": "sparkline",
  "value": "price",
  "sparkType": "line",
  "data": [
    { "price": 100 }, { "price": 120 }, { "price": 110 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"sparkline"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| sparkType | `"line"` \| `"bar"` \| `"pct_bar"` | 否 | 迷你图类型 |
| value | string | 否 | 数值字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### ComboChart

组合图（柱状 + 折线）。

```json
{
  "type": "combo",
  "x": "month",
  "series": [
    { "type": "bar", "y": "revenue" },
    { "type": "line", "y": "growth" }
  ],
  "data": [
    { "month": "Jan", "revenue": 100, "growth": 5 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"combo"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| series | { type: `"bar"` \| `"line"`, y: string }[] | 否 | 混合系列配置 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### DumbbellChart

哑铃图（范围对比）。

```json
{
  "type": "dumbbell",
  "low": "min",
  "high": "max",
  "groupField": "city",
  "data": [
    { "city": "北京", "min": -5, "max": 35 },
    { "city": "上海", "min": 2, "max": 38 }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"dumbbell"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据数组 |
| low | string | 否 | 最小值字段 |
| high | string | 否 | 最大值字段 |
| groupField | string | 否 | 分组字段 |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

### MermaidDiagram

Mermaid 流程图/序列图/甘特图等。

```json
{
  "type": "mermaid",
  "code": "graph TD\n  A[开始] --> B{判断}\n  B -->|是| C[执行]\n  B -->|否| D[结束]",
  "theme": "default"
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"mermaid"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| code | string | 是 | Mermaid 语法代码 |
| theme | `"default"` \| `"dark"` \| `"forest"` \| `"neutral"` | 否 | Mermaid 渲染主题 |
| height | number | 否 | 图表高度 |

### RadarChart

雷达图，支持多维度对比。支持 indicator 模式（indicators + series）和 table 模式（data + x + y）。

```json
{
  "type": "radar",
  "title": "车型对比",
  "indicators": [
    { "name": "速度", "max": 100 },
    { "name": "安全", "max": 100 },
    { "name": "舒适", "max": 100 },
    { "name": "油耗", "max": 100 },
    { "name": "价格", "max": 100 }
  ],
  "series": [
    { "name": "车型 A", "values": [85, 70, 90, 60, 80] },
    { "name": "车型 B", "values": [70, 90, 75, 85, 65] }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"radar"` | 是 | 固定值 |
| title | string | 否 | 图表标题 |
| indicators | { name: string, max?: number }[] | 否 | 维度定义（indicator 模式） |
| series | { name?: string, values: number[] }[] | 否 | 数据系列（indicator 模式） |
| data | object[] | 否 | 数据数组（table 模式） |
| x | string | 否 | 分类字段（table 模式） |
| y | string \| string[] | 否 | 数值字段（table 模式） |
| theme | `"light"` \| `"dark"` | 否 | 主题 |
| height | number | 否 | 图表高度 |

---

## Data Components (1)

### DataTable

数据表格，支持排序、分页、紧凑模式。

```json
{
  "type": "table",
  "columns": [
    { "key": "name", "label": "姓名" },
    { "key": "score", "label": "分数", "align": "right" }
  ],
  "data": [
    { "name": "张三", "score": 95 },
    { "name": "李四", "score": 88 }
  ],
  "striped": true
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"table"` | 是 | 固定值 |
| title | string | 否 | 表格标题 |
| columns | { key: string, label?: string, align?: `"left"` \| `"center"` \| `"right"` }[] | 否 | 列定义 |
| data | object[] | 是 | 数据行数组 |
| striped | boolean | 否 | 斑马纹 |
| compact | boolean | 否 | 紧凑模式 |

---

## Business Components (6)

### Timeline

垂直时间轴，展示事件序列。

```json
{
  "type": "timeline",
  "title": "项目里程碑",
  "events": [
    { "date": "2024-01", "title": "项目启动", "description": "完成需求分析" },
    { "date": "2024-03", "title": "Alpha 版本", "description": "核心功能上线" },
    { "date": "2024-06", "title": "正式发布" }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"timeline"` | 是 | 固定值 |
| title | string | 否 | 时间轴标题 |
| events | { date: string, title: string, description?: string }[] | 是 | 事件列表 |

### Kanban

看板，支持多列卡片和优先级标签。

```json
{
  "type": "kanban",
  "title": "Sprint 看板",
  "columns": [
    {
      "id": "todo",
      "title": "待办",
      "cards": [
        { "id": "1", "title": "用户认证", "priority": "high", "assignee": "张三" },
        { "id": "2", "title": "数据导出", "tags": ["backend"] }
      ]
    },
    {
      "id": "done",
      "title": "完成",
      "cards": []
    }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"kanban"` | 是 | 固定值 |
| title | string | 否 | 看板标题 |
| columns | { id: string, title: string, color?: string, cards: Card[] }[] | 是 | 列定义 |
| Card.id | string | 是 | 卡片唯一标识 |
| Card.title | string | 是 | 卡片标题 |
| Card.description | string | 否 | 卡片描述 |
| Card.tags | string[] | 否 | 标签列表 |
| Card.assignee | string | 否 | 负责人 |
| Card.priority | `"low"` \| `"medium"` \| `"high"` | 否 | 优先级 |

### GanttChart

甘特图，支持任务依赖和进度显示。

```json
{
  "type": "gantt",
  "title": "项目排期",
  "tasks": [
    { "id": "1", "name": "需求分析", "start": "2024-01-01", "end": "2024-01-15", "progress": 100 },
    { "id": "2", "name": "开发", "start": "2024-01-16", "end": "2024-03-01", "progress": 60, "dependencies": ["1"] }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"gantt"` | 是 | 固定值 |
| title | string | 否 | 甘特图标题 |
| tasks | { id: string, name: string, start: string, end: string, progress?: number, color?: string, dependencies?: string[] }[] | 是 | 任务列表 |
| Task.progress | number (0-100) | 否 | 完成进度百分比 |
| Task.dependencies | string[] | 否 | 依赖的任务 ID 列表 |

### OrgChart

组织架构图，树形层级展示。

```json
{
  "type": "org_chart",
  "title": "团队架构",
  "nodes": [
    { "id": "1", "name": "CEO", "role": "首席执行官", "parentId": null },
    { "id": "2", "name": "CTO", "role": "技术总监", "parentId": "1" },
    { "id": "3", "name": "CFO", "role": "财务总监", "parentId": "1" }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"org_chart"` | 是 | 固定值 |
| title | string | 否 | 架构图标题 |
| nodes | { id: string, name: string, role?: string, parentId?: string \| null, avatar?: string }[] | 是 | 节点列表（parentId 为 null 表示根节点） |

### KpiDashboard

KPI 仪表盘，网格化展示关键指标。

```json
{
  "type": "kpi_dashboard",
  "title": "业务指标",
  "columns": 3,
  "metrics": [
    { "label": "日活", "value": "12.5K", "trend": "up", "trendValue": "+8%" },
    { "label": "收入", "value": "¥2.3M", "trend": "up", "trendValue": "+15%" },
    { "label": "流失率", "value": "2.1%", "trend": "down", "trendValue": "-0.3%", "color": "#22c55e" }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"kpi_dashboard"` | 是 | 固定值 |
| title | string | 否 | 仪表盘标题 |
| columns | number | 否 | 网格列数 |
| metrics | { label: string, value: string \| number, prefix?: string, suffix?: string, trend?: `"up"` \| `"down"` \| `"flat"`, trendValue?: string, color?: string }[] | 是 | 指标列表 |

### AuditLog

审计日志，按时间线展示操作记录。

```json
{
  "type": "audit_log",
  "title": "操作日志",
  "entries": [
    { "timestamp": "2024-01-15 10:30", "user": "admin", "action": "修改配置", "severity": "info" },
    { "timestamp": "2024-01-15 11:00", "user": "user1", "action": "删除数据", "target": "report_2023", "severity": "warning" }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"audit_log"` | 是 | 固定值 |
| title | string | 否 | 日志标题 |
| entries | { timestamp: string, user: string, action: string, target?: string, details?: string, severity?: `"info"` \| `"warning"` \| `"error"` }[] | 是 | 日志条目列表 |

---

## Form Components (1)

### FormBuilder

动态表单构建器，支持 18 种字段类型，可通过 JSON 配置生成完整表单。

```json
{
  "type": "form_builder",
  "title": "用户注册",
  "columns": 2,
  "submitLabel": "提交注册",
  "fields": [
    { "name": "username", "type": "text", "label": "用户名", "required": true, "placeholder": "请输入用户名" },
    { "name": "email", "type": "email", "label": "邮箱", "required": true },
    { "name": "password", "type": "password", "label": "密码", "required": true, "description": "至少 8 位字符" },
    { "name": "role", "type": "select", "label": "角色", "options": [
      { "label": "管理员", "value": "admin" },
      { "label": "编辑", "value": "editor" },
      { "label": "访客", "value": "viewer" }
    ]},
    { "name": "bio", "type": "textarea", "label": "个人简介", "description": "简要介绍自己" },
    { "name": "notifications", "type": "switch", "label": "接收通知", "defaultValue": true },
    { "name": "experience", "type": "slider", "label": "经验年限", "min": 0, "max": 20, "step": 1 },
    { "name": "theme", "type": "color", "label": "主题色", "defaultValue": "#3B82F6" },
    { "name": "birthday", "type": "date", "label": "生日", "defaultValue": "2000-01-01" },
    { "name": "meeting", "type": "datetime", "label": "会议时间" },
    { "name": "satisfaction", "type": "rating", "label": "满意度", "max": 5 },
    { "name": "agree", "type": "checkbox", "label": "同意服务条款", "required": true },
    { "name": "website", "type": "url", "label": "个人网站" },
    { "name": "phone", "type": "tel", "label": "手机号" }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"form_builder"` | 是 | 固定值 |
| title | string | 否 | 表单标题 |
| columns | number | 否 | 表单列数 |
| submitLabel | string | 否 | 提交按钮文字 |
| fields | FieldConfig[] | 是 | 字段配置列表（见下方字段类型） |

**支持的 18 种字段类型：**

| 字段 type | 说明 | 额外 props |
|-----------|------|-----------|
| text | 单行文本 | — |
| email | 邮箱 | — |
| password | 密码 | — |
| number | 数字 | — |
| url | URL 地址 | — |
| tel | 电话号码 | — |
| select | 下拉选择 | `options: { label, value }[]` 或 `string[]` |
| file | 文件上传 | `accept`, `multiple` |
| textarea | 多行文本 | — |
| radio | 单选按钮组 | `options: { label, value }[]` 或 `string[]` |
| checkbox | 复选框 | — |
| switch | 开关 | — |
| slider | 滑动条 | `min`, `max`, `step` |
| color | 颜色选择器 | — |
| date | 日期选择 | `defaultValue` |
| datetime | 日期时间选择 | `defaultValue` |
| time | 时间选择 | `defaultValue` |
| rating | 评分 | `max`（星级上限） |

**通用字段 props：**

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 字段标识，提交时作为 key |
| label | string | 否 | 字段标签 |
| type | string | 是 | 字段类型（见上表） |
| placeholder | string | 否 | 占位文本 |
| required | boolean | 否 | 是否必填 |
| disabled | boolean | 否 | 是否禁用 |
| description | string | 否 | 字段描述/提示文字 |
| defaultValue | string \| number \| boolean | 否 | 默认值 |
| dependsOn | string | 否 | 依赖的字段 name |
| showWhen | string \| number | 否 | 当 dependsOn 字段值等于 showWhen 时显示 |
| validation | { rule: string, value?: string \| number, message?: string }[] | 否 | 验证规则列表 |

---

## Layout Components (3)

### GridLayout

CSS Grid 布局容器，用于组合子组件的网格排列。

```json
{
  "type": "grid_layout",
  "columns": 3,
  "gap": 16,
  "columnWidths": ["1fr", "2fr", "1fr"]
}
```

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | `"grid_layout"` | 是 | — | 固定值 |
| columns | number | 否 | 2 | 网格列数（1-12） |
| gap | number | 否 | 12 | 网格间距（px） |
| columnWidths | string[] | 否 | — | 自定义列宽（CSS Grid 值如 `"1fr"`, `"200px"`），覆盖 columns |

GridLayout 使用 json-render 的 children 机制，子组件自动填入网格单元格。

### SplitLayout

双栏分割布局，支持水平/垂直方向和自定义比例。

```json
{
  "type": "split_layout",
  "direction": "horizontal",
  "ratio": 60,
  "gap": 8
}
```

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | `"split_layout"` | 是 | — | 固定值 |
| direction | `"horizontal"` \| `"vertical"` | 否 | `"horizontal"` | 分割方向 |
| ratio | number | 否 | 50 | 主面板占比（10-90） |
| gap | number | 否 | 0 | 面板间距（px） |

SplitLayout 将前两个子组件分别放入主面板和次面板。

### HeroLayout

大尺寸 Hero 横幅区域，用于突出展示内容。

```json
{
  "type": "hero_layout",
  "height": 300,
  "background": "gradient",
  "align": "center"
}
```

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | `"hero_layout"` | 是 | — | 固定值 |
| height | number | 否 | 200 | 最小高度（px） |
| background | `"gradient"` \| `"solid"` \| `"transparent"` | 否 | `"gradient"` | 背景样式 |
| align | `"top"` \| `"center"` \| `"bottom"` | 否 | `"center"` | 内容垂直对齐 |

---

## Meta Components (1)

### InteractivePlayground

交互式组件包裹器。AI 定义交互控件（slider、select、toggle 等），用户操作控件实时重渲染被包裹的组件。适用于教学演示、参数探索、配色调优。

```json
{
  "type": "interactive_playground",
  "title": "柱状图参数探索",
  "description": "调整参数查看图表变化",
  "layout": "side-by-side",
  "component": {
    "type": "bar",
    "props": {
      "x": "category",
      "y": "value",
      "data": [
        { "category": "A", "value": 120 },
        { "category": "B", "value": 200 },
        { "category": "C", "value": 150 }
      ]
    }
  },
  "controls": [
    {
      "name": "stackToggle",
      "label": "堆叠模式",
      "type": "toggle",
      "defaultValue": false,
      "targetProp": "stacked"
    },
    {
      "name": "orientation",
      "label": "方向",
      "type": "select",
      "options": ["纵向", "横向"],
      "values": ["vertical", "horizontal"],
      "defaultValue": "vertical",
      "targetProp": "horizontal"
    },
    {
      "name": "barCount",
      "label": "数据条数",
      "type": "slider",
      "min": 3,
      "max": 20,
      "step": 1,
      "defaultValue": 5,
      "targetProp": "barCount"
    }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"interactive_playground"` | 是 | 固定值 |
| title | string | 否 | 标题 |
| description | string | 否 | 描述文字 |
| component | { type: string, props: object } | 是 | 被包裹的组件定义 |
| controls | Control[] | 是 | 交互控件列表 |
| layout | `"side-by-side"` \| `"stacked"` | 否 | 布局模式（默认 `"side-by-side"`） |

**7 种控件类型：**

| 控件 type | 说明 | 额外 props |
|-----------|------|-----------|
| slider | 滑动条 | `min`, `max`, `step`, `defaultValue` |
| select | 下拉选择 | `options: string[]`, `values?: string[]`, `defaultValue` |
| toggle | 开关 | `defaultValue: boolean` |
| color | 颜色选择器 | `defaultValue: string` |
| text | 文本输入 | `defaultValue`, `placeholder` |
| number | 数字输入 | `min`, `max`, `step`, `defaultValue` |
| buttonGroup | 按钮组 | `options: string[]`, `values?: string[]`, `defaultValue` |

**通用控件 props：**

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 控件唯一标识 |
| label | string | 是 | 显示标签 |
| type | string | 是 | 控件类型（见上表） |
| targetProp | string | 是 | 映射到被包裹组件的 prop 名 |
| defaultValue | any | 否 | 默认值 |

控制面板默认收起（节省空间），点击齿轮图标展开。

---

## DocView (1)

### DocView

可批注文档组件，支持多种 section 类型（文本、标题、图表、KPI、表格、callout、嵌入组件等）和完整的批注系统。用户可以对任意文本或组件目标添加批注、提交 AI 修订请求，库自动检测内容变更后的孤立批注。

```json
{
  "type": "doc_view",
  "title": "季度报告",
  "showPanel": true,
  "panelPosition": "right",
  "sections": [
    { "type": "heading", "content": "Q1 业绩报告" },
    { "type": "text", "content": "收入同比增长 15%。" },
    { "type": "chart", "content": "", "data": { "chartType": "BarChart", "x": "quarter", "y": "revenue", "data": [{"quarter":"Q1","revenue":120},{"quarter":"Q2","revenue":200}] } },
    { "type": "kpi", "content": "", "data": { "metrics": [{"label":"收入","value":"$12.3M","trend":"up"}] } },
    { "type": "table", "content": "", "data": { "columns": [{"key":"name","label":"名称"},{"key":"value","label":"数值"}], "data": [{"name":"Q1","value":120},{"name":"Q2","value":200}] } },
    { "type": "callout", "content": "注意：所有数据为初步统计。" },
    { "type": "markdown", "content": "## 详细分析\n\n这是 **Markdown** 内容。" },
    { "type": "component", "content": "", "componentType": "KpiDashboard", "data": { "metrics": [{"label":"DAU","value":"12.5K","trend":"up"}] } }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"doc_view"` | 是 | 固定值 |
| title | string | 否 | 文档标题 |
| sections | Section[] | 是 | 文档 section 数组（至少 1 个） |
| showPanel | boolean | 否 | 显示批注面板侧边栏（默认 true） |
| panelPosition | `"right"` \| `"left"` \| `"bottom"` | 否 | 面板位置（默认 right） |

**Section 类型：**

| type | content | data | 说明 |
|------|---------|------|------|
| heading | string | — | 标题，可用 `level` (1-6) 控制层级 |
| text | string | — | 文本段落 |
| chart | "" | { chartType, x, y, data, ... } | 嵌入图表（使用图表组件 props） |
| kpi | "" | { metrics: [{label, value, trend, trendValue}] } | KPI 指标卡片 |
| table | "" | { columns: [{key, label}], data: [...] } | 数据表格 |
| callout | string | — | 高亮提示，可用 `variant` (`info`/`warning`/`success`/`error`/`neutral`) |
| component | "" | { ...props } | 嵌入 vizual 组件，用 `componentType` 指定组件 |
| markdown | string | — | Markdown 内容 |
| freeform | string (HTML) | — | 原始 HTML 内容 |

**通用 Section props：**

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | Section 类型 |
| content | string | 是 | 文本内容（chart/kpi/table/component 设为 ""） |
| data | object | 否 | 结构化数据（chart/kpi/table/component 使用） |
| level | number (1-6) | 否 | heading 层级 |
| variant | string | 否 | callout 样式变体 |
| componentType | string | 否 | 嵌入的 vizual 组件类型名 |
| title | string | 否 | section 标题 |
| aiContext | string | 否 | AI 语义描述，包含在批注 payload 中供 AI 理解上下文 |
| layout | `"default"` \| `"hero"` \| `"split"` \| `"grid"` \| `"banner"` \| `"card"` \| `"compact"` | 否 | section 布局变体 |
