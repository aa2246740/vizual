# 把 Vizual 接入现有 Agent Chatbot

[English version](CHATBOT-INTEGRATION.md)

这篇文档面向已经存在的 Agent 聊天产品。你的系统至少需要有：

- 后端可以给 Agent 暴露 tool / function
- 聊天消息流或历史记录里能保存 assistant message、tool call、tool result
- 前端可以自定义消息渲染，最好是 React；如果不是 React，也需要能挂载 React 组件

Vizual 不替换你的 Agent 框架。它增加的是一个宿主渲染工具：
`present_vizual_ui`。Agent 自己判断什么时候调用；宿主后端校验 payload，
把 envelope 存进聊天历史；宿主前端把它渲染成内联 UI；用户点击或提交后，
宿主再把 action 回传给 Agent。

## Core 能做到什么，不能做到什么

Vizual core 能做到：

- 归一 Vizual native input、A2UI 风格 message、AG-UI 风格 event
- 校验输入是否能生成可渲染 native surface
- 在前端挂载前 preview 最终 spec
- 渲染图表、KPI 卡片、表格、Markdown、图示、时间线、表单和控件
- 发出 `submitForm`、`applyFilter`、`drillDown` 等宿主可见 action
- 跟踪输入控件产生的本地 state changes
- 提供可选的 runtime 工具：导出当前图表/面板为 PNG、复制抽取出的数据、
  下载表格/图表数据 CSV

Vizual core 不能做到：

- 自己把 UI 注入一个封闭 chatbot 页面
- 替你的产品决定业务流程、权限、存储、审批、派单
- 自己调用数据库或外部系统，除非你的 host action handler 去做
- 在 Agent 不能 call tool 或不遵守接入规则时，保证 Agent 正确使用 Vizual

如果一个 chatbot 既不能给 Agent 暴露 tool，又不能自定义前端消息渲染，
Vizual 仍然可以通过 MCP 或 skill 让 Agent 生成 payload，但宿主页面不能凭空显示内联 UI。

## 架构

```text
用户消息
  -> Agent
  -> tool call: present_vizual_ui({ input, surfaceId, fallbackText, display })
  -> 宿主后端校验并返回 Vizual envelope
  -> 聊天历史保存 assistant text + tool call + tool result
  -> 宿主前端提取 Vizual envelope
  -> VizualRenderer 渲染内联 surface
  -> 用户点击/提交控件
  -> 宿主把内部 follow-up message 或 event 回传 Agent
```

## Step 1. 前端安装 Vizual

```bash
npm install vizual react react-dom
```

pnpm：

```bash
pnpm add vizual react react-dom
```

## Step 2. 后端新增 tool

给 Agent 暴露一个叫 `present_vizual_ui` 的 tool。它接收一个 object，
其中 `input` 必填，其他展示信息可选。

```ts
import {
  createVizualAgentToolDefinition,
  createVizualAgentToolResult,
} from 'vizual'

export const presentVizualUiToolDefinition =
  createVizualAgentToolDefinition({ includeCatalogManifest: true })

export async function presentVizualUi(args: {
  input: unknown
  surfaceId?: string
  fallbackText?: string
  display?: { title?: string; mode?: 'inline' | 'side-panel' | 'artifact'; persist?: boolean }
}) {
  return createVizualAgentToolResult(args.input as any, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })
}
```

然后用你的 Agent 框架注册这个 tool：

- OpenAI 风格 function calling：注册 `presentVizualUiToolDefinition`
- LangChain / LangGraph：把 `presentVizualUi` 包成 structured tool
- MCP-first host：运行 `vizual-core-mcp`，同时宿主前端负责渲染返回 envelope

框架不是重点。重点是 tool result 必须进入聊天历史，并且前端能找到。

不要自己手写 tool result，除非你在把 SDK 移植到另一种语言。
`createVizualAgentToolResult()` 是官方 host 边界：只有 Core 能 preview 出真实
可渲染 native surface 时才会返回 `ok:true`；失败时会返回 `issues` 和
`fixes`，给 Agent 做自我修复。

