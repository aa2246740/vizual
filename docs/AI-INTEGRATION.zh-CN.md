# AI 集成指南 - Vizual

Vizual 是给 AI Agent 产品接入的原生视觉运行时。用户仍然用普通语言提问；Agent 判断纯文本不够直观时，可以在普通回复中插入一个内联可视或互动 UI block。宿主前端把 Agent 返回的 Vizual payload 渲染成图表、KPI、表格、时间线、组织图、甘特图、Markdown、表单和轻量 A2UI primitives。

Vizual 不是关键词路由器、页面模板库或创作门禁。Agent 自己决定是否使用 Vizual、放在回复哪里、组合哪些能力；Vizual 提供 catalog、schema、校验、渲染、artifact 和 action 回传能力。

## 产品边界

- **自然对话可视化**：用户提出分析、解释、规划、比较、诊断或决策问题；当趋势、对比、分布、关系、状态流转、填写、筛选或假设探索用文字不够直观时，Agent 可插入 Vizual UI。
- **纯文本负向**：短事实、普通解释、轻量改写、命令说明、闲聊、用户明确要求纯文本时，不要为了展示能力而生成 UI。
- **显式创作请求**：用户明确要网页、landing page、小游戏、React/HTML/CSS、SVG、代码 artifact 或自定义页面时，按该创作路径处理；除非用户要求嵌入 Vizual surface，否则不要强行转成 Vizual Native。
- **有用交互**：按钮、表单、筛选、drill-down、plan update 等交互必须能帮助用户理解、修改状态或触发宿主明确提供的能力。不要为了证明“可交互”而添加无业务意义的控件。
- **Catalog Gap metadata**：当 Agent 或 SDK 发现 Native Catalog 缺少合适表达能力时，可以用可选 metadata 记录 gap；它不进入 UI spec 本体、不改变渲染、不影响输出成功。

## 两层接入

### Agent 层

推荐三种显式能力入口，按宿主条件选择：

- **Skill**：安装 `skills/vizual/`，让 Agent 在判断可视或互动表达会改善回答时使用 Vizual。
- **MCP**：启动 `vizual-core-mcp`，让 Agent 通过 `vizual_catalog` 发现当前 Native Catalog，通过 `vizual_validate` / `vizual_preview` 自检，再用宿主工具呈现 UI。
- **SDK tool schema**：宿主用 `createVizualAgentToolDefinition()` 暴露 `present_vizual_ui`，让 Agent 用 tool call 返回 Vizual native payload。

`skills/vizual/prompt.md` 只保留作 legacy fallback：当某个 Agent 产品既不能安装 Skill，也不能接 MCP/工具定义时，才把它作为显式集成配置使用。冷启动验收不应依赖隐藏 System Prompt 注入。

Native Catalog 是组件、action/function、data binding、theme token、artifact 行为和兼容映射的单一真相。Skill、MCP、SDK tool schema 和文档只解释如何发现和使用它；不要在接入层维护第二套手写能力清单。

### 宿主层

宿主前端需要支持：

- 渲染一次性 JSON spec。
- 保存 `VizualArtifact` 到聊天记录或业务存储。
- 后续追问时基于 artifact targetMap 做 patch。
- 导出 PNG/PDF/CSV/XLSX。
- liveControl 场景下提供 FormBuilder state bridge。
- 接收 host-visible actions：`submitForm`、`applyFilter`、`drillDown`、`selectLocation`、`updatePlan`。

Vizual 可以接入自有 SaaS 小聊天窗、完整 ChatGPT-like 对话页、DeerFlow 类 Agent 平台或 B 端工作台；但不能直接在 ChatGPT / Claude.ai 这类封闭消费级聊天界面里渲染，除非平台方集成 Vizual runtime。

把一个现有 chatbot 逐步改造成支持 Vizual，见 [CHATBOT-INTEGRATION.zh-CN.md](CHATBOT-INTEGRATION.zh-CN.md)。
已经接入过旧版 Vizual 原型的 DeerFlow 项目，见 [DEERFLOW-UPGRADE.zh-CN.md](DEERFLOW-UPGRADE.zh-CN.md)。

