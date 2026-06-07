<div align="center">

# Vizual

**给 AI Agent 用的原生可视化与交互 UI 运行时。**

Vizual 让 AI Agent 可以在对话中自然地产生图表、仪表盘、表格、表单、时间线、组织图、甘特图、流程图和可交互 UI。用户仍然正常提问；Agent 自己判断什么时候需要可视化或交互表达。

[English](README.md) · [快速开始](docs/GETTING-STARTED.zh-CN.md) · [Chatbot 接入](docs/CHATBOT-INTEGRATION.zh-CN.md) · [Agent 接入](docs/AI-INTEGRATION.zh-CN.md) · [组件目录](docs/COMPONENTS.zh-CN.md)

</div>

## Vizual 是什么？

Vizual 是面向 Agent 产品的前端 runtime + 协议层。它给 AI Agent 一套稳定、安全、可验证的方式，在聊天回复里输出真正能渲染的原生 UI：

- 数据分析：图表、KPI、证据表格、结论摘要
- 概念解释：流程图、时间线、互动参数面板
- 经营诊断：网点、门店、产品、项目、风险、运营指标驾驶舱
- 信息收集：用表单收集结构化输入，并提交回宿主 Agent
- 可追问 artifact：后续可以“改成折线图”“只看华东区”“导出 PDF”
- 协议融合：Vizual native、A2UI 消息、AG-UI event stream 都归一到同一个 native core

它不是页面生成器，不是关键词路由器，也不是给 Agent 加门禁。Vizual 只是把“可视化表达和互动 UI”这项能力交给 Agent，具体何时使用、放在回答哪里、如何解释结论，仍然由 Agent 自主决定。

## 为什么需要它？

很多 Agent 回答不应该只有文字。比如用户给了一批经营数据，问“为什么销量在增长但利润在下降？”纯文字分析很难让人快速看懂。更好的回答应该是：

```text
用户：为什么销量在增长但利润在下降？
Agent：我先给结论。
       [Vizual：KPI 卡片 + 利润率趋势 + 渠道结构表 + 风险提示]
       核心原因是低价渠道占比上升，同时广告投入快速增长。
```

这个 Vizual block 是对话的一部分，不是跳到另一个应用；用户也不需要说“请生成一个 BarChart 组件”。用户自然提问，Agent 判断图表和表格能更好地证明结论，就使用 Vizual。

## 它怎么工作？

1. 宿主产品把 Vizual 作为 skill、MCP 或 SDK tool 暴露给 Agent。
2. 用户正常用自然语言提问。
3. Agent 判断是否需要可视化或交互 UI。
4. Agent 返回 Vizual native payload、A2UI message 或 AG-UI event stream。
5. Vizual 把这些输入归一到同一个 native catalog。
6. 宿主前端在聊天中渲染 UI，并接收表单提交、筛选、下钻等 action。

```tsx
import { VizualRenderer } from 'vizual'

const spec = {
  root: 'main',
  elements: {
    main: {
      type: 'BarChart',
      props: {
        type: 'bar',
        title: '各支行利润贡献',
        x: 'branch',
        y: 'profit',
        data: [
          { branch: '城东', profit: 240 },
          { branch: '城西', profit: 180 },
        ],
      },
      children: [],
    },
  },
}

export function AgentVisual() {
  return <VizualRenderer spec={spec} />
}
```

`VizualRenderer` 是推荐的 React 入口。它已经封装 registry、provider、action handler、computed value、state binding 和可见性上下文，宿主不需要手动拼底层 renderer。

## 核心能力

### Native Core

Native Core 是 Agent 和宿主之间的稳定契约：负责校验、归一化、预览和渲染结构化 UI。它会明确拒绝已经移除或不安全的组件，而不是静默渲染一个假的 fallback。

### 多协议归一

Vizual 可以接收多种 Agent 输出形态，并统一到同一套 native model：

- `vizual.native.v1` 风格的 native surface
- A2UI message / component blocks
- AG-UI event stream
- `present_vizual_ui` 这样的 tool call envelope

因此不同 Agent 平台可以使用自己的协议，宿主侧仍然只需要渲染一个统一的 Vizual catalog。

### 尊重 Agent 自主判断

Vizual 不会强迫每个回答都变成 UI。Agent 应该在图像化或交互表达确实更有帮助时使用它；短文本回答、用户明确要求网页/HTML/React/游戏/自定义页面时，不应该强行套进 native core。

### 有意义的交互

当前支持的 host-visible actions：

- `submitForm`
- `applyFilter`
- `drillDown`
- `selectLocation`
- `updatePlan`

这些只是事件，不是业务承诺。Vizual 不会自己保存、审批、派单、写数据库，也不会假装宿主有不存在的系统能力。宿主收到事件后决定下一步怎么处理。

### Artifact 和追问修改

宿主可以保存 `VizualArtifact`，让用户后续继续追问：

