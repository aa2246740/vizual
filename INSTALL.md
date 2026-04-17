# 安装指南 — Vizual

三种方式接入，选择适合你的场景。

---

## 方式一：独立文件（零依赖，推荐）

**适用于**：内网部署、断网环境、纯 HTML 页面、无构建工具的场景。

只需要一个 `.js` 文件，零外部依赖，浏览器直接打开即可运行。

```html
<script src="./vizual.standalone.js"></script>

<div id="app"></div>
<script>
  Vizual.renderSpec(spec, document.getElementById('app'))
</script>
```

**文件：`dist/vizual.standalone.js`（6.3MB，gzip ~1.5MB）**

这个文件包含了所有运行时依赖：
- React 18 + ReactDOM 18
- ECharts 5.6
- Mermaid 11
- mviz 1.6.4 + json-render 0.17
- Zod v4
- 43 个组件

部署方式：把这一个文件放到你的内网服务器或本地目录即可。

**完整示例：**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vizual Demo</title>
  <script src="./dist/vizual.standalone.js"></script>
</head>
<body>
  <div id="app" style="max-width:800px;margin:40px auto"></div>
  <script>
    const spec = {
      root: 'main',
      elements: {
        main: {
          type: 'BarChart',
          props: {
            type: 'bar',
            title: '季度销售额',
            x: 'quarter',
            y: 'revenue',
            data: [
              { quarter: 'Q1', revenue: 120 },
              { quarter: 'Q2', revenue: 200 },
              { quarter: 'Q3', revenue: 180 },
              { quarter: 'Q4', revenue: 310 }
            ]
          },
          children: []
        }
      }
    }
    Vizual.renderSpec(spec, document.getElementById('app'))
  </script>
</body>
</html>
```

**Standalone 全局变量：`window.Vizual`**

| API | 说明 |
|-----|------|
| `Vizual.renderSpec(spec, container)` | 一行渲染，最常用 |
| `Vizual.registry` | json-render registry（43 组件映射） |
| `Vizual.BarChart` / `.LineChart` / ... | 43 个 React 组件（直接用） |
| `Vizual.BarChartSchema` / ... | 43 个 Zod Schema |
| `Vizual.React` / `Vizual.ReactDOMClient` | React 导出（用于 DocView 等） |

---

## 方式二：NPM（React 项目）

适用于 React 项目（Vite、Next.js、Create React App 等）。

```bash
npm install vizual
```

安装后需要自行安装 React、ReactDOM、ECharts：

```bash
npm install react react-dom echarts
```

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

**构建产物：**

| 文件 | 格式 | 大小 | 加载方式 |
|------|------|------|---------|
| `dist/index.mjs` | ESM | 11MB | `import` |
| `dist/index.js` | CJS | 11MB | `require()` |

> ECharts、React 和 ReactDOM 为 external（peer dependencies），由你的项目提供。

---

## 方式三：AI Skill

专为 AI Agent 设计，让 AI 学会输出正确格式的 JSON。

### Claude Code 用户

```bash
cp -r skill/ ~/.claude/skills/vizual/
```

安装后 AI 自动在需要可视化时触发 Skill。

### 其他 AI Agent

对于 Cursor、Windsurf 等 AI Agent，将 `skill/prompt.md` 内容作为 System Prompt 传入。

**注意**：Vizual 不支持 ChatGPT / Claude.ai 等聊天机器人场景。我们专注于 AI Agent 的代码生成能力。

---

## 产物对比

| | 独立文件 Standalone | NPM | AI Skill |
|---|---|---|---|
| **适用场景** | 内网/断网/纯 HTML | React 项目 | AI Agent |
| **文件大小** | 6.3MB (gzip ~1.5MB) | 11MB (ESM) | ~15KB 文本 |
| **需要网络** | 不需要 | 需要 npm | 不涉及 |
| **需要 React** | 内含 | 项目自带 | 不涉及 |
| **需要 ECharts** | 内含 | npm 安装 | 不涉及 |
| **需要构建工具** | 不需要 | 需要 | 不需要 |
| **零配置可用** | ✅ | 需要 React 项目 | ✅ |

---

## 版本要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| React | >=18 | peerDependency，NPM 方式需要自行安装 |
| ReactDOM | >=18 | peerDependency，NPM 方式需要自行安装 |
| ECharts | >=5.6 | NPM 方式需要自行安装 |
| 浏览器 | Chrome 90+ / Firefox 90+ / Safari 15+ | 需要 ResizeObserver |
