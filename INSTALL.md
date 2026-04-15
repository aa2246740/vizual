# 安装指南 — AI RenderKit

四种方式接入，选择适合你的场景。

---

## 方式零：离线环境（内网/断网）

**适用于**：内网部署、断网环境、无外网访问的服务器。

只需要一个 `.js` 文件，零依赖，浏览器直接打开即可运行。

```html
<script src="./vizual.standalone.js"></script>

<div id="app"></div>
<script>
  Vizual.renderSpec(spec, document.getElementById('app'))
</script>
```

**文件：`dist/vizual.standalone.js`（1.6MB，gzip 492KB）**

这个文件包含了所有运行时依赖：
- React 19 + ReactDOM 19
- ECharts 5.6
- mviz 1.6.4 + json-render 0.17
- Zod v4
- 37 个组件

部署方式：把这一个文件放到你的内网服务器或本地目录即可。

---

## 方式一：NPM（推荐）

适用于 React 项目（Vite、Next.js、Create React App 等）。

```bash
npm install vizual
```

安装后自动获得 echarts、mviz、json-render、zod，你只需要有自己的 React。

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
| `dist/index.mjs` | ESM | 760KB | `import` |
| `dist/index.js` | CJS | 766KB | `require()` |

> ECharts 和 React 为 external，由你的项目提供。

---

## 方式二：CDN Script Tag

适用于纯 HTML 页面、无构建工具的场景。

```html
<!-- 1. 加载 React -->
<script src="https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js"></script>

<!-- 2. 加载 ECharts -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>

<!-- 3. 加载 AI RenderKit -->
<script src="./dist/vizual.cdn.js"></script>
```

然后直接用：

```html
<div id="app"></div>
<script>
  // AI 输出的 JSON
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

  // 一行渲染
  Vizual.renderSpec(spec, document.getElementById('app'))
</script>
```

**CDN 全局变量：`window.Vizual`**

| API | 说明 |
|-----|------|
| `Vizual.renderSpec(spec, container)` | 一行渲染，最常用 |
| `Vizual.registry` | json-render registry（37 组件映射） |
| `Vizual.renderKitCatalog` | Catalog 对象（调用 `.prompt()` 获取 AI 提示词） |
| `Vizual.BarChart` / `.LineChart` / ... | 37 个 React 组件（直接用） |
| `Vizual.BarChartSchema` / ... | 37 个 Zod Schema |

**CDN 产物：**

| 文件 | 大小 | 说明 |
|------|------|------|
| `dist/vizual.cdn.js` | 444KB | IIFE 格式，minified，gzip 后 ~120KB |

> 前置 CDN：React (~10KB gzip) + ReactDOM (~40KB gzip) + ECharts (~300KB gzip)

---

## 方式三：AI Skill / Prompt

不涉及代码安装，让 AI 学会输出正确格式的 JSON。

### Claude Code 用户

```bash
cp -r skill/ ~/.claude/skills/vizual/
```

安装后 AI 自动在需要可视化时触发 Skill。

### ChatGPT / Claude.ai / Gemini 用户

将 `skill/prompt.md` 内容粘贴到 System Prompt 字段。

---

## 产物对比

| | 离线 Standalone | CDN | NPM | AI Prompt |
|---|---|---|---|---|
| **适用场景** | 内网/断网 | 有网络的纯 HTML | React 项目 | AI 对话 |
| **文件大小** | 1.6MB (gzip 492KB) | 444KB + CDN deps | 760KB (ESM) | ~15KB 文本 |
| **需要网络** | 不需要 | 需要 CDN | 需要 npm | 不涉及 |
| **需要 React** | 内含 | CDN 加载 | 项目自带 | 不涉及 |
| **需要 ECharts** | 内含 | CDN 加载 | npm 自动装 | 不涉及 |
| **需要构建工具** | 不需要 | 不需要 | 需要 | 不需要 |
| **零配置可用** | ✅ | ✅ | 需要 React 项目 | ✅ |

---

## 版本要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| React | >=18 | peerDependency，宿主提供 |
| ReactDOM | >=18 | peerDependency，宿主提供 |
| ECharts | >=5.6 | npm 自动安装或 CDN 加载 |
| 浏览器 | Chrome 90+ / Firefox 90+ / Safari 15+ | 需要 ResizeObserver |

---

## 完整 CDN 示例

### 离线版（零依赖，推荐）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI RenderKit Demo</title>
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

### CDN 版（需外网）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI RenderKit Demo</title>
  <script src="https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vizual@0.1.0/dist/vizual.cdn.js"></script>
</head>
<body>
  <div id="app" style="max-width:800px;margin:40px auto"></div>
  <script>
    const spec = {
      root: 'main',
      elements: {
        main: {
          type: 'KpiDashboard',
          props: {
            type: 'kpi_dashboard',
            title: '业务概览',
            columns: 3,
            metrics: [
              { label: 'DAU', value: '12.3K', trend: 'up', trendValue: '+5.2%' },
              { label: '收入', value: '¥89.2K', trend: 'up', trendValue: '+12%' },
              { label: '转化率', value: '3.8%', trend: 'down', trendValue: '-0.4%' }
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

保存为 `.html` 文件，浏览器打开即可看到 KPI 仪表盘。
