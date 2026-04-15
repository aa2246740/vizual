<div align="center">

# Vizual

**AI speaks JSON, Vizual makes it visual.**

AI 输出 JSON → 自动渲染为 37 种交互式可视化组件。

[![npm version](https://img.shields.io/npm/v/vizual.svg)](https://www.npmjs.com/package/vizual)
[![license](https://img.shields.io/npm/l/vizual.svg)](https://github.com/aa2246740/vizual/blob/main/LICENSE)
[![components](https://img.shields.io/badge/components-37-blue)](docs/COMPONENTS.md)

**English** · [中文文档](#中文文档)

---

</div>

37 visualization components — 18 ECharts charts, 8 UI components, 11 business components — all with Zod Schema validation, auto-generated AI prompts, and json-render integration.

```tsx
// AI outputs this JSON:
const spec = {
  root: 'main',
  elements: {
    main: {
      type: 'BarChart',
      props: { type: 'bar', x: 'quarter', y: 'revenue',
        data: [{ quarter: 'Q1', revenue: 120 }, { quarter: 'Q2', revenue: 200 }]
      },
      children: []
    }
  }
}

// Your app renders it:
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

<StateProvider>
  <Renderer spec={spec} registry={registry} />
</StateProvider>
```

## Features

- **37 Components** — Charts (ECharts), UI elements, business components
- **Zod Schema Validation** — Every prop strictly typed, AI can't get it wrong
- **json-render Native** — `defineCatalog` + `defineRegistry`, plug and play
- **mviz Bridge** — Reuses mviz `buildXxxOptions()` with auto fallback
- **AI Prompt Generation** — `catalog.prompt()` outputs 22KB system prompt for Claude/GPT
- **Responsive** — Built-in ResizeObserver for popup/sidebar/embedded layouts
- **MIT License** — Open source, commercially usable

## Installation

### NPM (React projects)

```bash
npm install vizual
```

### CDN (plain HTML)

```html
<script src="https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vizual@1/dist/vizual.cdn.js"></script>

<div id="app"></div>
<script>
  Vizual.renderSpec(spec, document.getElementById('app'))
</script>
```

### Offline / Intranet

One file, zero dependencies, works offline:

```html
<script src="./vizual.standalone.js"></script>
<script>
  Vizual.renderSpec(spec, document.getElementById('app'))
</script>
```

See [INSTALL.md](INSTALL.md) for detailed instructions.

## Build Artifacts

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `dist/vizual.standalone.js` | IIFE | 1.6MB (gzip 492KB) | Offline/intranet — includes React + ECharts |
| `dist/vizual.cdn.js` | IIFE | 444KB (gzip 96KB) | CDN — requires external React + ECharts |
| `dist/index.mjs` | ESM | 760KB | `import` via npm |
| `dist/index.js` | CJS | 766KB | `require()` via npm |

## 37 Components

### Charts (18) — ECharts via mviz Bridge

| Component | type | Description |
|-----------|------|-------------|
| BarChart | `bar` | Bar chart (grouped, stacked, horizontal) |
| LineChart | `line` | Line chart (multi-series, smooth) |
| AreaChart | `area` | Area chart (stacked) |
| PieChart | `pie` | Pie / donut chart |
| ScatterChart | `scatter` | Scatter plot |
| BubbleChart | `bubble` | Bubble chart |
| BoxplotChart | `boxplot` | Box plot |
| HistogramChart | `histogram` | Histogram |
| WaterfallChart | `waterfall` | Waterfall chart |
| XmrChart | `xmr` | XMR control chart |
| SankeyChart | `sankey` | Sankey diagram |
| FunnelChart | `funnel` | Funnel chart |
| HeatmapChart | `heatmap` | Heatmap |
| CalendarChart | `calendar` | Calendar heatmap |
| SparklineChart | `sparkline` | Sparkline |
| ComboChart | `combo` | Combo chart (bar + line) |
| DumbbellChart | `dumbbell` | Dumbbell chart |
| MermaidDiagram | `mermaid` | Mermaid diagram |

### UI Components (8)

| Component | type | Description |
|-----------|------|-------------|
| BigValue | `big_value` | Large metric display |
| Delta | `delta` | Change indicator |
| Alert | `alert` | Alert banner |
| Note | `note` | Callout note |
| TextBlock | `text` | Styled text |
| TextArea | `textarea` | Monospace text block |
| DataTable | `table` | Data table |
| EmptySpace | `empty_space` | Spacer |

### Business Components (11)

| Component | type | Description |
|-----------|------|-------------|
| Timeline | `timeline` | Event timeline |
| Kanban | `kanban` | Task board |
| GanttChart | `gantt` | Project schedule |
| OrgChart | `org_chart` | Organization hierarchy |
| KpiDashboard | `kpi_dashboard` | KPI metric cards |
| BudgetReport | `budget_report` | Budget vs actual |
| FeatureTable | `feature_table` | Feature comparison matrix |
| AuditLog | `audit_log` | Operation log |
| JsonViewer | `json_viewer` | JSON viewer |
| CodeBlock | `code_block` | Code display |
| FormView | `form_view` | Key-value form |

Full component reference: [docs/COMPONENTS.md](docs/COMPONENTS.md)

## AI Integration

### Option 1: Claude Code Skill

```bash
cp -r skill/ ~/.claude/skills/vizual/
```

Auto-triggers when user asks for charts, dashboards, or data visualization.

### Option 2: System Prompt (any LLM)

Paste the contents of `skill/prompt.md` into your System Prompt field. Works with ChatGPT, Claude.ai, Gemini, and any LLM.

### Option 3: API

```ts
import { renderKitCatalog } from 'vizual'

const systemPrompt = renderKitCatalog.prompt() // ~22KB
// Pass to any AI API
```

See [docs/AI-INTEGRATION.md](docs/AI-INTEGRATION.md) for details.

## Development

```bash
npm install      # Install all dependencies
npm test         # Run tests (vitest)
npm run build    # Build all formats (ESM + CJS + CDN + Standalone)
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18+ / 19 |
| Schema | Zod v4 | ^3.25.0 |
| Chart Engine | ECharts | 5.6 |
| Chart Bridge | mviz | 1.6.4 |
| Platform | json-render | 0.17 |
| Build | esbuild | 0.28+ |

## Documentation

| Document | Description |
|----------|-------------|
| [INSTALL.md](INSTALL.md) | Installation guide (NPM / CDN / Offline) |
| [GETTING-STARTED.md](docs/GETTING-STARTED.md) | Developer quickstart |
| [COMPONENTS.md](docs/COMPONENTS.md) | All 37 component schemas & examples |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture, data flow, dependency graph |
| [AI-INTEGRATION.md](docs/AI-INTEGRATION.md) | AI integration guide (Claude / GPT) |
| [LICENSES.md](docs/LICENSES.md) | License compliance for all dependencies |

## License

[MIT](LICENSE) — Open source, commercially usable.

---

<div id="中文文档"></div>

# 中文文档

**AI 输出 JSON → 自动渲染为 37 种交互式可视化组件。**

Vizual 是一个面向 AI Agent 的可视化组件库。它将 18 种 ECharts 图表、8 种 UI 组件、11 种业务组件统一封装为 Zod Schema + React 组件，通过 json-render 平台实现一键渲染。

## 特性

- **37 个组件** — 图表、UI、业务组件全覆盖
- **Zod Schema 校验** — 每个 props 都有严格的类型定义，AI 不会写错
- **json-render 原生集成** — `defineCatalog` + `defineRegistry`，即插即用
- **mviz Bridge** — 复用 mviz 的 `buildXxxOptions()` 生成 ECharts 配置，含自动 fallback
- **AI Prompt 自动生成** — `catalog.prompt()` 输出 22KB 系统提示词
- **响应式** — 内置 ResizeObserver，弹窗/侧边栏/嵌入式场景自动适配
- **MIT 开源可商用** — 所有依赖均为宽松许可证

## 安装

**NPM（React 项目）：**

```bash
npm install vizual
```

**CDN（纯 HTML 页面）：**

```html
<script src="https://cdn.jsdelivr.net/npm/vizual@1/dist/vizual.cdn.js"></script>
```

**离线/内网：**

```html
<script src="./vizual.standalone.js"></script>
```

详细安装说明见 [INSTALL.md](INSTALL.md)。

## 快速使用

```tsx
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

// AI 返回的 JSON
const spec = {
  root: 'main',
  elements: {
    main: {
      type: 'BarChart',
      props: {
        type: 'bar',
        x: 'quarter', y: 'revenue',
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

<StateProvider>
  <Renderer spec={spec} registry={registry} />
</StateProvider>
```

## 37 个组件

### 图表 (18) — ECharts

BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, MermaidDiagram

### UI 组件 (8)

BigValue, Delta, Alert, Note, TextBlock, TextArea, DataTable, EmptySpace

### 业务组件 (11)

Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, BudgetReport, FeatureTable, AuditLog, JsonViewer, CodeBlock, FormView

完整组件参考：[docs/COMPONENTS.md](docs/COMPONENTS.md)

## AI 接入

| 方式 | 适用 | 安装 |
|------|------|------|
| Claude Code Skill | AI Agent | `cp -r skill/ ~/.claude/skills/vizual/` |
| System Prompt | ChatGPT / Claude.ai / Gemini | 粘贴 `skill/prompt.md` |
| API Prompt | 代码集成 | `renderKitCatalog.prompt()` |

详见 [docs/AI-INTEGRATION.md](docs/AI-INTEGRATION.md)。

## 构建

```bash
npm install    # 安装依赖
npm test       # 运行测试
npm run build  # 构建全部格式
```

构建产物：ESM 760KB + CJS 766KB + CDN 444KB + Standalone 1.6MB

## 技术栈

React 19 · Zod v4 · ECharts 5.6 · mviz 1.6.4 · json-render 0.17

## 开源许可证

[MIT](LICENSE) — 开源可商用。详见 [LICENSES.md](docs/LICENSES.md)。
