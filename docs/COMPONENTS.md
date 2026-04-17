# 组件参考文档 — AI RenderKit

完整列出 42 个组件的 Schema、props 说明和使用示例。

> 所有图表组件共享以下可选 props：`title?: string`、`theme?: 'light' | 'dark'`、`height?: number`

---

## Charts (19) — ECharts via mviz Bridge

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
| type | `"line"` | 是 | |
| x | string | 否 | X 轴字段 |
| y | string \| string[] | 否 | Y 轴字段 |
| data | object[] | 是 | 数据 |
| smooth | boolean | 否 | 平滑曲线 |
| multiSeries | boolean | 否 | 多系列模式 |

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
| type | `"area"` | 是 | |
| stacked | boolean | 否 | 堆叠面积 |
| smooth | boolean | 否 | 平滑曲线 |

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
| type | `"pie"` | 是 | |
| value | string | 否 | 数值字段 |
| label | string | 否 | 标签字段 |
| donut | boolean | 否 | 环形图模式 |

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
| type | `"scatter"` | 是 | |
| size | string | 否 | 气泡大小字段 |
| groupField | string | 否 | 分组字段 |

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
| nodes | { name: string }[] | 否 | 节点列表 |
| links | { source, target, value }[] | 否 | 连接列表 |

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
| sparkType | `"line"` \| `"bar"` \| `"pct_bar"` | 否 | 迷你图类型 |

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
| series | { type: `"bar"` \| `"line"`, y: string }[] | 否 | 混合系列配置 |

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
| type | `"mermaid"` | 是 | |
| code | string | 是 | Mermaid 语法代码 |
| theme | `"default"` \| `"dark"` \| `"forest"` \| `"neutral"` | 否 | Mermaid 主题 |

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
| indicators | { name: string, max?: number }[] | 否 | 维度定义 |
| series | { name: string, values: number[] }[] | 否 | 数据系列 |
| x | string | 否 | 分类字段（table 模式） |
| y | string \| string[] | 否 | 数值字段（table 模式） |
| data | object[] | 否 | 数据数组（table 模式） |

---

## UI Components (8) — 纯 React

### BigValue

大数字指标展示。