## Step 3. 告诉 Agent 使用边界

把这段放进 Agent instruction、skill 或 tool policy：

```text
你可以使用 present_vizual_ui。它是宿主渲染的 Vizual runtime，
用于在对话中插入内联可视化或交互 UI。

当用户的自然语言请求适合用图表、表格、KPI 卡片、时间线、图示、表单、
筛选器或有用控件表达时，使用它。

短文本回答不要使用它。
如果用户明确要求网页、HTML 文件、React app、游戏、SVG、代码 artifact、
可下载或可打开文件，不要使用它；按用户要求走文件/网页路径。

普通解释写在 assistant text 里。tool call 里只放结构化 Vizual input。

图表优先使用 props.data + typed props.encoding；多指标或 ComboChart 图层使用
props.measures。长表分类分组放在 encoding.color、seriesBy、colorBy 或 groupBy。
不要把 string series 当作推荐图表路径。

如果 tool 返回 ok:false，阅读 issues 并修复 payload，不要声称 UI 已经完成。
失败的内部修复尝试不应该作为最终用户可见内容。

交互分两类：

1. 本地 playground 交互留在 Vizual surface 内部。滑杆、筛选器、开关、
   输入控件可以直接更新当前面板，不需要再次问 Agent。
2. Agent round-trip action 必须由宿主回传给 Agent，例如 submitForm、
   applyFilter、drillDown、selectLocation、updatePlan。
只有交互有用且宿主能接收时才使用 action。
复制、导出、下载、分享、持久化等操作属于宿主产品外壳能力，不属于
Vizual native core。
```

## Step 4. 保存 tool call 和 tool result

聊天历史里至少要保留这些信息：

```ts
type ChatMessage =
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content: string
      toolCalls?: Array<{ id: string; name: string; args: unknown }>
    }
  | {
      role: 'tool'
      toolCallId: string
      name: string
      content: unknown
    }
```

不要把 Vizual tool result 压成纯文本。必须保留 `envelope`。

## Step 5. 前端从消息里提取 Vizual

```ts
import {
  extractVizualPresentations,
  selectRenderableVizualPresentations,
} from 'vizual'

const visible = selectRenderableVizualPresentations(
  extractVizualPresentations(messages),
)
```

不要手写 `filter(item => item.ok)`。`ok: true` 只代表 tool result 声称成功；
SDK selector 还会要求 native preview 成功并拿到真实可渲染 spec。

失败 tool attempt 是给 Agent 修复用的，不应该在用户可见聊天里变成错误卡片。

## Step 6. 渲染内联 UI

```tsx
import {
  VizualRenderer,
  previewVizualNativeInput,
  applyVizualStateChanges,
  buildVizualActionMessage,
  type VizualStateChange,
} from 'vizual'
import { useMemo, useRef, useState } from 'react'

export function VizualInline({
  presentation,
  sendInternalUserMessage,
}: {
  presentation: {
    input: unknown
    surfaceId?: string
    fallbackText?: string
    display?: { title?: string }
    toolCallId?: string
  }
  sendInternalUserMessage: (text: string) => Promise<void>
}) {
  const [state, setState] = useState<Record<string, unknown>>({})
  const currentState = useRef<Record<string, unknown>>({})

  const preview = useMemo(
    () =>
      previewVizualNativeInput(presentation.input as any, {
        surfaceId: presentation.surfaceId,
        fallbackText: presentation.fallbackText,
      }),
    [presentation],
  )

  if (!preview.ok || !preview.spec) {
    return null
  }

  function onStateChange(changes: VizualStateChange[]) {
    currentState.current = applyVizualStateChanges(currentState.current, changes)
    setState(currentState.current)
  }

  async function returnActionToAgent(name: string, params: Record<string, unknown>) {
    await sendInternalUserMessage(
      buildVizualActionMessage({
        presentation,
        action: name,
        params,
        currentState: currentState.current,
      }),
    )
  }

  const handlers = {
    submitForm: (params: Record<string, unknown>) => returnActionToAgent('submitForm', params),
    applyFilter: (params: Record<string, unknown>) => returnActionToAgent('applyFilter', params),
    drillDown: (params: Record<string, unknown>) => returnActionToAgent('drillDown', params),
    selectLocation: (params: Record<string, unknown>) => returnActionToAgent('selectLocation', params),
    updatePlan: (params: Record<string, unknown>) => returnActionToAgent('updatePlan', params),
  }

  return (
    <section data-vizual-surface-id={presentation.surfaceId} data-vizual-render-status="visible">
      {presentation.display?.title ? <h3>{presentation.display.title}</h3> : null}
      <VizualRenderer
        spec={preview.spec}
        initialState={state}
        handlers={handlers}
        onStateChange={onStateChange}
      />
    </section>
  )
}
```

