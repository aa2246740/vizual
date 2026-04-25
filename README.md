<div align="center">

# Vizual

**AI speaks JSON, Vizual makes it visual.**

AI 输出 JSON → 自动渲染为 31 种交互式可视化组件或图文并茂的可批注文档（DocView）。

[![npm version](https://img.shields.io/npm/v/vizual.svg)](https://www.npmjs.com/package/vizual)
[![license](https://img.shields.io/npm/l/vizual.svg)](https://github.com/aa2246740/vizual/blob/main/LICENSE)
[![components](https://img.shields.io/badge/components-31-blue)](docs/COMPONENTS.md)

**English** · [中文文档](#中文文档)

---

</div>

31 visualization components — 19 ECharts charts, 1 data table, 6 business components, 3 layout containers, 1 form builder — plus DocView annotatable document — all with Zod Schema validation, auto-generated AI prompts, and json-render integration.

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
| **Vizual** | `skills/vizual/` | AI 输出 JSON → 自动渲染 31 种可视化组件 |
| **DESIGN.md Parser** | `skills/design-md-parser/` | 从设计文档提取 token → 全局一键换肤 |
| **DESIGN.md Creator** | `skills/design-md-creator/` | 从品牌目标生成 DESIGN.md 主题草案 |

```bash
# 一键安装全部 Skills
cp -r skills/vizual/ ~/.claude/skills/vizual/
cp -r skills/design-md-parser/ ~/.claude/skills/design-md-parser/
cp -r skills/design-md-creator/ ~/.claude/skills/design-md-creator/
```

**Vizual** — 用户说"画个图表"、"做个仪表盘"时自动触发，输出符合 Schema 的 JSON spec。

**DESIGN.md Parser** — 用户粘贴设计文档或说"应用这个主题"时触发。支持 CMYK/Pantone、中英混合、品牌指南。如果内置 dark/light 主题够用，可以跳过。

**DESIGN.md Creator** — 用户需要从品牌目标、语气或参考色生成主题文档时触发。实时 adjust-preview 场景由宿主页面调用 Vizual JS bridge 完成。

## Features

- **31 Components** — Charts (ECharts), data table, business components, layout containers, form builder, DocView annotatable document
- **Zod Schema Validation** — Every prop strictly typed, AI can't get it wrong
- **json-render Native** — `defineCatalog` + `defineRegistry`, plug and play
- **Native ECharts Builders** — Vizual owns every chart option builder; no external chart-builder runtime dependency
- **AI Skill Integration** — 3 progressive disclosure skills for Claude Code and other AI agents
- **Agent Runtime** — `VizualArtifact`, target maps, versions, host runtime store, historical patch/update flow
- **Export Built-ins** — PNG/PDF for rendered visuals; CSV/XLSX for artifact data
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

### Host runtime for Agent platforms

```js
const runtime = Vizual.createHostRuntime({
  store: Vizual.createMemoryArtifactStore(),
  renderArtifact: (artifact, container) => Vizual.renderArtifact(artifact, container),
})

const artifact = await runtime.renderMessageArtifact({ messageId, spec, container })
const updated = await runtime.updateArtifact(artifact.id, [
  { type: 'changeChartType', targetId: 'element:chart', chartType: 'LineChart' },
])
await runtime.exportArtifact({ ref: updated.id, format: 'pdf', element: container })
```

See [GETTING-STARTED](docs/GETTING-STARTED.md) for detailed instructions.

## Build Artifacts

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `dist/vizual.standalone.js` | IIFE | 6.3MB (gzip ~1.5MB) | Standalone — includes React + ReactDOM + ECharts + mermaid |
| `dist/index.mjs` | ESM | 11MB | `import` via npm |
| `dist/index.js` | CJS | 11MB | `require()` via npm |

## 31 Components

### Charts (19) — Native ECharts Builders

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

### Data Components (1)

| Component | type | Description |
|-----------|------|-------------|
| DataTable | `table` | Data table with sorting, pagination |

### Business Components (6)

| Component | type | Description |
|-----------|------|-------------|
| Timeline | `timeline` | Event timeline |
| Kanban | `kanban` | Task board |
| GanttChart | `gantt` | Project schedule |
| OrgChart | `org_chart` | Organization hierarchy |
| KpiDashboard | `kpi_dashboard` | KPI metric cards |
| AuditLog | `audit_log` | Operation log |

### Form Components (1)

| Component | type | Description |
|-----------|------|-------------|
| FormBuilder | `form_builder` | Dynamic form with 18 field types |

FormBuilder supports: `text`, `email`, `password`, `number`, `url`, `tel`, `select`, `file`, `textarea`, `radio`, `checkbox`, `switch`, `slider`, `color`, `date`, `datetime`, `time`, `rating`

### Layout Components (3)

| Component | type | Description |
|-----------|------|-------------|
| GridLayout | `grid_layout` | CSS Grid layout container |
| SplitLayout | `split_layout` | Horizontal/vertical split |
| HeroLayout | `hero_layout` | Hero banner with gradient/solid bg |

### DocView — Annotatable Document (1)

| Component | type | Description |
|-----------|------|-------------|
| DocView | `doc_view` | Interactive document with sections, annotation, and AI revision loop |

Full component reference: [docs/COMPONENTS.md](docs/COMPONENTS.md)

## Testing & Demos

The `validation/` directory contains ready-to-use test and demo pages:

| File | Purpose |
|------|---------|
| `validation/eval-full-31.html` | Full 31-component render evaluation with PASS/FAIL summary |
| `validation/vizual-test.html` | Agent chat bridge — message rendering, live controls, artifact update/debug |
| `validation/demo-docview.html` | DocView annotation demo — text selection, annotation, AI revision flow |
| `validation/demo-artifact-history.html` | vNext artifact demo — historical recovery, target patches, PNG/PDF/CSV/XLSX export metadata |
| `validation/cold-start-eval.html` | Automated vNext runtime smoke test for targetMap, patching, persistence, and data export |

```bash
# Quick test — start a local server and open in browser
python3 -m http.server 8790
# Then open http://localhost:8790/validation/eval-full-31.html
```

These pages double as **integration examples** — each component's JSON spec format is shown inline, making them ideal references for AI agents learning to use the library.

## AI Integration

### Claude Code Skills

Install the 3 skills listed above. Each auto-triggers based on user intent — no manual invocation needed.

### Other AI Agents

For Cursor, Windsurf, and other AI agents, use `skills/vizual/prompt.md` as the System Prompt.

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

All 31 components instantly reflect the new theme — no per-component configuration needed.

**Preset themes**: `default-dark`, `default-light` (default), `claude-dark`, `claude-light`, `linear`, `vercel` — applied via `setGlobalTheme('linear')`.

**Dark/Light mode**: Toggle via `toggleMode()` — automatically finds the matching dark/light variant of the current theme. Any single-theme DESIGN.md auto-generates the opposite mode via `invertTheme()`.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18+ / 19 |
| Schema | Zod v4 | ^3.25.0 |
| Chart Engine | ECharts | 5.6 |
| Platform | json-render | 0.17 |
| Build | esbuild | 0.28+ |

## Documentation

| Document | Description |
|----------|-------------|
| [GETTING-STARTED](docs/GETTING-STARTED.md) | Developer quickstart guide |
| [COMPONENTS](docs/COMPONENTS.md) | All 31 component schemas & examples |
| [AI-INTEGRATION](docs/AI-INTEGRATION.md) | AI integration guide, bidirectional communication |
| [LICENSES](docs/LICENSES.md) | License compliance for all dependencies |
| [Vizual Skill](skills/vizual/SKILL.md) | Main Skill — AI auto-generates charts & dashboards |
| [DESIGN.md Parser Skill](skills/design-md-parser/SKILL.md) | Parse design docs → theme tokens → auto re-skin |
| [DESIGN.md Creator Skill](skills/design-md-creator/SKILL.md) | Generate theme drafts for Vizual's DESIGN.md parser |

## License

[MIT](LICENSE) — Open source, commercially usable.

---

<div id="中文文档"></div>

# 中文文档

**AI 输出 JSON → 自动渲染为 31 种交互式可视化组件。**

Vizual 是一个面向 AI Agent 的可视化组件库。它将 19 种 ECharts 图表、1 种数据表格、6 种业务组件、3 种布局容器、1 种表单构建器统一封装为 Zod Schema + React 组件，通过 json-render 平台实现一键渲染。还支持 DocView 可批注文档组件，实现 AI 输出文档 -> 用户批注 -> AI 修订的闭环。

## 特性

- **31 个组件** — 图表、数据表格、业务组件、布局容器、表单构建器 + DocView 可批注文档全覆盖
- **Zod Schema 校验** — 每个 props 都有严格的类型定义，AI 不会写错
- **json-render 原生集成** — `defineCatalog` + `defineRegistry`，即插即用
- **内置 ECharts 构建器** — Vizual 自己维护每个图表的 option builder，不依赖外部图表构建运行时
- **3 个 AI Skill** — Vizual（自动出图）、DESIGN.md Parser（主题换肤）、DESIGN.md Creator（主题草案）
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

## 31 个组件

### 图表 (19) — ECharts

BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, MermaidDiagram, RadarChart

### 数据组件 (1)

DataTable

### 业务组件 (6)

Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, AuditLog

### 表单组件 (1)

FormBuilder — 支持 18 种字段类型：text, email, password, number, url, tel, select, file, textarea, radio, checkbox, switch, slider, color, date, datetime, time, rating

### 布局组件 (3)

GridLayout, SplitLayout, HeroLayout

### DocView — 可批注文档 (1)

DocView — AI 输出结构化文档（标题、段落、图表、KPI、表格等），用户可批注任意文本或组件，提交批注后 AI 修订文档，自动检测孤儿批注。

完整组件参考：[docs/COMPONENTS.md](docs/COMPONENTS.md)

## 测试与演示

`validation/` 目录包含开箱即用的测试和演示页面：

| 文件 | 用途 |
|------|------|
| `validation/eval-full-31.html` | 自动测试 — 渲染全部 31 个组件并报告 PASS/FAIL |
| `validation/vizual-test.html` | Agent 对话桥接 — 消息渲染、实时控件、artifact 更新/调试 |
| `validation/demo-docview.html` | DocView 批注演示 — 文本选择、批注、AI 修订流程 |
| `validation/demo-artifact-history.html` | vNext artifact 演示 — 历史恢复、target patch、PNG/PDF/CSV/XLSX 导出 metadata |
| `validation/cold-start-eval.html` | vNext runtime 自动冒烟测试 — targetMap、patch、持久化、数据导出 |

```bash
# 快速测试 — 启动本地服务器并在浏览器中打开
python3 -m http.server 8790
# 然后打开 http://localhost:8790/validation/eval-full-31.html
```

这些页面同时也是**集成示例** — 每个组件的 JSON spec 格式都在页面中展示，非常适合作为 AI Agent 学习使用本库的参考。

## AI 接入

安装上面列出的 3 个 Skill 即可，每个 Skill 基于用户意图自动触发，无需手动调用。

### 其他 AI Agent

对于 Cursor、Windsurf 等 AI Agent，使用 `skills/vizual/prompt.md` 作为 System Prompt。

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

31 个组件立即反映新主题，无需逐个配置。

**预设主题**：`default-dark`、`default-light`（默认）、`claude-dark`、`claude-light`、`linear`、`vercel` — 通过 `setGlobalTheme('linear')` 切换。

**Dark/Light 模式**：通过 `toggleMode()` 切换 — 自动查找当前主题的 dark/light 对应变体。单主题 DESIGN.md 会通过 `invertTheme()` 自动生成反色变体。

React 19 · Zod v4 · ECharts 5.6 · json-render 0.17

## 开源许可证

[MIT](LICENSE) — 开源可商用。详见 [LICENSES.md](docs/LICENSES.md)。
