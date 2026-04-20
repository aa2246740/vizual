<div align="center">

# Vizual

**AI speaks JSON, Vizual makes it visual.**

AI 输出 JSON → 自动渲染为 42 种交互式可视化组件或图文并茂的可批注文档（DocView）。

[![npm version](https://img.shields.io/npm/v/vizual.svg)](https://www.npmjs.com/package/vizual)
[![license](https://img.shields.io/npm/l/vizual.svg)](https://github.com/aa2246740/vizual/blob/main/LICENSE)
[![components](https://img.shields.io/badge/components-43-blue)](docs/COMPONENTS.md)

**English** · [中文文档](#中文文档)

---

</div>

42 visualization components — 19 ECharts charts, 8 UI components, 11 business components — plus DocView annotatable document — all with Zod Schema validation, auto-generated AI prompts, and json-render integration.

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

```tsx
// AI outputs a DocView spec — renders as an annotatable document:
const docSpec = {
  root: 'main',
  elements: {
    main: {
      type: 'DocView',
      props: {
        type: 'doc_view',
        title: 'Q1 Report',
        sections: [
          { type: 'heading', content: 'Q1 Performance' },
          { type: 'text', content: 'Revenue grew 15% YoY...' },
          { type: 'kpi', content: '', data: { metrics: [{label:'Revenue',value:'$12.3M',trend:'up',trendValue:'+15%'}] } },
          { type: 'callout', content: 'Note: Figures are preliminary.' }
        ],
        showPanel: true,
      },
      children: []
    }
  }
}
```

## AI Skills

3 个 Claude Code Skill，安装后 AI 自动触发：

| Skill | 路径 | 一句话说明 |
|-------|------|-----------|
| **Vizual** | `skill/` | AI 输出 JSON → 自动渲染 43 种可视化组件 |
| **DESIGN.md Parser** | `skills/design-md-parser/` | 从设计文档提取 token → 全局一键换肤 |
| **LiveKit** | `skills/livekit/` | 任何"调一下看看"场景 → 实时交互页面 |

```bash
# 一键安装全部 Skills
cp -r skill/ ~/.claude/skills/vizual/
cp -r skills/design-md-parser/ ~/.claude/skills/design-md-parser/
cp -r skills/livekit/ ~/.claude/skills/livekit/
```

**Vizual** — 用户说"画个图表"、"做个仪表盘"时自动触发，输出符合 Schema 的 JSON spec。

**DESIGN.md Parser** — 用户粘贴设计文档或说"应用这个主题"时触发。支持 CMYK/Pantone、中英混合、品牌指南。如果内置 dark/light 主题够用，可以跳过。

**LiveKit** — 任何需要"亲手调一下才能理解"的场景都该用它：调色、调参、对比方案、探索数据分布、验证算法效果。不是只能做调色板——凡是 adjust → preview 的场景都适用。

## Features

- **43 Components** — Charts (ECharts), UI elements, business components, DocView annotatable document
- **Zod Schema Validation** — Every prop strictly typed, AI can't get it wrong
- **json-render Native** — `defineCatalog` + `defineRegistry`, plug and play
- **mviz Bridge** — Reuses mviz `buildXxxOptions()` with auto fallback
- **AI Skill Integration** — 3 progressive disclosure skills for Claude Code and other AI agents
- **Theme System** — OKLCH palette generation, background-aware contrast, DESIGN.md auto-parsing
- **Responsive** — Built-in ResizeObserver for popup/sidebar/embedded layouts
- **MIT License** — Open source, commercially usable

## Installation

### NPM (React projects)

```bash
npm install vizual
```

### Standalone (plain HTML)

One file, zero external dependencies, works offline:

```html
<!-- vizual.standalone.js includes React, ReactDOM, ECharts, and mermaid -->
<script src="./vizual.standalone.js"></script>
<script>
  Vizual.renderSpec(spec, document.getElementById('app'))
</script>
```

See [GETTING-STARTED](docs/GETTING-STARTED.md) for detailed instructions.

## Build Artifacts

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `dist/vizual.standalone.js` | IIFE | 6.3MB (gzip ~1.5MB) | Standalone — includes React + ReactDOM + ECharts + mermaid |
| `dist/index.mjs` | ESM | 11MB | `import` via npm |
| `dist/index.js` | CJS | 11MB | `require()` via npm |

## 43 Components

### Charts (19) — ECharts via mviz Bridge

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
| RadarChart | `radar` | Radar chart (multi-dimensional comparison) |

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

### Interactive Components (4)

| Component | type | Description |
|-----------|------|-------------|
| InputText | `input_text` | Text input with validation |
| InputSelect | `input_select` | Dropdown select |
| InputFile | `input_file` | File upload with drag-and-drop |
| FormBuilder | `form_builder` | Dynamic form with 18 field types |

FormBuilder supports these field types: `text`, `email`, `password`, `number`, `url`, `tel`, `select`, `file`, `textarea`, `radio`, `checkbox`, `switch`, `slider`, `color`, `date`, `datetime`, `time`, `rating`

### DocView — Annotatable Document (1)

| Component | type | Description |
|-----------|------|-------------|
| DocView | `doc_view` | Interactive document with sections, annotation, and AI revision loop |

Full component reference: [docs/COMPONENTS.md](docs/COMPONENTS.md)

## Testing & Demos

The `validation/` directory contains ready-to-use test and demo pages:

| File | Purpose |
|------|---------|
| `validation/test-all-42.html` | Full 42-component test + interactive theme adaptation test |
| `validation/demo-docview.html` | DocView annotation demo — text selection, annotation, AI revision flow |
| `validation/demo-design-md.html` | DESIGN.md theme demo — switch themes + dark/light mode |
| `validation/demo-theme-compare.html` | Side-by-side theme comparison |

```bash
# Quick test — start a local server and open in browser
python3 -m http.server 8790
# Then open http://localhost:8790/validation/test-all-42.html
```

These pages double as **integration examples** — each component's JSON spec format is shown inline, making them ideal references for AI agents learning to use the library.

## AI Integration

### Claude Code Skills

Install the 3 skills listed above. Each auto-triggers based on user intent — no manual invocation needed.

### Other AI Agents

For Cursor, Windsurf, and other AI agents, use `skill/prompt.md` as the System Prompt.

**Note**: Vizual is designed for AI agents, not chatbots. We don't support ChatGPT / Claude.ai conversational interfaces.

See [AI-INTEGRATION](docs/AI-INTEGRATION.md) for details.

## Development

```bash
npm install      # Install all dependencies
npm test         # Run tests (vitest)
npm run build    # Build all formats (ESM + CJS + Standalone)
```

See [CONTRIBUTING](docs/CONTRIBUTING.md) for component development guidelines.

## Theme System & DESIGN.md

Every component in Vizual reads colors from the theme system. Users can customize the entire look by providing a DESIGN.md:

```tsx
import { loadDesignMd } from 'vizual'

// Parse a DESIGN.md file and apply it globally
loadDesignMd(`
Primary: #0052ef
Canvas: #0b0b0b
Surface: #141414
Text: #e8e8e8
Border: #2a2a2a
`, { apply: true })
```

All 43 components instantly reflect the new theme — no per-component configuration needed.

**Preset themes**: `default-dark`, `default-light` (default), `linear`, `vercel` — applied via `setGlobalTheme('linear')`.

**Dark/Light mode**: Toggle via `toggleMode()` — automatically finds the matching dark/light variant of the current theme. Any single-theme DESIGN.md auto-generates the opposite mode via `invertTheme()`.

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
| [GETTING-STARTED](docs/GETTING-STARTED.md) | Developer quickstart guide |
| [COMPONENTS](docs/COMPONENTS.md) | All 43 component schemas & examples |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Architecture, data flow, theme system |
| [AI-INTEGRATION](docs/AI-INTEGRATION.md) | AI integration guide (Claude / Cursor / GPT) |
| [CONTRIBUTING](docs/CONTRIBUTING.md) | Component development guide & conventions |
| [LICENSES](docs/LICENSES.md) | License compliance for all dependencies |
| [Vizual Skill](skill/SKILL.md) | Main Skill — AI auto-generates charts & dashboards |
| [DESIGN.md Parser Skill](skills/design-md-parser/SKILL.md) | Parse design docs → theme tokens → auto re-skin |
| [LiveKit Skill](skills/livekit/SKILL.md) | Real-time adjust & preview for any scenario |

## License

[MIT](LICENSE) — Open source, commercially usable.

---

<div id="中文文档"></div>

# 中文文档

**AI 输出 JSON → 自动渲染为 42 种交互式可视化组件。**

Vizual 是一个面向 AI Agent 的可视化组件库。它将 19 种 ECharts 图表、8 种 UI 组件、11 种业务组件统一封装为 Zod Schema + React 组件，通过 json-render 平台实现一键渲染。还支持 DocView 可批注文档组件，实现 AI 输出文档 -> 用户批注 -> AI 修订的闭环。

## 特性

- **43 个组件** — 图表、UI、业务组件 + DocView 可批注文档全覆盖
- **Zod Schema 校验** — 每个 props 都有严格的类型定义，AI 不会写错
- **json-render 原生集成** — `defineCatalog` + `defineRegistry`，即插即用
- **mviz Bridge** — 复用 mviz 的 `buildXxxOptions()` 生成 ECharts 配置，含自动 fallback
- **3 个 AI Skill** — Vizual（自动出图）、DESIGN.md Parser（主题换肤）、LiveKit（实时预览）
- **主题系统** — OKLCH 调色板、背景感知对比度、DESIGN.md 自动解析
- **MIT 开源可商用** — 所有依赖均为宽松许可证

## 安装

**NPM（React 项目）：**

```bash
npm install vizual
```

**独立文件（纯 HTML 页面 / 离线使用）：**

```html
<!-- vizual.standalone.js 包含 React、ReactDOM、ECharts、mermaid -->
<script src="./vizual.standalone.js"></script>
```

详细安装说明见 [GETTING-STARTED](docs/GETTING-STARTED.md)。

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

## 43 个组件

### 图表 (19) — ECharts

BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, MermaidDiagram, RadarChart

### UI 组件 (8)

BigValue, Delta, Alert, Note, TextBlock, TextArea, DataTable, EmptySpace

### 业务组件 (11)

Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, BudgetReport, FeatureTable, AuditLog, JsonViewer, CodeBlock, FormView

### 交互组件 (4)

InputText, InputSelect, InputFile, FormBuilder

FormBuilder 支持 18 种字段类型：text, email, password, number, url, tel, select, file, textarea, radio, checkbox, switch, slider, color, date, datetime, time, rating

### DocView — 可批注文档 (1)

DocView — AI 输出结构化文档（标题、段落、图表、KPI、表格等），用户可批注任意文本或组件，提交批注后 AI 修订文档，自动检测孤儿批注。

完整组件参考：[docs/COMPONENTS.md](docs/COMPONENTS.md)

## 测试与演示

`validation/` 目录包含开箱即用的测试和演示页面：

| 文件 | 用途 |
|------|------|
| `validation/test-all-42.html` | 自动测试 — 渲染全部 42 个组件，报告 PASS/FAIL + 主题适配测试 |
| `validation/demo-docview.html` | DocView 批注演示 — 文本选择、批注、AI 修订流程 |
| `validation/demo-design-md.html` | DESIGN.md 主题演示 — 切换风格 + Dark/Light 模式 |
| `validation/demo-theme-compare.html` | 主题并排对比 |

```bash
# 快速测试 — 启动本地服务器并在浏览器中打开
python3 -m http.server 8790
# 然后打开 http://localhost:8790/validation/test-all-42.html
```

这些页面同时也是**集成示例** — 每个组件的 JSON spec 格式都在页面中展示，非常适合作为 AI Agent 学习使用本库的参考。

## AI 接入

安装上面列出的 3 个 Skill 即可，每个 Skill 基于用户意图自动触发，无需手动调用。

### 其他 AI Agent

对于 Cursor、Windsurf 等 AI Agent，使用 `skill/prompt.md` 作为 System Prompt。

**注意**：Vizual 专为 AI Agent 设计，不支持聊天机器人场景。

详见 [AI-INTEGRATION](docs/AI-INTEGRATION.md)。

## 构建

```bash
npm install    # 安装依赖
npm test       # 运行测试
npm run build  # 构建全部格式
```

构建产物：ESM 11MB + CJS 11MB + Standalone 6.3MB (包含所有依赖)

贡献者请阅读 [CONTRIBUTING](docs/CONTRIBUTING.md) 了解组件开发规范。

## 主题系统 & DESIGN.md

所有组件的颜色从主题系统读取。用户提供一份 DESIGN.md 即可自定义全局外观：

```tsx
import { loadDesignMd } from 'vizual'

loadDesignMd(`
Primary: #0052ef
Canvas: #0b0b0b
Text: #e8e8e8
Border: #2a2a2a
`, { apply: true })
```

43 个组件立即反映新主题，无需逐个配置。

**预设主题**：`default-dark`、`default-light`（默认）、`linear`、`vercel` — 通过 `setGlobalTheme('linear')` 切换。

**Dark/Light 模式**：通过 `toggleMode()` 切换 — 自动查找当前主题的 dark/light 对应变体。单主题 DESIGN.md 会通过 `invertTheme()` 自动生成反色变体。

React 19 · Zod v4 · ECharts 5.6 · mviz 1.6.4 · json-render 0.17

## 开源许可证

[MIT](LICENSE) — 开源可商用。详见 [LICENSES.md](docs/LICENSES.md)。
