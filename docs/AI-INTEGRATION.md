# AI 集成指南 — Vizual

Vizual 是专为 **AI Agent** 设计的可视化组件库。通过 Skill 模式，AI Agent 能够智能选择组件并生成符合规范的 JSON spec。

## 设计理念

Vizual **不支持** ChatGPT / Claude.ai 等聊天机器人场景。我们专注于：

- **AI Agent 代码生成**（Claude Code、Cursor、Windsurf 等）
- **自动化工作流**（CI/CD、数据管道、报告生成）
- **程序化集成**（通过 npm 包在代码中调用）

如果你需要在聊天界面中使用，请寻找其他支持对话式交互的方案。

## Claude Code 集成

### 安装 Skill

```bash
cp -r skills/vizual/ ~/.claude/skills/vizual/
```

### 使用方式

安装后，当用户请求以下内容时，Skill 自动触发：

- "做一个柱状图展示季度销售"
- "生成 KPI 仪表盘"
- "用甘特图显示项目排期"
- "创建看板管理任务"

Skill 会输出符合 json-render 规范的 JSON spec，开发者将其传入 `<Renderer>` 即可渲染。

### Skill 结构

Vizual Skill 采用**渐进式披露**设计：

```
~/.claude/skills/vizual/
├── SKILL.md                 # 主入口：触发条件、输出格式、组件选择指南
└── references/              # 按需加载的详细参考
    ├── component-catalog.md # 43 个组件的完整 Schema
    ├── recipes.md           # 组合模式模板
    └── ...                  # 其他参考文档
```

这种设计确保：
- 常见场景：只需 SKILL.md 中的信息
- 复杂场景：AI 自动读取 references/ 获取详细信息
- 最小化 Token 消耗

## 其他 AI Agent 集成

对于 Cursor、Windsurf 等 AI Agent，将 `skills/vizual/prompt.md` 内容作为 System Prompt 传入。

## 前端渲染

AI Agent 输出的 JSON spec 通过 json-render 渲染：

```tsx
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

function AgentOutput({ aiJsonOutput }) {
  return (
    <StateProvider>
      <Renderer spec={aiJsonOutput} registry={registry} />
    </StateProvider>
  )
}
```

## AI 输出格式规范

### 单组件示例

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "title": "季度销售额",
        "x": "quarter",
        "y": "revenue",
        "data": [
          { "quarter": "Q1", "revenue": 120 },
          { "quarter": "Q2", "revenue": 200 },
          { "quarter": "Q3", "revenue": 180 },
          { "quarter": "Q4", "revenue": 310 }
        ]
      },
      "children": []
    }
  }
}
```

### 多组件组合示例

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
        "title": "核心指标",
        "columns": 3,
        "metrics": [
          { "label": "DAU", "value": "12,345", "trend": "up", "trendValue": "+5.2%" },
          { "label": "收入", "value": "¥89.2K", "trend": "up", "trendValue": "+12%" },
          { "label": "转化率", "value": "3.8%", "trend": "down", "trendValue": "-0.4%" }
        ]
      },
      "children": []
    },
    "chart": {
      "type": "LineChart",
      "props": {
        "type": "line",
        "title": "收入趋势",
        "x": "month",
        "y": "revenue",
        "data": [
          { "month": "Jan", "revenue": 100 },
          { "month": "Feb", "revenue": 120 },
          { "month": "Mar", "revenue": 150 }
        ]
      },
      "children": []
    },
    "table": {
      "type": "DataTable",
      "props": {
        "type": "table",
        "columns": [
          { "key": "product", "label": "产品" },
          { "key": "sales", "label": "销量" }
        ],
        "data": [
          { "product": "A", "sales": 100 },
          { "product": "B", "sales": 200 }
        ]
      },
      "children": []
    }
  }
}
```

## 最佳实践

### 提供完整数据

AI Agent 需要数据才能生成有意义的可视化。在请求中包含完整的数据集：

```
"用以下数据创建柱状图：Q1=120万, Q2=200万, Q3=180万, Q4=310万"
```

### 指定组件类型

虽然 AI 可以自动推断，但明确指定组件类型可以获得更准确的结果：

```
"用甘特图展示项目排期" → GanttChart
"创建看板" → Kanban
"展示 KPI" → KpiDashboard
```

### Schema 校验

在代码中校验 AI 输出：

```ts
import { BarChartSchema } from 'vizual'

const result = BarChartSchema.safeParse(aiOutput.props)
if (!result.success) {
  console.error('AI 输出不符合 Schema:', result.error)
}
```
