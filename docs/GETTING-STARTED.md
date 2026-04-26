# Getting Started — Vizual

面向开发者和 Agent 平台接入方的快速上手指南。

## 前提条件

- Node.js >= 18
- React >= 18 的项目环境（Next.js、Vite、Create React App 等）

## 第一步：安装

```bash
npm install vizual
```

这一个命令会自动安装：
- `vizual` 核心包
- `echarts` ^5.6.0 — 图表引擎
- `@json-render/core` ^0.17.0 + `@json-render/react` ^0.17.0 — json-render 平台
- `zod` ^3.25.0 — Schema 校验
- `dompurify` ^3.4.0 — HTML 消毒（DocView 组件）
- `html2canvas` ^1.4.1 — PNG 导出
- `marked` ^15.0.12 — Markdown 渲染（DocView 组件）
- `mermaid` ^11.14.0 — 图表渲染

你不需要额外安装任何图表或渲染依赖。

## 第二步：渲染 AI 输出

AI（Claude、GPT 等）输出 Vizual JSON，宿主前端用 `VizualRenderer` 渲染。`VizualRenderer` 已经封装好 json-render 所需的 Provider、Vizual registry、内置 action handlers、`$computed` 和 `$bindState` 支持；接入方不要再手动组合 `StateProvider` + `Renderer`。

```tsx
import { VizualRenderer } from 'vizual'
```

AI 输出的 JSON 格式如下：

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "x": "month",
        "y": "sales",
        "data": [
          { "month": "Jan", "sales": 100 },
          { "month": "Feb", "sales": 150 }
        ]
      },
      "children": []
    }
  }
}
```

在 React 页面中渲染：

```tsx
import { VizualRenderer } from 'vizual'

function App({ aiJsonOutput }) {
  return <VizualRenderer spec={aiJsonOutput} />
}
```

如果你需要自定义底层 json-render registry，Vizual 仍然导出 `registry`；普通 Agent 平台接入优先使用 `VizualRenderer`。

## 第三步：AI Agent / 宿主集成（推荐）

Vizual 设计为 **AI Agent 的视觉运行时**。Agent 负责生成 Vizual spec/artifact，宿主前端负责自动渲染、保存 artifact、处理追问 patch、导出和 DocView 批注修订。

### Claude Code 用户

```bash
cp -r skills/vizual/ ~/.claude/skills/vizual/
```

安装后，当用户请求图表、仪表盘、报表、实时调参、导出或可批注文档时，Skill 自动触发并输出符合规范的 JSON spec/artifact，或指挥宿主调用 bridge API。

### 其他 AI Agent

对于其他 AI Agent（如 Cursor、Windsurf 等），将 `skills/vizual/prompt.md` 内容作为 System Prompt 传入。

**注意**：Vizual 可以接入你自己的 SaaS 小聊天窗或完整 ChatGPT-like 对话页；但不能直接在 ChatGPT / Claude.ai 这类封闭消费级聊天界面里渲染，除非平台方集成 Vizual runtime。

### Agent 平台宿主运行时

如果你的产品有聊天记录，建议把 AI 输出保存为 `VizualArtifact`，而不是只保存一次性 JSON。这样用户三天后打开历史对话，仍然可以继续说“这张图改成折线图，只看华东区，再导出 PDF”。

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

## 更多功能

### 布局组件

Vizual 提供了三种布局组件用于组合内容：

- `GridLayout` — 网格布局，支持自定义行列和间距
- `SplitLayout` — 分栏布局，支持左右或上下分割
- `HeroLayout` — 英雄区域布局，适合标题 + 内容的组合

### 导出 API

Vizual 内置 PNG/PDF 视觉导出和 CSV/XLSX 数据导出：

```ts
import { exportElement, exportDataToXLSX, downloadBlob } from 'vizual'

const pdfBlob = await exportElement(element, 'pdf', { filename: 'report' })
const xlsxBlob = await exportDataToXLSX(rows, { filename: 'data', sheetName: '明细' })

await downloadBlob(pdfBlob, 'report.pdf')
await downloadBlob(xlsxBlob, 'data.xlsx')
```

### executeAction

Vizual 导出了 `executeAction` 函数，用于通过 action name 执行交互输入组件的行为：

```ts
import { executeAction } from 'vizual'

