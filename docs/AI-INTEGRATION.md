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
- "做个参数探索 playground"
- "对比一下暗色和亮色模式"

Skill 会输出符合 json-render 规范的 JSON spec（vizual）或 HTML 页面（livekit），开发者将其传入 `<Renderer>` 即可渲染。

### Skill 结构

三个 Skill 均采用**渐进式披露**设计：

#### vizual Skill

```
~/.claude/skills/vizual/
├── SKILL.md                 # 主入口：触发条件、输出格式、组件选择指南
└── references/              # 按需加载的详细参考
    ├── component-catalog.md # 32 个组件的完整 Schema
    └── recipes.md           # 组合模式模板
```

#### design-md-parser Skill

```
~/.claude/skills/design-md-parser/
├── SKILL.md                 # 主入口：解析规则、Dual Naming 原则、token 提取
└── references/              # 按需加载
    └── vizual-theme-vars.md # 完整主题变量映射表
```

#### livekit Skill

```
~/.claude/skills/livekit/
├── SKILL.md                 # 主入口：三种用法（组件级/主题级/自定义级）
└── references/              # 按需加载
    ├── component-level.md   # InteractivePlayground API
    ├── theme-level.md       # 主题试衣页面模板
    └── custom-level.md      # 自定义 HTML 骨架
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

### 多组件组合示例（使用布局组件）

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "VerticalLayout",
      "props": {},
      "children": ["hero", "grid", "table"]
    },
    "hero": {
      "type": "HeroLayout",
      "props": { "height": 240, "background": "gradient" },
      "children": ["heroContent"]
    },
    "heroContent": {
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
    "grid": {
      "type": "GridLayout",
      "props": { "columns": 2, "gap": 16 },
      "children": ["chart", "summary"]
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
    "summary": {
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
    },
    "table": {
      "type": "SplitLayout",
      "props": { "direction": "horizontal", "ratio": 60 },
      "children": ["leftContent", "rightContent"]
    }
  }
}
```

### AI 驱动的交互演示（InteractivePlayground）

AI 可以生成可交互的参数探索器，让用户实时调整组件参数：

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "InteractivePlayground",
      "props": {
        "type": "interactive_playground",
        "title": "柱状图参数探索",
        "component": {
          "type": "BarChart",
          "props": {
            "type": "bar",
            "x": "quarter",
            "y": "revenue",
            "data": [
              { "quarter": "Q1", "revenue": 120 },
              { "quarter": "Q2", "revenue": 200 },
              { "quarter": "Q3", "revenue": 180 },
              { "quarter": "Q4", "revenue": 310 }
            ]
          }
        },
        "controls": [
          { "name": "title", "label": "标题", "type": "text", "targetProp": "title", "defaultValue": "季度销售" },
          { "name": "stacked", "label": "堆叠模式", "type": "toggle", "targetProp": "stacked", "defaultValue": false },
          { "name": "colorCount", "label": "颜色数", "type": "slider", "min": 3, "max": 6, "step": 1, "defaultValue": 4, "targetProp": "colorCount" }
        ],
        "layout": "side-by-side"
      },
      "children": []
    }
  }
}
```

## AI 可触发的 Action Handler

Vizual 注册了 3 个 action handler，AI Agent 可以通过 JSON spec 触发：

### submitForm — 表单提交

```json
{
  "type": "FormBuilder",
  "props": {
    "type": "form_builder",
    "fields": [...]
  },
  "actions": {
    "onSubmit": { "type": "submitForm", "params": { "formId": "contact-form" } }
  }
}
```

宿主应用接收 `{ formId, data, submittedAt }`，可用于服务端校验或触发后续 AI 工作流。

### requestRevision — 单批注 AI 修订

在 DocView 中，用户对某个批注点击"请求修订"时触发。宿主应用将其连接到 AI API，传入批注上下文（包含 section 的 aiContext 语义描述）。

### batchSubmit — 批量修订提交

DocView 修订循环中，一次性提交所有草稿批注供 AI 处理。

### 接入方式

```tsx
import { registry, handlers } from 'vizual'
import { JSONUIProvider, StateProvider, Renderer } from '@json-render/react'

// handlers() 返回 action 处理函数映射
// 默认实现将提交数据存入 state（_formSubmissions, _revisionRequests, _batchSubmissions）
// 宿主应用可覆盖以连接自定义后端
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
"做一个仪表盘：顶部 Hero 区显示 KPI，中间两列放柱状图和表格"
→ HeroLayout + KpiDashboard, GridLayout + BarChart + DataTable
```

### 使用 InteractivePlayground 做演示

当用户需要"试试看"某个组件的效果时，AI 可以用 InteractivePlayground 包裹组件并暴露关键参数：

```
"帮我做一个可以调参数的柱状图"
→ InteractivePlayground + BarChart + slider/toggle 控件
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

## 组件总览

Vizual 共注册 **32 个组件**，分为 5 类：

| 类别 | 数量 | 组件 |
|------|------|------|
| 图表 (mviz bridge) | 19 | BarChart, AreaChart, LineChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram |
| UI (mviz bridge) | 1 | DataTable |
| 业务组件 | 6 | Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, AuditLog |
| 布局组件 | 3 | GridLayout, SplitLayout, HeroLayout |
| 交互组件 | 2 | FormBuilder, InteractivePlayground |
| 文档组件 | 1 | DocView |
| **合计** | **32** | |