```json
{
  "type": "big_value",
  "title": "月活用户",
  "value": "1.2M",
  "prefix": "$",
  "suffix": "USD",
  "trend": "up",
  "trendValue": "+15.3%"
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| value | string \| number | 是 | 主数值 |
| prefix | string | 否 | 前缀（如 $） |
| suffix | string | 否 | 后缀（如 %, USD） |
| trend | `"up"` \| `"down"` \| `"flat"` | 否 | 趋势方向 |
| trendValue | string | 否 | 趋势值（如 +15%） |

### Delta

变化量指标。

```json
{
  "type": "delta",
  "value": 150,
  "previousValue": 120,
  "label": "月收入",
  "direction": "up",
  "showPercentage": true
}
```

### Alert

警告横幅。

```json
{
  "type": "alert",
  "message": "系统将于今晚 22:00 维护",
  "severity": "warning"
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 警告内容 |
| severity | `"info"` \| `"warning"` \| `"error"` \| `"success"` | 否 | 级别 |

### Note

提示便签。

```json
{
  "type": "note",
  "content": "此数据基于 2024 年 Q1 的统计结果",
  "variant": "tip"
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 内容 |
| variant | `"info"` \| `"tip"` \| `"warning"` \| `"important"` | 否 | 样式变体 |

### TextBlock

文本块。

```json
{
  "type": "text",
  "content": "这是一段重要说明文字",
  "fontSize": 14,
  "align": "center"
}
```

### TextArea

多行文本（等宽字体）。

```json
{
  "type": "textarea",
  "content": "SELECT * FROM users WHERE active = true",
  "title": "SQL Query",
  "maxLines": 10
}
```

### DataTable

数据表格。

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

### EmptySpace

垂直间距。

```json
{ "type": "empty_space", "height": 24 }
```

---

## Business Components (11) — 自定义 React

### Timeline

垂直时间轴。

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

### Kanban

看板。

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

### GanttChart

甘特图。

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
| tasks | { id, name, start, end, progress?, color?, dependencies? }[] | 是 | 任务列表 |
| progress | number (0-100) | 否 | 完成进度 |

### OrgChart

组织架构图。

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

### KpiDashboard

KPI 仪表盘。

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

### BudgetReport

预算报表。

```json
{
  "type": "budget_report",
  "title": "2024 年度预算",
  "showVariance": true,
  "categories": [
    { "name": "研发", "budget": 500000, "actual": 480000 },
    { "name": "市场", "budget": 300000, "actual": 320000 },
    { "name": "运营", "budget": 200000, "actual": 180000 }
  ]
}
```

### FeatureTable

功能对比表。

```json
{
  "type": "feature_table",
  "title": "套餐对比",
  "products": ["基础版", "专业版", "企业版"],
  "features": [
    { "name": "用户数", "values": [5, 50, "无限"] },
    { "name": "API 调用", "values": [1000, 50000, "无限"] },
    { "name": "优先支持", "values": [false, true, true] }
  ]
}
```

### AuditLog

审计日志。

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

### JsonViewer

JSON 查看器。

```json
{
  "type": "json_viewer",
  "title": "API 响应",
  "data": { "status": "ok", "count": 42, "items": ["a", "b"] },
  "expanded": true,
  "maxDepth": 4
}
```

### CodeBlock

代码块。

```json
{
  "type": "code_block",
  "title": "main.py",
  "code": "def hello():\n    print('Hello World')",
  "language": "python",
  "showLineNumbers": true
}
```

### FormView

表单/键值对视图。

```json
{
  "type": "form_view",
  "title": "用户信息",
  "columns": 2,
  "fields": [
    { "label": "姓名", "value": "张三", "type": "text" },
    { "label": "邮箱", "value": "zhang@example.com", "type": "email" },
    { "label": "入职日期", "value": "2024-01-15", "type": "date" },
    { "label": "在职", "value": true, "type": "boolean" }
  ]
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| fields | { label, value, type? }[] | 是 | 字段列表 |
| type | `"text"` \| `"number"` \| `"date"` \| `"email"` \| `"url"` \| `"boolean"` | 否 | 字段类型 |
| columns | number | 否 | 列数 |

---

## Interactive/Input Components (4) — 交互输入组件

### InputText

文本输入框，支持多种输入类型。

```json
{
  "type": "InputText",
  "props": {
    "label": "姓名",
    "placeholder": "请输入姓名",
    "required": true
  }
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"InputText"` | 是 | 固定值 |
| label | string | 否 | 输入框标签 |
| placeholder | string | 否 | 占位文本 |
| value | string | 否 | 默认值 |
| inputType | `"text"` \| `"email"` \| `"password"` \| `"number"` \| `"url"` \| `"tel"` | 否 | 输入类型，默认 `text` |
| disabled | boolean | 否 | 是否禁用 |
| required | boolean | 否 | 是否必填 |
| description | string | 否 | 字段描述/提示文字 |
| error | string | 否 | 错误提示信息 |

### InputSelect

下拉选择框。

```json
{
  "type": "InputSelect",
  "props": {
    "label": "颜色",
    "options": [
      { "label": "红色", "value": "red" },
      { "label": "蓝色", "value": "blue" }
    ]
  }
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"InputSelect"` | 是 | 固定值 |
| label | string | 否 | 选择框标签 |
| placeholder | string | 否 | 占位文本 |
| value | string | 否 | 默认选中值 |
| options | { label: string, value: string }[] | 是 | 选项列表 |
| disabled | boolean | 否 | 是否禁用 |
| required | boolean | 否 | 是否必填 |
| description | string | 否 | 字段描述/提示文字 |
| error | string | 否 | 错误提示信息 |

### InputFile

文件上传组件，支持单文件和多文件模式。

```json
{
  "type": "InputFile",
  "props": {
    "label": "附件上传",
    "accept": ".pdf,.doc,.docx",
    "maxFiles": 3,
    "description": "支持 PDF、Word 文档，最多 3 个文件"
  }
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"InputFile"` | 是 | 固定值 |
| label | string | 否 | 上传区域标签 |
| accept | string | 否 | 接受的文件类型（MIME 或扩展名） |
| multiple | boolean | 否 | 是否允许多文件上传 |
| maxFiles | number | 否 | 最大文件数量，默认 1；0 表示不限制 |
| disabled | boolean | 否 | 是否禁用 |
| description | string | 否 | 上传说明文字 |
| error | string | 否 | 错误提示信息 |
| asBase64 | boolean | 否 | 是否以 Base64 编码返回文件内容 |

**单文件模式**（maxFiles=1）：上传后上传区域消失，显示文件卡片和删除按钮。

**多文件模式**（multiple=true 或 maxFiles>1）：显示文件列表，上传区域始终可见。

### FormBuilder

动态表单构建器，支持 18 种字段类型，可通过 JSON 配置生成完整表单。

```json
{
  "type": "FormBuilder",
  "props": {
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
}
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | `"FormBuilder"` | 是 | 固定值 |
| title | string | 否 | 表单标题 |
| columns | number | 否 | 表单列数 |
| submitLabel | string | 否 | 提交按钮文字 |
| fields | object[] | 是 | 字段配置列表（见下方字段类型） |

**支持的 18 种字段类型：**

| 字段 type | 说明 | 额外 props |
|-----------|------|-----------|
| text | 单行文本 | — |
| email | 邮箱 | — |
| password | 密码 | — |
| number | 数字 | — |
| url | URL 地址 | — |
| tel | 电话号码 | — |
| select | 下拉选择 | `options: { label, value }[]` |
| file | 文件上传 | — |
| textarea | 多行文本 | — |
| radio | 单选按钮组 | `options: { label, value }[]` |
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
| required | boolean | 否 | 是否必填 |
| disabled | boolean | 否 | 是否禁用 |
| description | string | 否 | 字段描述/提示文字 |
| defaultValue | any | 否 | 默认值 |
| dependsOn | string | 否 | 依赖的字段 name |
| showWhen | any | 否 | 当 dependsOn 字段值等于 showWhen 时显示 |
