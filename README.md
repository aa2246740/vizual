<div align="center">

# Vizual

**AI Agent visual runtime: JSON in, interactive UI out.**

AI 输出 Vizual JSON / Artifact → 自动渲染为图表、仪表盘、liveControl 组件、可导出报表和可批注文档（DocView）。

[![npm version](https://img.shields.io/npm/v/vizual.svg)](https://www.npmjs.com/package/vizual)
[![license](https://img.shields.io/npm/l/vizual.svg)](https://github.com/aa2246740/vizual/blob/main/LICENSE)
[![components](https://img.shields.io/badge/components-31-blue)](docs/COMPONENTS.md)

**English** · [中文文档](#中文文档)

---

</div>

Vizual is a runtime kit for AI Agent products. It gives an agent a stable visual output contract: render one-off specs, persist editable artifacts in chat history, patch old charts from follow-up requests, expose live FormBuilder controls, export visuals/data, and run DocView annotation → revision loops.

The library currently ships 31 registered components: 19 native ECharts charts, 1 data table, 6 business components, 3 layout containers, 1 form builder, and DocView.

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
import { VizualRenderer } from 'vizual'

<VizualRenderer spec={spec} />
```

`VizualRenderer` is the recommended React entry point. It wraps json-render's required providers and Vizual's registry/actions, so host apps do not need to import `@json-render/react` directly for normal rendering.

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

Vizual Core 主流程只需要 Vizual Skill。Design.md creator/parser 是可选 Agent 能力：用户需要把非标准设计描述整理成标准 Design.md 时可以调用，但 runtime 本身只负责加载标准 Design.md。

| Skill | 路径 | 一句话说明 |
|-------|------|-----------|
| **Vizual** | `skills/vizual/` | AI 输出 Vizual spec/artifact → 自动渲染、追问修改、导出和 DocView 修订 |
| **DESIGN.md Parser** | `skills/design-md-parser/` | 可选：把非标准设计文档整理成标准 Design.md |
| **DESIGN.md Creator** | `skills/design-md-creator/` | 可选：从品牌目标生成 Design.md 草案 |

```bash
# Core 接入只需要安装 Vizual Skill
cp -r skills/vizual/ ~/.claude/skills/vizual/

# 可选：需要 Agent 帮用户整理/创建 Design.md 时再安装
cp -r skills/design-md-parser/ ~/.claude/skills/design-md-parser/
cp -r skills/design-md-creator/ ~/.claude/skills/design-md-creator/
```

**Vizual** — 用户说"画个图表"、"做个仪表盘"、"把这张图改成折线图"、"做可批注报告"时自动触发，输出符合 Schema 的 spec/artifact 或调用宿主 bridge。

**DESIGN.md Parser** — 用户粘贴的设计描述不标准、需要 Agent 先整理成标准 Design.md 时触发。Vizual runtime 不依赖它；runtime 只消费标准 Design.md 字符串。

**DESIGN.md Creator** — 用户需要从品牌目标、语气或参考色生成主题文档时触发。实时 adjust-preview 场景由宿主页面调用 Vizual JS bridge 完成。

## Capabilities

- **31 Components** — Charts (ECharts), data table, business components, layout containers, form builder, DocView annotatable document
- **Zod Schema Validation** — Every prop strictly typed, AI can't get it wrong
- **json-render Native** — `defineCatalog` + `defineRegistry`, plug and play
- **Native ECharts Builders** — Vizual owns every chart option builder; no external chart-builder runtime dependency
- **AI Skill Integration** — 3 progressive disclosure skills for Claude Code and other AI agents
- **Agent Runtime** — `VizualArtifact`, target maps, versions, host runtime store, historical patch/update flow
- **liveControl** — formal control schema, `FormBuilder` + `$bindState`, scoped state patching for real-time adjustable previews
- **Review / Revision** — generic artifact-level target refs, review threads, Agent revision proposals, accept/reject/apply loop
- **DocView Review SDK** — DocView-specific projection of the same annotation → revision workflow
- **Export Built-ins** — PNG/PDF for rendered visuals; CSV/XLSX for artifact data
- **Theme System** — OKLCH palette generation, background-aware contrast, DESIGN.md auto-parsing
- **Design.md Mapping Report** — `loadDesignMd()` returns mapped/fallback/unsupported tokens and a quality score
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
| `dist/vizual.standalone.js` | IIFE | ~12.6MB | Standalone — includes React + ReactDOM + ECharts + mermaid |
| `dist/index.mjs` | ESM | ~8.9MB | `import` via npm |
| `dist/index.js` | CJS | ~9.0MB | `require()` via npm |

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
| DataTable | `table` | Data table with columns, alignment, striped rows, compact mode |

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

The `validation/` directory intentionally keeps two browser entry points:

| File | Purpose |
|------|---------|
| `validation/design-md-load.html` | Theme + full component matrix — dynamic DESIGN.md switching, all Vizual components, visual theme regression, liveControl theme tuning |
| `validation/vizual-test.html` | Main Agent chat bridge — message rendering, liveControl, artifact updates, DocView review loop, export/debug |

```bash
python3 -m http.server 8793
```

Open these pages:

- Theme and component regression: `http://localhost:8793/validation/design-md-load.html`
- Cold-start Agent acceptance: `http://localhost:8793/validation/vizual-test.html`

### Cold-Start QA

Cold-start QA checks whether an Agent that only reads the installed Vizual skill can use the runtime correctly in a visible host page.

| File | Give to | Purpose |
|------|---------|---------|
| `COLD_START_BLIND_TEST.md` | The tested Agent | Blind task instructions. It tells the Agent what to do, but does not contain scoring answers. |
| `COLD_START_ACCEPTANCE_GUIDE.md` | Human tester / maintainer | Full acceptance criteria, expected behavior, failure rules, and QA report format. Do not give this to the tested Agent. |

Expected flow:

1. Install `skills/vizual/` into the tested Agent environment.
2. Start the local server on port `8793`.
3. Open `validation/vizual-test.html` in a visible Chrome controlled by Chrome DevTools MCP or equivalent browser automation.
4. Start a fresh Agent session and give it only `COLD_START_BLIND_TEST.md`.
5. The Agent must enter the test prompts into the visible page, read `window.getPendingMessage()`, call Vizual bridge APIs, and produce a Markdown QA report.

The tested Agent must not read source code, validation HTML source, old QA reports, git history, or `COLD_START_ACCEPTANCE_GUIDE.md`.

These pages double as **integration examples** — each component's JSON spec format is shown inline, making them ideal references for AI agents learning to use the library.

## AI Integration

### Claude Code Skills

Install `skills/vizual/` for the core runtime workflow. The Design.md parser/creator skills are optional helper skills for Agents that need to turn loose design requirements into a standard Design.md before calling `loadDesignMd()`.

### Other AI Agents

For Cursor, Windsurf, and other AI agents, use `skills/vizual/prompt.md` as the System Prompt.

**Note**: Vizual is for AI Agent products and custom host apps. It can power a SaaS chatbot or full ChatGPT-like page if your frontend embeds the runtime. It cannot render inside closed consumer chat surfaces such as ChatGPT / Claude.ai unless that platform explicitly integrates Vizual.

See [AI-INTEGRATION](docs/AI-INTEGRATION.md) for details.

## Development

```bash
npm install      # Install all dependencies
npm test         # Run tests (vitest)
npm run build    # Build all formats (ESM + CJS + Standalone)
```

For component development conventions, see [CLAUDE.md](CLAUDE.md).

## Theme System & DESIGN.md

Every component in Vizual reads colors from the theme system. Users can customize the entire look by providing a DESIGN.md:

```tsx
import { loadDesignMd } from 'vizual'

// Parse a standard DESIGN.md string and apply it globally
const theme = loadDesignMd(`
Primary: #0052ef
Canvas: #0b0b0b
Surface: #141414
Text: #e8e8e8
Border: #2a2a2a
`, { apply: true })

console.log(theme._mappingReport)
```

All 31 components instantly reflect the new theme — no per-component configuration needed.

`loadDesignMd()` returns a mapping report with `tokenCount`, `mappedCount`, `fallbackCount`, `unsupportedTokens`, `warnings`, `mappedVariables`, `fallbackVariables`, and `qualityScore`. Use `validation/design-md-load.html` to visually verify a Design.md across all components and liveControl.

**Preset themes**: `claude-dark` (default), `claude-light`, `default-dark`, `default-light`, `linear`, `vercel` — applied via `setGlobalTheme('linear')`.

**Dark/Light mode**: Toggle via `toggleMode()` — automatically finds the matching dark/light variant of the current theme. Any single-theme DESIGN.md auto-generates the opposite mode via `invertTheme()`.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18+ / 19 |
| Schema | Zod | ^3.25.0 |
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

**AI Agent 输出 Vizual JSON / Artifact → 自动渲染为可交互、可追问、可导出、可批注的视觉结果。**

Vizual 是面向 AI Agent 产品的视觉运行时。Agent 按 Vizual contract 输出 spec/artifact，宿主前端自动渲染图表、仪表盘、报表、liveControl 面板和 DocView 可批注文档；用户后续说“改成折线图”“只看华东区”“导出 PDF”“这段写详细一点”时，宿主可以基于 artifact 和 review state 继续修改，而不是从纯文本重新生成。

## 特性

- **31 个组件** — 图表、数据表格、业务组件、布局容器、表单构建器 + DocView 可批注文档全覆盖
- **Zod Schema 校验** — 每个 props 都有严格的类型定义，AI 不会写错
- **json-render 原生集成** — `defineCatalog` + `defineRegistry`，即插即用
- **内置 ECharts 构建器** — Vizual 自己维护每个图表的 option builder，不依赖外部图表构建运行时
- **3 个 AI Skill** — Vizual（自动出图）、DESIGN.md Parser（主题换肤）、DESIGN.md Creator（主题草案）
- **Agent Runtime** — artifact 历史、targetMap、版本、追问 patch、PNG/PDF/CSV/XLSX 导出
- **liveControl** — FormBuilder 绑定 state，宿主 bridge 调用 `makeSpec(state)` 实时更新图表
- **DocView 批注循环** — 用户批注、提交 thread，Agent 生成 revision proposal，用户/宿主应用修订
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
import { VizualRenderer } from 'vizual'

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

<VizualRenderer spec={spec} />
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

DocView — AI 输出结构化文档（标题、段落、图表、KPI、表格等），用户可批注任意文本或组件，提交批注后 AI 修订文档，并在修订后维护批注状态。

完整组件参考：[docs/COMPONENTS.md](docs/COMPONENTS.md)

## 测试与演示

`validation/` 目录刻意只保留两个浏览器入口：

| 文件 | 用途 |
|------|------|
| `validation/design-md-load.html` | 主题 + 全组件矩阵 — 动态 DESIGN.md 切换、全部 Vizual 组件、主题视觉回归、liveControl 主题调节 |
| `validation/vizual-test.html` | 主冷启动验收页 — Agent 对话桥接、实时控件、artifact 更新、DocView 批注修订、导出/调试 |

```bash
python3 -m http.server 8793
```

打开这些页面：

- 主题与组件回归：`http://localhost:8793/validation/design-md-load.html`
- 冷启动 Agent 验收：`http://localhost:8793/validation/vizual-test.html`

### 冷启动 QA

冷启动 QA 用来验证：一个只读过 Vizual skill、没有项目上下文的 Agent，能否在可见宿主页面里正确使用 Vizual runtime。

| 文件 | 给谁 | 用途 |
|------|------|------|
| `COLD_START_BLIND_TEST.md` | 被测 Agent | 盲测任务书，只包含规则、输入任务和报告格式，不包含评分答案。 |
| `COLD_START_ACCEPTANCE_GUIDE.md` | 人类测试主持人 / 维护者 | 完整验收标准、预期行为、失败规则和 QA 报告格式。不要给被测 Agent。 |

推荐流程：

1. 把 `skills/vizual/` 安装到被测 Agent 环境。
2. 在仓库根目录启动 `python3 -m http.server 8793`。
3. 在用户可见的 Chrome 中打开 `validation/vizual-test.html`，并确保 Chrome DevTools MCP 或等价浏览器自动化能连接到这个页面。
4. 开一个全新的 Agent 会话，只给它 `COLD_START_BLIND_TEST.md`。
5. Agent 必须把测试 prompt 输入到可见页面，读取 `window.getPendingMessage()`，调用 Vizual bridge API，并输出 Markdown QA 报告。

被测 Agent 不能读取源码、validation HTML 源码、历史 QA 报告、git history 或 `COLD_START_ACCEPTANCE_GUIDE.md`。

这些页面同时也是**集成示例** — 每个组件的 JSON spec 格式都在页面中展示，非常适合作为 AI Agent 学习使用本库的参考。

## AI 接入

安装上面列出的 3 个 Skill 即可，每个 Skill 基于用户意图自动触发，无需手动调用。

### 其他 AI Agent

对于 Cursor、Windsurf 等 AI Agent，使用 `skills/vizual/prompt.md` 作为 System Prompt。

**注意**：Vizual 面向 AI Agent 产品和自有宿主前端。它可以嵌入你的 SaaS 小聊天窗或完整对话平台；但不能直接在 ChatGPT / Claude.ai 这类封闭消费级聊天界面里渲染，除非对方平台接入 Vizual runtime。

详见 [AI-INTEGRATION](docs/AI-INTEGRATION.md)。

## 构建

```bash
npm install    # 安装依赖
npm test       # 运行测试
npm run build  # 构建全部格式
```

构建产物：ESM 约 8.9MB + CJS 约 9.0MB + Standalone 约 12.6MB（standalone 包含 React、ReactDOM、ECharts、mermaid 等依赖）

贡献者请阅读 [CLAUDE.md](CLAUDE.md) 了解当前架构、组件开发规范和测试要求。

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

**预设主题**：`claude-dark`（默认）、`claude-light`、`default-dark`、`default-light`、`linear`、`vercel` — 通过 `setGlobalTheme('linear')` 切换。

**Dark/Light 模式**：通过 `toggleMode()` 切换 — 自动查找当前主题的 dark/light 对应变体。单主题 DESIGN.md 会通过 `invertTheme()` 自动生成反色变体。

React 18/19 · Zod 3.25 · ECharts 5.6 · json-render 0.17

## 开源许可证

[MIT](LICENSE) — 开源可商用。详见 [LICENSES.md](docs/LICENSES.md)。
