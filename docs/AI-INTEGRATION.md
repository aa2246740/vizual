# AI 集成指南 — AI RenderKit

如何将 AI RenderKit 接入 Claude、GPT 等 LLM，实现对话式数据可视化。

## 两种接入方式

| | Claude Code Skill | 通用 LLM Prompt |
|---|---|---|
| **适用** | Claude Code、Cursor 等 Agent | ChatGPT、Claude.ai、Gemini 等 |
| **文件** | `skill/SKILL.md` + references/ | `skill/prompt.md`（单文件） |
| **安装** | 复制到 `~/.claude/skills/` | 粘贴到 System Prompt 字段 |
| **加载** | 自动触发，按需读取 reference | 全量加载到上下文 |
| **校验** | 内置 `validate-spec.js` | 需手动校验 |

两种方式输出的 JSON 格式完全相同。

## 核心思路

```
1. 获取 AI Prompt（组件 Schema 说明）
2. 将 Prompt 作为 system message 传给 AI
3. 用户提问 → AI 输出 JSON
4. JSON 传给 json-render Renderer → 渲染组件
```

## Step 1: 获取 System Prompt

```ts
import { renderKitCatalog } from 'ai-render-kit'

// 生成约 22KB 的系统提示词
const systemPrompt = renderKitCatalog.prompt()
```

prompt 内容包含：
- 37 个组件的 type 名称
- 每个组件的 props Schema（字段名、类型、是否必填）
- JSON spec 格式说明
- 使用示例

## Step 2: 接入 OpenAI (GPT-4)

```ts
import OpenAI from 'openai'
import { renderKitCatalog } from 'ai-render-kit'

const openai = new OpenAI()
const systemPrompt = renderKitCatalog.prompt()

async function chat(userMessage: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
  })

  const json = JSON.parse(response.choices[0].message.content)
  return json  // → 传给 Renderer
}
```

## Step 3: 接入 Claude

```ts
import Anthropic from '@anthropic-ai/sdk'
import { renderKitCatalog } from 'ai-render-kit'

const anthropic = new Anthropic()
const systemPrompt = renderKitCatalog.prompt()

async function chat(userMessage: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
    ],
  })

  // 从回复中提取 JSON
  const text = message.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch[0])
}
```

## Step 4: 前端渲染

```tsx
import { registry } from 'ai-render-kit'
import { Renderer, StateProvider } from '@json-render/react'

function ChatBubble({ aiJsonOutput }) {
  return (
    <StateProvider>
      <Renderer spec={aiJsonOutput} registry={registry} />
    </StateProvider>
  )
}
```

## Step 5: 流式输出

对于流式场景（SSE / WebSocket），逐字符接收 JSON，完整后渲染：

```tsx
function StreamingChat() {
  const [partialJson, setPartialJson] = useState('')
  const [spec, setSpec] = useState(null)

  // 模拟流式接收
  useEffect(() => {
    eventSource.onmessage = (event) => {
      setPartialJson(prev => prev + event.data)

      try {
        const parsed = JSON.parse(partialJson)
        setSpec(parsed)  // JSON 完整 → 渲染
      } catch {
        // JSON 不完整 → 继续等待
      }
    }
  }, [])

  if (spec) {
    return (
      <StateProvider>
        <Renderer spec={spec} registry={registry} />
      </StateProvider>
    )
  }

  return <pre>{partialJson}</pre>  // 显示打字效果
}
```

## AI Prompt 内容示例

`renderKitCatalog.prompt()` 生成的提示词大致结构：

```
You are a data visualization assistant. You output JSON specs that can be
rendered by the json-render platform.

Available components:

## BarChart
- type: "bar"
- Props:
  - type: "bar" (required)
  - x: string (required) - X axis field name
  - y: string | string[] (required) - Y axis field(s)
  - data: object[] (required) - Data array
  - stacked?: boolean
  - horizontal?: boolean
  - title?: string
  - theme?: "light" | "dark"

[... 37 components total ...]

Output format:
{
  "root": "<element-id>",
  "elements": {
    "<element-id>": {
      "type": "<ComponentType>",
      "props": { ... },
      "children": []
    }
  }
}
```

## 实际对话示例

```
用户: "用柱状图展示我们四个季度的销售额，Q1 120万，Q2 200万，Q3 180万，Q4 310万"

AI 输出:
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

```
用户: "帮我做一个 KPI 仪表盘，包含 DAU、收入、转化率三个指标"

AI 输出:
{
  "root": "main",
  "elements": {
    "main": {
      "type": "KpiDashboard",
      "props": {
        "type": "kpi_dashboard",
        "title": "核心指标",
        "columns": 3,
        "metrics": [
          { "label": "DAU", "value": "12,345", "trend": "up", "trendValue": "+5.2%" },
          { "label": "收入", "value": "¥89.2K", "trend": "up", "trendValue": "+12.1%" },
          { "label": "转化率", "value": "3.8%", "trend": "down", "trendValue": "-0.4%" }
        ]
      },
      "children": []
    }
  }
}
```

## 最佳实践

### 给 AI 足够的数据

AI 不能凭空编造数据。在 prompt 中提供真实数据：

```
"帮我用饼图展示以下部门预算占比：
研发部 40%，市场部 25%，运营部 20%，行政部 15%"
```

### 引导 AI 选择合适的组件

```
"用折线图展示"    → LineChart
"做个对比"         → FeatureTable / BarChart
"展示流程"         → MermaidDiagram / Timeline
"做个仪表盘"       → KpiDashboard
"展示层级关系"     → OrgChart
"项目排期"         → GanttChart
```

### 多组件组合

json-render 支持在一个 spec 中组合多个组件。引导 AI 输出带 children 的结构：

```
"帮我做一个综合仪表盘，顶部是 KPI 卡片，中间是折线图，下面是数据表格"
```

### Schema 校验

可以用 Zod Schema 在前端校验 AI 输出：

```ts
import { BarChartSchema } from 'ai-render-kit'

const result = BarChartSchema.safeParse(aiOutput.props)
if (!result.success) {
  console.error('AI 输出不符合 Schema:', result.error)
}
```
