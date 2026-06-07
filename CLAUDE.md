# CLAUDE.md - Vizual 开发上下文

## 项目定义

Vizual 是面向 AI Agent 产品的原生视觉运行时。用户仍然自然对话；Agent 在文字不足以表达趋势、对比、结构、状态、交互或输入收集时，按 Native Catalog 生成可渲染的 Vizual surface。宿主负责渲染、保存 artifact、处理追问 patch、导出和 action 回传。

Vizual 不是页面模板库，也不是关键词路由器。显式网页、landing page、小游戏、HTML/CSS/React 等创作请求应按用户要求走对应创作路径，不强行套 Native Core。

## 当前能力边界

Agent-facing catalog 是语义 surface + 轻量组合：

- 19 charts: BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram
- DataTable
- Business: KpiDashboard, GanttChart, OrgChart, Timeline
- Input: FormBuilder
- Content/composition/media: Markdown, Container, Row, Column, Card, Text, Image, Icon, List, Divider, Button, CheckBox, TextField, ChoicePicker, Slider, DateTimeInput, Tabs, Video, AudioPlayer

`HeroLayout` 只保留 runtime 历史兼容，manifest 标记为 `agentFacing: false`。不要把它写进新的 Agent-facing catalog、skill 示例、冷启动提示或验收要求。

已从 Native Core 移除的产品/页面层组件：DocView, GridLayout, SplitLayout, FreeformHtml, Modal, Kanban, AuditLog。不要重新在 catalog、registry、skill、docs 或 validation 示例中引入它们。core 对旧输入应返回稳定 unsupported-component 错误，而不是静默伪装成功。

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
| Markdown / diagrams | marked, DOMPurify, mermaid |

旧的外部图表适配器、DocView review SDK、页面级布局组件、freeform HTML escape hatch 和 workflow board/log 组件都不是当前 native core 的一部分。

## 关键目录

```text
src/charts/                 19 个 ECharts 图表组件
src/components/             business、content、composition、A2UI primitives
src/inputs/form-builder/    FormBuilder
src/core/                   artifact、host runtime、export、renderer、agent bridge
src/native-core/            A2UI / AG-UI / AgenUI 输入归一化与校验
src/themes/                 Design.md parser、theme mapper、theme registry
skills/vizual/              Agent 使用的主 skill 和组件 references
validation/                 浏览器验收页、冷启动 harness、证据 artifact
```

## 组件开发规范

### 颜色系统

- React/CSS 样式使用 `tcss('--rk-*')`，让浏览器在主题变化时重新解析 CSS var。
- ECharts option 使用 `tc('--rk-*')`，因为 ECharts 不理解 CSS var。
- 图表颜色优先用 `chartColors()`。
- 用户可选颜色、数据驱动色可以保留为数据值。

常用导入：

```ts
import { tc, tcss, chartColors } from '../../core/theme-colors'
```

### 新组件结构

```text
src/components/new-widget/
├── schema.ts
├── component.tsx
└── index.ts
```

注册三处：

1. `src/catalog.ts`: 注册 Zod schema。
2. `src/registry.tsx`: 注册 React component。
3. `src/index.ts`: 导出组件、schema、类型。

同时更新：

- `docs/COMPONENTS.md`
- `skills/vizual/SKILL.md`
- 对应 `skills/vizual/references/...`
- `validation/specs-31.js` 和相关浏览器验收页，如果是公开 Agent-facing 组件。

## Agent Runtime 规则

- 一次性展示可以直接渲染 JSON spec。
- 需要历史恢复、追问修改或导出时，保存 `VizualArtifact`。
- follow-up 修改使用 typed patches，例如 `changeChartType`、`filterData`、`limitData`、`updateElementProps`、`replaceSpec`。
- 不要猜 JSON path；优先用 artifact `targetMap` 的 `targetId`。
- 真实聊天历史中，追问改图默认生成新的 AI 气泡，不覆盖旧气泡。

## 交互规则

有用才交互。按钮、筛选、表单、drill-down、plan update 必须能帮助用户理解、选择、收集信息或触发宿主明确提供的能力。

- `FormBuilder` 只负责收集结构化输入并通过 `submitForm` 回传给 host Agent。
- 不要在 native core 里承诺保存、审批、派单、外部系统写入或任务管理。
- 如果宿主没有对应 action 能力，不要为了展示交互而加按钮。
- liveControl 不是纯 JSON spec；宿主需要把 FormBuilder 的 `value: { "$bindState": "/controls" }` 绑定到 state，再由 `makeSpec(state)` 重新生成预览。

## 测试要求

常规提交前至少跑：

```bash
npm test
npm run typecheck
npm run build
```

UI / runtime 改动还要检查：

- 当前公开组件能在浏览器中真实渲染，不只看 JSON。
- 被移除组件输入返回稳定 unsupported error。
- 自然语言任务不能靠预设答案反推测试结论。
- 不应影响纯文本回答和显式网页/HTML/React 创作请求。
- FormBuilder/action 回传只记录 host-visible event，不伪造外部业务结果。

DeerFlow、agent、harness 只能作为黑盒验收入口。修 bug 时只修 native core 内部缺陷，不替 agent 输出或 harness 逻辑做表面补丁。