executeAction('submitForm', { formId: 'myForm', data: { name: 'Alice' } })
```

liveControl 不是纯 JSON schema；宿主需要把 FormBuilder 的 `value: { "$bindState": "/controls" }` 绑定到 state，再由 `makeSpec(state)` 重新生成预览图表。`validation/vizual-test.html` 的 `renderLiveControlInMsg()` 是推荐参考实现，`renderInteractiveVizInMsg()` 仅作为旧别名保留。

自有 React 宿主可以这样接：

```tsx
import { VizualRenderer, getVizualStateValue } from 'vizual'

const [controls, setControls] = useState({ chartType: 'bar', points: 8, brandColor: '#ff6b35' })

<VizualRenderer
  spec={controlsSpec}
  initialState={{ controls }}
  onStateChange={(changes) => {
    setControls(prev => getVizualStateValue(changes, '/controls', prev))
  }}
/>

<VizualRenderer spec={makeSpec(controls)} />
```

不要把 `/controls` change 直接浅合并到 `controls` 对象本身，否则会得到 `{ controls: {...} }` 这样的嵌套状态，预览不会跟着控件变。

### 主题色函数：tc() 和 tcss()

Vizual 的主题系统提供两个颜色访问函数：

- `tc(varName)` — 返回解析后的具体色值（如 `#e2e8f0`），适用于 ECharts option 和 JS 逻辑
- `tcss(varName)` — 返回 CSS `var()` 引用（如 `var(--rk-text-primary)`），适用于 React inline style，主题切换时自动响应

```tsx
import { tc, tcss } from 'vizual'

// React inline style — 用 tcss()
<div style={{ background: tcss('--rk-bg-primary'), color: tcss('--rk-text-primary') }} />

// ECharts option — 用 tc()
const option = { textStyle: { color: tc('--rk-text-primary') } }
```

## 完整示例：Vite + React 项目

```bash
npm create vite@latest my-dashboard -- --template react-ts
cd my-dashboard
npm install vizual
```

```tsx
// App.tsx
import { useState } from 'react'
import { VizualRenderer } from 'vizual'

const DEMO_SPEC = {
  root: 'main',
  elements: {
    main: {
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        title: '业务概览',
        metrics: [
          { label: 'DAU', value: '12,345', trend: 'up', trendValue: '+5.2%' },
          { label: '收入', value: '¥89.2K', trend: 'up', trendValue: '+12%' },
          { label: '转化率', value: '3.8%', trend: 'down', trendValue: '-0.4%' },
          { label: '客单价', value: '¥128', trend: 'flat', trendValue: '0%' },
        ],
        columns: 4,
      },
      children: [],
    },
  },
}

function App() {
  const [spec] = useState(DEMO_SPEC)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <VizualRenderer spec={spec} />
    </div>
  )
}

export default App
```

## 常见问题

### Q: ECharts 图表不显示？
检查容器是否有明确的宽度。ECharts 需要一个有尺寸的 div 才能初始化。Vizual 的组件默认 `width: 100%`，所以父容器需要有宽度。

### Q: 在弹窗/侧边栏中图表不响应？
Vizual 内置了 ResizeObserver，会自动处理容器尺寸变化。确保弹窗打开时容器已完成渲染。

### Q: 只想用部分组件？
你可以直接 import 单个组件：

```tsx
import { BarChart } from 'vizual'

// 直接作为 React 组件使用
<BarChart
  type="bar"
  x="month"
  y="sales"
  data={[{ month: 'Jan', sales: 100 }]}
/>
```

### Q: 支持 SSR (Next.js) 吗？
ECharts 依赖浏览器 DOM，需要动态导入：

```tsx
import dynamic from 'next/dynamic'

const Dashboard = dynamic(
  () => import('./Dashboard'),  // 里头用 VizualRenderer
  { ssr: false }
)
```

### Q: 普通报告要用 DocView 吗？
不一定。普通数据分析、dashboard、可导出报表，默认用宿主文本 + GridLayout/charts/tables。只有用户明确需要批注、审阅、修订、版本历史，或要把输出变成可共建文档时才用 DocView。
