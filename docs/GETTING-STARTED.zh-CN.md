# 快速开始 - Vizual

面向开发者和 Agent 平台接入方的快速上手指南。

## 前提条件

- Node.js >= 18
- React >= 18

## 安装

```bash
npm install vizual
npm install react react-dom
```

主要运行时依赖包括 ECharts、json-render、Zod、Markdown 渲染/消毒、Mermaid 和导出工具链。

## 渲染 AI 输出

AI 输出 Vizual JSON，宿主前端用 `VizualRenderer` 渲染。`VizualRenderer` 已经封装 json-render 所需 provider、Vizual registry、内置 action handlers、`$computed` 和 `$bindState` 支持。

```tsx
import { VizualRenderer } from 'vizual'

const spec = {
  root: 'main',
  elements: {
    main: {
      type: 'BarChart',
      props: {
        type: 'bar',
        title: '销售趋势',
        x: 'month',
        y: 'sales',
        data: [
          { month: 'Jan', sales: 100 },
          { month: 'Feb', sales: 150 },
        ],
      },
      children: [],
    },
  },
}

export function App() {
  return <VizualRenderer spec={spec} />
}
```

## Agent 集成

Vizual 设计为 AI Agent 的视觉运行时。Agent 负责判断哪里需要可视化或互动表达；宿主负责渲染、保存 artifact、处理追问 patch、导出和 action 回传。

推荐至少接一种显式能力：

- 安装 `skills/vizual/` 作为 Agent skill。
- 启动 Vizual MCP server，让 Agent 发现 catalog、validate、preview。
- 在宿主后端用 `createVizualAgentToolDefinition()` 暴露 `present_vizual_ui` 工具。

## Host Runtime

如果你的产品有聊天记录，建议保存 `VizualArtifact`，这样用户之后可以继续说“这张图改成折线图，只看华东区，再导出 PDF”。

```tsx
import {
  createHostRuntime,
  createMemoryArtifactStore,
  VizualArtifactView,
  type VizualArtifactPatch,
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
  messageId,
  conversationId,
  spec: aiSpec,
  container,
})

const patch: VizualArtifactPatch[] = [
  { type: 'changeChartType', targetId: 'element:chart', chartType: 'LineChart' },
  { type: 'filterData', targetId: 'element:chart', field: 'region', values: '华东' },
]

const updated = await runtime.updateArtifact(artifact.id, patch)
await runtime.renderArtifact(updated.id, container)
```

## FormBuilder 和 Actions

`FormBuilder` 的边界是收集结构化输入并通过 `submitForm` 交回 host Agent。Vizual 不会自动保存、审批、派单、创建 ticket 或写外部系统。

当前 action：

- `submitForm`
- `applyFilter`
- `drillDown`
- `selectLocation`
- `updatePlan`

## liveControl

liveControl 不是纯 JSON schema；宿主需要把 FormBuilder 的 `value: { "$bindState": "/controls" }` 绑定到 state，再由 `makeSpec(state)` 重新生成预览图表。

不要把 `/controls` change 直接浅合并到 `controls` 对象本身，否则会得到 `{ controls: {...} }` 这样的嵌套状态，预览不会跟着控件变。

## Theme

Vizual 的主题通常由宿主或 Agent 平台预设。用户自然提问时一般不需要关心 theme。

```tsx
import { tc, tcss } from 'vizual'

<div style={{ background: tcss('--rk-bg-primary'), color: tcss('--rk-text-primary') }} />

const option = { textStyle: { color: tc('--rk-text-primary') } }
```

## 测试

```bash
npm test
npm run typecheck
npm run build
```

浏览器验收要看真实渲染结果，不只看 JSON。Agent 验收要用自然语言任务，覆盖数据分析、概念互动、表单回传、A2UI/AG-UI 归一化、纯文本负向、显式网页请求负向。