## Agent Bridge 契约

不要把测试页里的全局函数当成唯一实现来源。Vizual 提供 `createAgentBridge()` 作为宿主协议的状态层：它负责 artifact registry、messageId 到 artifactId 绑定、render history、liveControl snapshot 查找和导出/错误事件记录。

```tsx
import { createAgentBridge, normalizeArtifact } from 'vizual'

const bridge = createAgentBridge({
  getPendingMessage: () => currentPendingMessage,
})

const artifact = bridge.rememberArtifact(messageId, normalizeArtifact(spec))
const same = bridge.getArtifact(artifact.id)
const byMessage = bridge.getArtifact(messageId)
bridge.recordRender('static', messageId, { status: 'success', artifactId: artifact.id })
```

## 渲染普通 spec

```tsx
import { VizualRenderer } from 'vizual'

function AgentVisual({ spec }) {
  return <VizualRenderer spec={spec} />
}
```

`VizualRenderer` 是推荐入口：它封装 json-render 的 provider、Vizual registry、内置 action handlers、`$computed`、`$bindState` 和 visibility context。不要在宿主里只写 `StateProvider + Renderer`，否则当前 json-render 会缺少必要 provider。

普通数据分析、Dashboard、报表通常用宿主文本 + 语义组件组合，例如 KPI、charts、DataTable、Markdown，必要时加 FormBuilder。外层优先用 `Column` / `Row` / `Container` 做轻量组织。页面级设计不属于 native core。

## 保存可追问 Artifact

当用户之后可能会说“这张图改成折线图”“只看华东区”“导出 PDF”时，保存 artifact，而不是只保存原始 JSON。

```tsx
import { createHostRuntime, createMemoryArtifactStore, VizualArtifactView } from 'vizual'
import { createRoot } from 'react-dom/client'

const runtime = createHostRuntime({
  store: createMemoryArtifactStore(),
  renderArtifact: async (artifact, container) => {
    const root = createRoot(container)
    root.render(<VizualArtifactView artifact={artifact} />)
    return { artifact, root }
  },
})

const artifact = await runtime.renderMessageArtifact({
  conversationId,
  messageId,
  prompt: userText,
  spec: aiSpec,
  container,
})
```

关键原则：

- 使用 targetMap，不要猜 JSON path。
- follow-up 修改默认生成新的 AI 气泡，旧气泡作为历史保留。
- `mode: 'replace'` 只适合临时预览，不适合真实聊天历史。

## liveControl 图表

liveControl 不是纯 JSON spec。宿主需要提供 bridge：FormBuilder 控件绑定 state，预览由 `makeSpec(state)` 重新渲染。

只有当参数调整本身能帮助用户探索或决策时才使用 liveControl。不要把 slider、按钮或表单当成展示 runtime 能力的装饰。

## Actions

| Action | 用途 |
| --- | --- |
| `submitForm` | FormBuilder 或输入组件把结构化数据交回 host Agent |
| `applyFilter` | 用户选择筛选条件，影响可见状态或 host context |
| `drillDown` | 用户选择图表点、表格行或实体，请求深入分析 |
| `selectLocation` | 用户选择网点、区域、门店等位置实体 |
| `updatePlan` | 用户更新一个可见计划/状态项 |

这些只是 host-visible event。Vizual 不会自己保存、审批、派单、写数据库或调用外部系统。

## 当前 Agent-Facing Catalog

详见 [COMPONENTS.zh-CN.md](COMPONENTS.zh-CN.md)。Native core 不保留单独的 runtime-only 页面布局组件。

已从 native core 移除的旧组件会被视为 unsupported input，不应出现在新输出里。

## 验收要求

真实验收必须用浏览器看渲染结果，不能只看 JSON：

- 自然语言任务触发数据分析、概念互动、表单输入、项目/组织/时间线等不同能力。
- A2UI / AG-UI / native operations 都归一到同一 native catalog。
- FormBuilder 提交能进入 host-visible action log。
- 纯文本请求不强塞 UI。
- 显式网页/HTML/React 请求不被强行转为 native core。
- 已移除组件返回稳定 unsupported error。