如果聊天产品需要复制、导出、下载、分享或持久化控件，请在
`VizualRenderer` 外层的宿主产品外壳里实现。

生产环境还应该做一次 DOM 可见性审计：如果 preview 说有图表/控件，
但挂载后是空白，就隐藏卡片并记录 evidence。

## Step 7. 让文字和 Vizual 混排在同一轮回答里

消息渲染器应该让 assistant prose 和 Vizual UI 出现在同一轮：

```tsx
function AssistantMessage({ message, allMessages }) {
  const presentations = selectRenderableVizualPresentations(
    extractVizualPresentations(allMessages),
  ).filter(
    item => message.toolCalls?.some(call => call.id === item.toolCallId),
  )

  return (
    <div className="assistant-message">
      {message.content ? <Markdown>{message.content}</Markdown> : null}
      {presentations.map(item => (
        <VizualInline
          key={item.toolCallId ?? item.surfaceId}
          presentation={item}
          sendInternalUserMessage={sendInternalUserMessage}
        />
      ))}
    </div>
  )
}
```

除非你的产品就是刻意做侧边栏，否则不要把所有 Vizual surface 放到一个单独全局区域。
内联图表证明通常应该贴近解释它的 assistant 文本。

## Step 8. 隐藏内部 action message

用户点击 Vizual 按钮或提交表单后，宿主可能会向 Agent 发送一条内部用户消息。
这条消息要给 Agent 看，但通常不要给用户看：

```ts
function isInternalVizualActionMessage(message: ChatMessage) {
  return (
    message.role === 'user' &&
    message.content.startsWith('用户在 Vizual 交互界面触发了一个动作') &&
    message.content.includes('surfaceId:') &&
    message.content.includes('action:')
  )
}
```

## Step 9. 验收

不能只跑单元测试。必须用真实浏览器和自然语言任务验收。

先跑项目检查：

```bash
npm test
npm run typecheck
npm run build
```

然后在你的 chatbot 里用新题测试：

1. 数据分析：粘一小批表格，问为什么某指标上升但利润下降。
2. 概念互动：要求可调参数解释二分查找、排队模型或现金流敏感性。
3. action 回传：点击 drill-down、filter 或表单提交，确认 Agent 能接着返回。
4. 纯文本负向：明确要求只用文字，确认不出现 UI。
5. 显式 artifact 负向：要求 `index.html` 或 React app，确认没有强行转 Vizual。
6. 失败吸收：开发环境故意诱发 unsupported component，确认失败 attempt 不显示给用户，最终回答仍可用。

## 最小接入清单

- Agent 能调用 `present_vizual_ui`。
- 后端返回 `ok`、`issues` 和 `envelope`。
- 聊天历史保留 tool call 和 tool result。
- 前端能从消息里提取 Vizual envelope。
- 前端只渲染 `selectRenderableVizualPresentations` 返回的 presentation。
- 失败修复 attempt 不显示成错误卡片。
- assistant 文本和 Vizual UI 能在同一轮混排。
- Vizual action 能回传 Agent。
- 内部 action message 对用户隐藏。
- 浏览器验收看真实像素，不只看 JSON。
