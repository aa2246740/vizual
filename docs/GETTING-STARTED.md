# Getting Started — AI RenderKit

面向开发者的快速上手指南。

## 前提条件

- Node.js >= 18
- React >= 18 的项目环境（Next.js、Vite、Create React App 等）

## 第一步：安装

```bash
npm install ai-render-kit
```

这一个命令会自动安装：
- `ai-render-kit` 核心包
- `echarts` ^5.6.0 — 图表引擎
- `mviz` ^1.6.4 — Chart option builder
- `@json-render/core` ^0.17.0 + `@json-render/react` ^0.17.0 — json-render 平台
- `zod` ^3.25.0 — Schema 校验

你不需要额外安装任何图表或渲染依赖。

## 第二步：注册 Registry

`ai-render-kit` 导出了一个预构建的 `registry`，包含 37 个组件的 type → React 组件映射：

```tsx
import { registry } from 'ai-render-kit'
```

## 第三步：渲染 AI 输出

AI（Claude、GPT 等）输出的 JSON 格式如下：

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

用 json-render 的 `Renderer` 渲染：

```tsx
import { registry } from 'ai-render-kit'
import { Renderer, StateProvider } from '@json-render/react'

function App({ aiJsonOutput }) {
  return (
    <StateProvider>
      <Renderer spec={aiJsonOutput} registry={registry} />
    </StateProvider>
  )
}
```

## 第四步：集成 AI Prompt

要让 AI 知道它能输出哪些组件，用 `catalog.prompt()` 生成系统提示词：

```ts
import { renderKitCatalog } from 'ai-render-kit'

const systemPrompt = renderKitCatalog.prompt()

// 传给 AI API
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '用柱状图展示季度销售额' },
  ],
})

// response 包含 JSON spec → 直接传给 Renderer
```

或者用 Claude：

```ts
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6-20250514',
  max_tokens: 4096,
  system: systemPrompt,
  messages: [
    { role: 'user', content: '帮我展示 KPI 指标' },
  ],
})
```

## 完整示例：Vite + React 项目

```bash
npm create vite@latest my-dashboard -- --template react-ts
cd my-dashboard
npm install ai-render-kit
```

```tsx
// App.tsx
import { useState } from 'react'
import { registry, renderKitCatalog } from 'ai-render-kit'
import { Renderer, StateProvider } from '@json-render/react'

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
    <StateProvider>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <Renderer spec={spec} registry={registry} />
      </div>
    </StateProvider>
  )
}

export default App
```

## 常见问题

### Q: ECharts 图表不显示？
检查容器是否有明确的宽度。ECharts 需要一个有尺寸的 div 才能初始化。AI RenderKit 的组件默认 `width: 100%`，所以父容器需要有宽度。

### Q: 在弹窗/侧边栏中图表不响应？
AI RenderKit 内置了 ResizeObserver，会自动处理容器尺寸变化。确保弹窗打开时容器已完成渲染。

### Q: 只想用部分组件？
你可以直接 import 单个组件：

```tsx
import { BarChart } from 'ai-render-kit'

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
  () => import('./Dashboard'),  // 里头用 Renderer + registry
  { ssr: false }
)
```
