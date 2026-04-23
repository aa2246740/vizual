# Getting Started — Vizual

面向开发者的快速上手指南。

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
- `mviz` ^1.6.4 — Chart option builder
- `@json-render/core` ^0.17.0 + `@json-render/react` ^0.17.0 — json-render 平台
- `zod` ^3.25.0 — Schema 校验
- `dompurify` ^3.4.0 — HTML 消毒（DocView 组件）
- `html2canvas` ^1.4.1 — PNG 导出
- `marked` ^15.0.12 — Markdown 渲染（DocView 组件）
- `mermaid` ^11.14.0 — 图表渲染
- `react-highlight-words` ^0.20.0 — 文本高亮（DocView 批注）

你不需要额外安装任何图表或渲染依赖。

## 第二步：注册 Registry

`vizual` 导出了一个预构建的 `registry`，包含 32 个组件的 type → React 组件映射：

```tsx
import { registry } from 'vizual'
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
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

function App({ aiJsonOutput }) {
  return (
    <StateProvider>
      <Renderer spec={aiJsonOutput} registry={registry} />
    </StateProvider>
  )
}
```

## 第四步：AI Agent 集成（推荐）

Vizual 设计为 **AI Agent 专用**，通过 Skill 模式实现智能组件选择。

### Claude Code 用户

```bash
cp -r skills/vizual/ ~/.claude/skills/vizual/
```

安装后，当用户请求图表、仪表盘或数据可视化时，Skill 自动触发并输出符合规范的 JSON spec。

### 其他 AI Agent

对于其他 AI Agent（如 Cursor、Windsurf 等），将 `skills/vizual/prompt.md` 内容作为 System Prompt 传入。

**注意**：Vizual 不支持 ChatGPT / Claude.ai 等聊天机器人场景。我们专注于 AI Agent 的代码生成能力，而非对话式交互。

## 更多功能

### 布局组件

Vizual 提供了三种布局组件用于组合内容：

- `GridLayout` — 网格布局，支持自定义行列和间距
- `SplitLayout` — 分栏布局，支持左右或上下分割
- `HeroLayout` — 英雄区域布局，适合标题 + 内容的组合

### PNG 导出 API

Vizual 导出了 PNG 导出工具函数：

```ts
import { exportToPNG, downloadPNG } from 'vizual'

// 导出为 Blob
const blob = await exportToPNG(element, { scale: 2, backgroundColor: '#0f1117' })

// 直接触发浏览器下载
await downloadPNG(element, { filename: 'my-chart', scale: 2 })
```

### executeAction

Vizual 导出了 `executeAction` 函数，用于通过 action name 执行交互输入组件的行为：

```ts
import { executeAction } from 'vizual'

executeAction('form-submit', { formId: 'myForm' })
```

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
import { registry, renderKitCatalog } from 'vizual'
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
  () => import('./Dashboard'),  // 里头用 Renderer + registry
  { ssr: false }
)
```

### Q: package.json 描述说 "32 interactive visualization components"？
当前实际组件数为 31（19 个图表 + 1 个 DataTable + 6 个业务组件 + 1 个 FormBuilder + 1 个 DocView + 3 个布局组件）。
