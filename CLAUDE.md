# CLAUDE.md — Vizual 开发上下文

## 项目定义

Vizual 是面向 AI Agent 产品的视觉运行时。Agent 输出 Vizual spec/artifact，宿主前端自动渲染为可交互、可追问、可导出、可批注的视觉结果。

核心目标：

- 让 Agent 回复不再只有纯文本 / Markdown，而是能稳定输出图表、Dashboard、表格、报表和可调 UI。
- 让宿主保存 `VizualArtifact`，支持历史对话继续追问修改。
- 让 DocView 支持用户批注、提交、Agent revision proposal、用户/宿主 apply 的共建循环。
- 让 Design.md 主题系统为 Agent 输出提供统一换肤能力。

当前公开能力：

- 31 个注册组件：
  - 19 charts：BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram
  - 1 DataTable
  - 6 business：KpiDashboard, Kanban, GanttChart, OrgChart, Timeline, AuditLog
  - 1 FormBuilder
  - 1 DocView
  - 3 layout：GridLayout, SplitLayout, HeroLayout
- Native ECharts option builders are internal to Vizual. Do not add an external chart-builder runtime back.
- Host/runtime：artifact targetMap、版本、patch、导出、interactive bridge、DocView review bridge。

## 技术栈

| Layer | Technology |
| --- | --- |
| UI | React >= 18 |
| Schema | Zod ^3.25 |
| Charts | ECharts ^5.6 |
| Rendering | json-render ^0.17 |
| Build | esbuild + TypeScript |
| Tests | Vitest + jsdom |
| Export | html2canvas, jsPDF, JSZip |
| Markdown / diagrams | marked, mermaid |

旧的外部图表适配器、外部实时交互方案和已移除的交互组件都不是当前运行时的一部分。不要在新文档、skill 或示例中重新引入它们。

## 关键目录

```text
src/charts/                 19 个 ECharts 图表组件
src/components/             业务组件和布局组件
src/inputs/form-builder/    FormBuilder
src/docview/                DocView、批注、review controller、revision loop
src/core/                   artifact、host runtime、export、ECharts wrapper
src/themes/                 Design.md parser、theme mapper、theme registry
skills/vizual/              Agent 使用的主 skill 和组件 references
validation/vizual-test.html 冷启动 Agent 主验收页
validation/eval-full-31.html 31 组件视觉回归页
```

## 组件开发规范

### 颜色系统

- React/CSS 样式使用 `tcss('--rk-*')`，让浏览器在主题变化时重新解析 CSS var。
- ECharts option 使用 `tc('--rk-*')`，因为 ECharts 不理解 CSS var。
- 图表颜色优先用 `chartColors()`。
- 用户可选颜色、批注色、数据驱动色可以保留为数据值。

常用导入：

```ts
import { tc, tcss, chartColors } from '../../core/theme-colors'
```

DocView 内部从 `../core/theme-colors` 导入。

### 新组件结构

```text
src/components/new-widget/
├── schema.ts
├── component.tsx
└── index.ts
```

注册三处：

1. `src/catalog.ts`：注册 Zod schema。
2. `src/registry.tsx`：注册 React component。
3. `src/index.ts`：导出组件、schema、类型。

同时更新：

- `docs/COMPONENTS.md`
- `skills/vizual/SKILL.md`
- 对应 `skills/vizual/references/...`
- `validation/eval-full-31.html` / `validation/specs-31.js`，如果是公开组件。

## Agent Runtime 规则

- 一次性展示可以直接渲染 JSON spec。
- 需要历史恢复、追问修改、导出、批注或状态审计时，必须保存 `VizualArtifact`。
- follow-up 修改应使用 typed patches，例如 `changeChartType`、`filterData`、`limitData`、`updateElementProps`、`replaceSpec`。
- 不要猜 JSON path；优先用 artifact `targetMap` 的 `targetId`。
- 真实聊天历史中，追问改图默认生成新的 AI 气泡，不覆盖旧气泡。

## Interactive 规则

实时可调不是纯 JSON spec。

在 `vizual-test.html` 中使用：

```js
window.renderInteractiveVizInMsg(id, {
  initialState,
  controlsSpec,
  makeSpec: (state) => spec,
  designMd,
  applyTheme: (state, Vizual) => {},
})
```

要求：

- FormBuilder 用 `value: { "$bindState": "/controls" }`。
- 只暴露当前图表真正支持的控件；例如 `horizontal` / `stacked` 只给 BarChart。
- 多个 interactive artifact 必须隔离 state 和 theme scope。

## DocView 规则

DocView 只用于需要批注、审阅、修订、版本历史或“共建文档”的场景。

普通分析报告、dashboard、导出报表默认用宿主文本 + GridLayout/charts/tables，不要因为用户说“报告”就使用 DocView。

Agent-driven loop：

1. 宿主渲染 DocView 并拿到 `controllerRef`。
2. 用户创建批注 thread。
3. 用户提交 thread。
4. Agent 读取 submitted threads 和 section context。
5. Agent 生成 `RevisionProposal`。
6. 宿主/用户 apply 或 reject。
7. `onSectionsChange` 持久化新 sections。

在 `vizual-test.html` 中使用：

- `renderDocViewInMsg`
- `createDocViewThread`
- `submitDocViewThreads`
- `getDocViewReviewState`
- `createDocViewRevision`
- `applyDocViewRevision`

## 测试要求

常规提交前至少跑：

```bash
npm test
npm run typecheck
npm run build
```

UI / runtime 改动还要检查：

- `validation/eval-full-31.html`：31 组件是否视觉可用。
- `validation/vizual-test.html`：冷启动 Agent 主链路。
- DocView 改动：批注 → 提交 → revision proposal → apply → resolved。
- interactive 改动：多个实时组件并存时 state/theme 互不影响。

冷启动盲测文档：

- `COLD_START_BLIND_TEST.md`：给被测 Agent。
- `COLD_START_ACCEPTANCE_GUIDE.md`：给测试主持人，不给被测 Agent。
