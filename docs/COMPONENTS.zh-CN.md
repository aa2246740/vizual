# Vizual 组件目录

本文说明当前 Native Core 的 Agent-facing 组件目录。真实 schema 以 `src/catalog.ts` 和 `createVizualCatalogManifest()` 生成为准。

Vizual 的组件不是页面模板，而是 Agent 可以组合使用的语义表达单元。宿主产品负责页面级布局和品牌体验，Vizual 负责 native 渲染、校验、状态、action 和导出。

## 图表

所有图表由 Vizual 内部的 ECharts option builder 渲染，Agent 不应该直接输出 ECharts option、Chart.js config、HTML 或 React 代码。

| Component | `props.type` | 用途 |
| --- | --- | --- |
| BarChart | `bar` | 分类对比、分组/堆叠/横向柱状图 |
| LineChart | `line` | 时间趋势、多序列趋势 |
| AreaChart | `area` | 面积趋势、累计趋势 |
| PieChart | `pie` | 占比、环形图 |
| ScatterChart | `scatter` | 相关性、风险收益、双数值维度 |
| BubbleChart | `bubble` | 带规模维度的相关性 |
| BoxplotChart | `boxplot` | 分布和离群值 |
| HistogramChart | `histogram` | 频率分布 |
| WaterfallChart | `waterfall` | 增减贡献、桥图分析 |
| XmrChart | `xmr` | 过程监控、控制限 |
| SankeyChart | `sankey` | 流向、贡献路径 |
| FunnelChart | `funnel` | 转化漏斗 |
| HeatmapChart | `heatmap` | 矩阵强度 |
| CalendarChart | `calendar` | 日期强度 |
| SparklineChart | `sparkline` | 紧凑趋势 |
| ComboChart | `combo` | 柱线混合、双轴对比 |
| DumbbellChart | `dumbbell` | 前后对比、区间对比 |
| RadarChart | `radar` | 多维画像 |
| MermaidDiagram | `mermaid` | 流程图、时序图、概念图 |

通用要求：

- 数据必须非空，除非宿主明确要展示空状态。
- 图表优先使用 `props.data` + typed `props.encoding`；多指标或 ComboChart 图层优先使用 `props.measures`。
- chart props、`encoding`、`measures` 引用的字段必须存在于数据行。
- 长表分类分组放在 `encoding.color`、`seriesBy`、`colorBy` 或 `groupBy`；不要把 string `series` 当推荐路径。
- 只有当点击点位能触发更深入分析时，才使用 `drillDown`。
- 不要添加 schema 中不存在的任意图表字段。

## 数据

### DataTable

`props.type`: `table`

用于详细数据、排行、网点/客户/产品明细、证据表。Native Core 不承诺内置排序、筛选或分页，除非 live schema 明确支持。

## 业务表达

### KpiDashboard

`props.type`: `kpi_dashboard`

用于紧凑展示指标卡、趋势、变化值和颜色。适合经营分析、银行网点分析、零售/运营 dashboard。

### GanttChart

`props.type`: `gantt`

用于项目计划、日期、进度、负责人、依赖关系。它是可视化计划表，不是项目管理系统。

### OrgChart

`props.type`: `org_chart`

用于组织结构、汇报关系、责任分工、网点/团队结构。

### Timeline

`props.type`: `timeline`

用于事件顺序、里程碑、事故过程、路线图、流程历史。

## 输入

### FormBuilder

`props.type`: `form_builder`

用于结构化输入比自由文本更清晰的场景。支持文本、数字、选择、长文本、单选、多选、开关、滑块、日期时间、评分等 schema 中定义的字段。

边界：

- 通过 `submitForm` 把数据提交给 host Agent。
- 可以和 `$bindState` 一起用于 liveControl；如果控件通过 `recomputeSpec` 本地实时更新，设置 `showSubmit: false`。
- 不会自己保存、审批、派单、创建 ticket 或写外部系统。

## 内容、组合、媒体、A2UI primitives

| Component | 用途 |
| --- | --- |
| Markdown | 结论、解释、风险说明 |
| Container | 带方向、间距、尺寸、背景、边框的容器 |
| Row | 横向组合 |
| Column | 纵向组合，常见 root |
| Card | 小型自包含分组 |
| Text | 文本 primitive |
| Image | 图片展示 |
| Icon | 图标或标记 |
| List | 有序/无序列表 |
| Divider | 分隔线 |
| Button | 有意义的 host-visible action |
| CheckBox | 布尔输入 |
| TextField | 文本输入 |
| ChoicePicker | 选择输入 |
| Slider | 数值范围输入 |
| DateTimeInput | 日期/时间输入 |
| Tabs | 紧凑分组 |
| Video | 视频 |
| AudioPlayer | 音频 |

组合建议：

- 聊天中的 visual block 默认用 `Column` root。
- 紧凑对比和控件组合用 `Row`。
- 只有需要明确间距、尺寸、背景时使用 `Container`。
- 页面级设计交给宿主产品，不放进 native core。

## 已移出 Native Core

以下旧组件不再属于 native core：

- DocView
- GridLayout
- SplitLayout
- FreeformHtml
- HeroLayout
- Modal
- Kanban
- AuditLog

这些属于文档编辑、页面布局、自由 HTML、弹窗、看板或日志产品能力。新 spec 必须使用当前 catalog。旧 payload 使用这些组件时，应该得到稳定 unsupported-component 错误，而不是渲染假的 fallback。

## Actions

| Action | 来源 | 含义 |
| --- | --- | --- |
| `submitForm` | FormBuilder, Button | 发送结构化输入给 host Agent |
| `applyFilter` | DataTable, Button, ChoicePicker, Slider | 应用 host-visible 筛选 |
| `drillDown` | Charts, DataTable | 请求对选中对象深入分析 |
| `selectLocation` | DataTable, Button, ChoicePicker | 选择网点、区域、门店等位置 |
| `updatePlan` | Timeline, FormBuilder, Button | 返回计划/状态更新 |

Actions 是事件，不是业务承诺。宿主决定收到事件之后发生什么。

## 校验

```bash
node skills/vizual/scripts/validate-spec.js spec.json
```

浏览器验收必须检查真实渲染结果，包括图表、表单和交互；只验证 JSON 不足以证明 UI 可用。