```text
用户：把这张图改成折线图，只看华东区，再导出 PDF。
Agent：[更新已有 Vizual artifact]
```

### 导出和主题

Vizual 提供渲染结果和数据导出能力，也支持宿主或 Agent 定义 theme。用户自然提问时通常不需要关心 theme。

## 组件目录

当前 Agent-facing catalog 包含：

- **图表**：Bar、Line、Area、Pie、Scatter、Bubble、Boxplot、Histogram、Waterfall、XMR、Sankey、Funnel、Heatmap、Calendar、Sparkline、Combo、Dumbbell、Radar、Mermaid。
- **数据**：DataTable。
- **业务表达**：KpiDashboard、GanttChart、OrgChart、Timeline。
- **输入**：FormBuilder。
- **内容、媒体和 A2UI primitives**：Markdown、Container、Row、Column、Card、Text、Image、Icon、List、Divider、Button、CheckBox、TextField、ChoicePicker、Slider、DateTimeInput、Tabs、Video、AudioPlayer。

已从 native core 移除：DocView、GridLayout、SplitLayout、FreeformHtml、Modal、Kanban、AuditLog。它们属于产品层、页面层或自由容器，不再作为 Agent-facing native core 组件。

完整目录见 [docs/COMPONENTS.zh-CN.md](docs/COMPONENTS.zh-CN.md)。

## 安装

```bash
npm install vizual
```

Peer dependencies：

```bash
npm install react react-dom
```

## 在宿主前端使用

```tsx
import { VizualRenderer } from 'vizual'

export function ChatMessageVisual({ spec }) {
  return <VizualRenderer spec={spec} />
}
```

如果你的产品有聊天记录、追问修改和导出需求，建议接 Host Runtime：

```tsx
import {
  createHostRuntime,
  createMemoryArtifactStore,
  VizualArtifactView,
} from 'vizual'
import { createRoot } from 'react-dom/client'

const runtime = createHostRuntime({
  store: createMemoryArtifactStore(),
  renderArtifact: (artifact, container) => {
    const root = createRoot(container)
    root.render(<VizualArtifactView artifact={artifact} />)
    return { artifact, root }
  },
})

const artifact = await runtime.renderMessageArtifact({
  conversationId,
  messageId,
  spec,
  container,
})
```

## 给 Agent 接入 Vizual

推荐三种方式：

1. **Skill**：把 `skills/vizual/` 安装到支持 skill 的 Agent runtime。
2. **MCP**：启动 Vizual MCP server，让 Agent 发现 catalog、校验 payload、预览结果。
3. **SDK tool**：在宿主后端暴露 `createVizualAgentToolDefinition()`，让 Agent 调用 `present_vizual_ui`。

```ts
import { createVizualAgentToolDefinition, renderVizualAgentInput } from 'vizual'

const tool = createVizualAgentToolDefinition({ includeCatalogManifest: true })

async function presentVizualUi(args) {
  const result = renderVizualAgentInput(args.input, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })

  if (!result.ok) {
    return {
      ok: false,
      errors: result.preview.issues,
      repair: '请使用受支持的 Vizual native 组件重建 payload。',
    }
  }

  return {
    ok: true,
    envelope: result.envelope,
    renderEvidence: result.preview,
  }
}
```

完整 Agent 契约见 [docs/AI-INTEGRATION.zh-CN.md](docs/AI-INTEGRATION.zh-CN.md)。
把现有 chatbot 一步步改造成支持 Vizual，见
[docs/CHATBOT-INTEGRATION.zh-CN.md](docs/CHATBOT-INTEGRATION.zh-CN.md)。

## Agent 什么时候应该使用 Vizual？

适合使用：

- 趋势、对比、排行、分布、流向、关系需要可视化证明
- 用户给了数据并要求分析原因、找异常、做诊断
- 结构化输入比长文本追问更清晰
- 用户需要调整参数、探索假设、比较方案
- 结果后续可能被继续修改、导出或复用

不适合使用：

- 用户只要短文本回答
- 用户明确要求网页、HTML、React、小游戏、自定义页面
- 交互没有实际意义，只是为了展示按钮或控件
- 宿主没有能力接收 UI 声称能触发的动作

## 验收

```bash
npm test
npm run typecheck
npm run build
```

真实 Agent 接入不能只看 JSON。必须在浏览器里用自然语言任务验证真实渲染：

- 数据分析：图表和表格能看到
- A2UI / AG-UI 能归一
- FormBuilder 能提交回 host action
- 纯文本请求不会强塞 UI
- 显式网页/HTML 请求不会被强行转成 native core
- 已移除组件有稳定 unsupported error

## 文档

- [快速开始](docs/GETTING-STARTED.zh-CN.md)
- [Chatbot 接入](docs/CHATBOT-INTEGRATION.zh-CN.md)
- [Agent 接入](docs/AI-INTEGRATION.zh-CN.md)
- [组件目录](docs/COMPONENTS.zh-CN.md)
- [English README](README.md)

## License

MIT
