# AI 集成指南 — Vizual

Vizual 是专为 **AI Agent** 设计的可视化组件库。通过 Skill 模式，AI Agent 能够智能选择组件并生成符合规范的 JSON spec。

## 设计理念

Vizual **不支持** ChatGPT / Claude.ai 等聊天机器人场景。我们专注于：

- **AI Agent 代码生成**（Claude Code、Cursor、Windsurf 等）
- **自动化工作流**（CI/CD、数据管道、报告生成）
- **程序化集成**（通过 npm 包在代码中调用）

如果你需要在聊天界面中使用，请寻找其他支持对话式交互的方案。

## Claude Code 集成

### 安装 Skills

Vizual 提供 3 个 Claude Code Skill，各有不同用途：

```bash
# 1. 核心可视化 Skill — 生成 JSON spec
cp -r skills/vizual/ ~/.claude/skills/vizual/

# 2. 主题解析 Skill — 将设计文档转为主题 token
cp -r skills/design-md-parser/ ~/.claude/skills/design-md-parser/

# 3. 实时交互 Skill — 创建可调整参数的交互页面
cp -r skills/livekit/ ~/.claude/skills/livekit/
```

### 使用方式

安装后，当用户请求以下内容时 Skill 自动触发：

**vizual Skill** — 可视化生成：
- "做一个柱状图展示季度销售"
- "生成 KPI 仪表盘"
- "用甘特图显示项目排期"
- "创建看板管理任务"

**design-md-parser Skill** — 主题解析：
- "把这个设计文档转成主题"
- "用我们品牌色配色"
- "apply this theme"
- 粘贴包含 hex 颜色、字体、间距值的内容

**livekit Skill** — 实时交互：
- "试试这个配色方案"
- "调一下看看效果"
- "做个参数探索"
- "对比一下暗色和亮色模式"

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

## 双向通信机制

Vizual 支持前端与 Agent 的双向通信，实现用户交互闭环。

### FormBuilder — 表单数据回调

当用户提交表单时，数据通过 `onSubmit` 回调返回：

```tsx
Vizual.renderSpec({
  root: 'form',
  elements: {
    form: {
      type: 'FormBuilder',
      props: {
        title: '用户调研',
        fields: [
          { name: 'email', type: 'email', label: '邮箱', required: true },
          { name: 'satisfaction', type: 'rating', label: '满意度', max: 5 },
          { name: 'feedback', type: 'textarea', label: '反馈意见' }
        ],
        onSubmit: (data) => {
          // data = { email: '...', satisfaction: 4, feedback: '...' }
          // 将数据发送给 Agent 继续处理
          agent.continue({ formData: data })
        }
      }
    }
  }
}, container)
```

### DocView — 批注回调

用户批注文档后，批注数据通过回调返回：

```tsx
Vizual.renderSpec({
  root: 'doc',
  elements: {
    doc: {
      type: 'DocView',
      props: {
        title: '报告草稿',
        sections: [
          { type: 'heading', content: 'Q1 业绩回顾' },
          { type: 'text', content: '营收同比增长 15%...' }
        ],
        onAnnotationAdd: (annotation) => {
          // 用户添加了新批注
        },
        onAnnotationSubmit: ({ annotationId, text, note, target }) => {
          // 用户请求 AI 修订
          agent.revise({ annotationId, text, note, target })
        },
        onBatchSubmit: (annotations) => {
          // 用户批量提交所有批注
          agent.reviseAll(annotations)
        }
      }
    }
  }
}, container)
```

### 接入方需要实现的逻辑

1. **传入回调**：渲染时传入 `onSubmit`/`onAction` 等回调
2. **转发数据**：回调里把数据通过 WebSocket / HTTP / 你的应用层协议 发给 Agent
3. **Agent 继续**：Agent 收到数据后继续对话

```tsx
// 示例：WebSocket 转发
const onFormSubmit = (data) => {
  ws.send(JSON.stringify({ type: 'form_submit', data }))
}

// Agent 端接收
ws.on('message', async (msg) => {
  const { type, data } = JSON.parse(msg)
  if (type === 'form_submit') {
    await agent.continue(`用户提交了表单：${JSON.stringify(data)}`)
  }
})
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
      "type": "GridLayout",
      "props": { "columns": 2, "gap": 16 },
      "children": ["chart", "table"]
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

### 使用布局组件组合

AI 可以通过布局组件（GridLayout、SplitLayout、HeroLayout）组合多个组件，创建复杂仪表盘布局：

```
"做一个仪表盘：顶部显示 KPI，中间两列放柱状图和表格"
→ HeroLayout + KpiDashboard, GridLayout + BarChart + DataTable
```

### 用 FormBuilder 收集用户信息

当需要向用户收集信息时，用 FormBuilder：

```
"帮我做一个用户调研表单"
→ FormBuilder + onSubmit 回调 → Agent 接收数据继续处理
```

## 组件总览

Vizual 共注册 **31 个组件**，分为 5 类：

| 类别 | 数量 | 组件 |
|------|------|------|
| 图表 (ECharts) | 19 | BarChart, AreaChart, LineChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram |
| 数据组件 | 1 | DataTable |
| 业务组件 | 6 | Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, AuditLog |
| 布局组件 | 3 | GridLayout, SplitLayout, HeroLayout |
| 表单组件 | 1 | FormBuilder |
| 文档组件 | 1 | DocView |
| **合计** | **31** | |
