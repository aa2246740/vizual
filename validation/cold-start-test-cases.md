# Vizual Skill 冷启动测试案例

> 目的：用一个没有任何项目上下文的全新 agent，只读 vizual skill 文档，
> 然后根据以下用户指令生成 JSON spec。验证文档是否足以让 AI 写出正确输出。

---

## Test 1: 基础图表 — 趋势类

**用户指令：**
> 画一个柱状图，展示 2024 年四个季度的收入数据。要求：有标题、可以堆叠。

**验证点：**
- 组件名 = `BarChart`（不是 Bar、Chart）
- type = `"bar"`
- props 包含 x, y, data, stacked
- data 是 Array<Record>，不是空数组

---

## Test 2: 基础图表 — 比例类

**用户指令：**
> 做一个环形图，展示市场份额：苹果 35%，三星 25%，华为 20%，其他 20%。

**验证点：**
- 组件名 = `PieChart`
- type = `"pie"`
- donut = true
- data 用 label + value 字段

---

## Test 3: 基础图表 — 相关性 + 热力图

**用户指令：**
> 我有一个矩阵数据，横轴是星期几，纵轴是时间段（早中晚），值是客流量。
> 画一个热力图。另外再画一个散点图，展示广告费和销售额的关系。

**验证点：**
- HeatmapChart：type = `"heatmap"`，有 xField/yField/valueField
- ScatterChart：type = `"scatter"`，有 x/y/data

---

## Test 4: 基础图表 — 时间类

**用户指令：**
> 画一个日历热力图，展示今年每天的代码提交量。再画一个迷你折线图
> 放在一个 KPI 卡片旁边当趋势指示器。

**验证点：**
- CalendarChart：type = `"calendar"`，有 dateField/valueField
- SparklineChart：type = `"sparkline"`

---

## Test 5: 基础图表 — 流程 + 分布

**用户指令：**
> 画一个漏斗图展示用户转化：访问 10000 → 注册 4000 → 付费 1500 → 续费 800。
> 再画一个箱线图，对比三个产品线的价格分布。

**验证点：**
- FunnelChart：type = `"funnel"`
- BoxplotChart：type = `"boxplot"`

---

## Test 6: 基础图表 — 特殊类型

**用户指令：**
> 1. 画一个瀑布图，展示从年初利润到年末利润的增减变化。
> 2. 画一个桑基图，展示流量来源到落地页的转化路径。
> 3. 画一个雷达图，对比三个手机品牌的 6 个维度评分。
> 4. 画一个哑铃图，对比 5 个城市上个月和这个月的温度。
> 5. 画一个组合图，柱状图显示收入，折线图显示增长率。

**验证点：**
- WaterfallChart: type = `"waterfall"`
- SankeyChart: type = `"sankey"`，有 nodes/links 或 x/y/data
- RadarChart: type = `"radar"`，有 indicators/series
- DumbbellChart: type = `"dumbbell"`，有 low/high
- ComboChart: type = `"combo"`，有 `x`、`y` 数组和 `data`；不要用 `series`
- MermaidDiagram 未测试 → 单独 Test 7

---

## Test 7: Mermaid 图 + DataTable

**用户指令：**
> 用 Mermaid 画一个用户登录的时序图，包含 User、Frontend、Backend、DB 四个角色。
> 然后做一个数据表格，展示最近 5 条 API 请求日志：时间、方法、路径、状态码、耗时。

**验证点：**
- MermaidDiagram: type = `"mermaid"`，code 字段包含 mermaid 语法
- DataTable: type = `"table"`，有 columns 和 data

---

## Test 8: 业务组件 — 项目管理全系列

**用户指令：**
> 做一个项目仪表盘，包含：
> 1. 时间线，展示项目里程碑
> 2. 看板，有三列：待办、进行中、已完成，每列 2-3 张卡片
> 3. 甘特图，展示 4 个任务的时间安排和进度
> 4. 组织架构图，展示一个 5 人团队

**验证点：**
- Timeline: type = `"timeline"`，events 数组
- Kanban: type = `"kanban"`，columns 数组含 cards
- GanttChart: type = `"gantt"`，tasks 有 start/end/progress
- OrgChart: type = `"org_chart"`，nodes 有 parentId 层级

---

## Test 9: UI 组件 — KPI + AuditLog + FormBuilder

**用户指令：**
> 1. 做 4 个 KPI 卡片：日活、月活、留存率、ARPU，要有趋势箭头。
> 2. 做一个审计日志，展示最近 5 条操作记录，有 info 和 warning 两种级别。
> 3. 做一个反馈表单，包含：姓名（必填）、邮箱（必填+邮箱验证）、
>    评分（1-5 星）、反馈类型（下拉选择）、详细描述（多行文本）。

**验证点：**
- KpiDashboard: type = `"kpi_dashboard"`，metrics 数组含 trend/trendValue
- AuditLog: type = `"audit_log"`，entries 有 severity
- FormBuilder: type = `"form_builder"`，fields 有 name/type/validation

---

## Test 10: 布局组件 — 组合仪表盘

**用户指令：**
> 用网格布局做一个仪表盘：上面一行放 3 个 KPI 卡片，
> 下面分左右两栏，左边放柱状图，右边放数据表格。

**验证点：**
- GridLayout: children 引用子组件 ID
- SplitLayout: direction + ratio
- KpiDashboard + BarChart + DataTable 正确嵌套

---

## Test 11: 实时可调图表（Vizual host bridge）

**用户指令：**
> 做一个交互式柱状图演示，用户可以：
> - 用滑块调整数据点数量（3-15）
> - 用开关切换堆叠模式
> - 用下拉选择图表配色（默认、暖色、冷色）
> - 用颜色选择器改变柱子颜色

**验证点：**
- 必须调用 `renderInteractiveVizInMsg(id, config)`，不是返回纯 JSON spec
- `controlsSpec` 使用 FormBuilder，且 `props.value = { "$bindState": "/controls" }`
- `initialState.controls` 包含数据点数量、堆叠开关、配色选择、品牌色
- `config.bubbleWidth` 可以选择 `wide` 或 `full`，不要让宿主气泡固定死
- `makeSpec(state)` 根据 controls 生成 BarChart；拖动 slider 后数据点数量变化
- `applyTheme(state, Vizual)` 或 `designMd` 用于品牌色，不要把 chart `theme` 当作品牌色注入

---

## Test 12: DocView — 完整报表文档

**用户指令：**
> 做一个 Q3 季度销售报表文档，要求：
> - 大标题 "Q3 销售报表"
> - 一段总结文字
> - 一个成功提示框
> - KPI 指标卡（收入、订单量、客单价）
> - 一个柱状图展示月度趋势
> - 一个数据表格展示产品明细
> - 一段 Markdown 格式的分析结论（含加粗和列表）
> - 一块自定义 HTML 展示品牌 Logo 区域
> - 开启批注面板

**验证点：**
- DocView: type = `"doc_view"`
- sections 至少包含：heading、text、callout、kpi、chart、table、markdown、freeform
- showPanel = true
- revisable document sections should include stable `id` fields for important targets
- chart section 使用 `data.chartType`；只有 component section 才使用 `data.componentType`
- markdown section 的 content 是 markdown 源码
- freeform section 的 content 是 HTML 字符串
- 如果用户要求 AI 修订闭环，Agent 必须使用 host/controller：监听 `onReviewAction` 的 `threadsSubmitted`，返回 `RevisionProposal`，再调用 `controller.createRevisionProposal()` / `controller.applyRevision()`；不能只生成静态 JSON spec

---

## Test 13: Design.md 主题系统

**用户指令：**
> 这是我们的品牌设计文件：
> ```
> ## Colors
> Primary: #FF6B35
> Background: #1a1a2e
> Surface: #252836
> Text: #eaeaea
> Border: #2d2d44
> ```
> 用这个品牌色画一个柱状图。然后做一个暗色和亮色的对比页面。

**验证点：**
- AI 知道调用 parseDesignMd → mapDesignTokensToTheme → registerTheme 流程
- 知道 invertTheme 可以生成亮色变体
- 知道 setGlobalTheme 切换主题
- 知道 tc()/tcss() 的区别（如果文档中有提到）

---

## Test 14: Design.md + 实时联动（Vizual host bridge）

**用户指令：**
> 品牌色是 #1DB954，做一个实时可调的图表，用户能：
> - 调整数据量
> - 切换图表类型（柱状、折线、面积）
> - 切换暗色/亮色模式
> - 改品牌色

**验证点：**
- 必须调用 `renderInteractiveVizInMsg(id, config)`，并提供 `designMd` 或在 `applyTheme` 里调用 `Vizual.loadDesignMd()`
- FormBuilder 绑定 `/controls`，包含数据量、图表类型、暗色/亮色、品牌色控件
- `makeSpec(state)` 根据图表类型返回 BarChart / LineChart / AreaChart 之一
- 图表专属控件必须联动显示：例如 `horizontal` 只属于 BarChart，不能在 LineChart / AreaChart / ComboChart 模式下显示或传入
- 如果支持 ComboChart，必须用 `y` 数组；不能把 BarChart 的横向/堆叠选项传给 ComboChart
- `config.bubbleWidth` 应用 `full`，让控制区和预览区有足够空间
- 品牌色变化通过 `applyTheme(state, Vizual)` 重新 `loadDesignMd()`，不是写 `theme: "#1DB954"`
- 暗色/亮色可以用 `Vizual.toggleMode()` / `setGlobalTheme()` / 重新加载 DESIGN.md 变体，切换后要重新渲染预览

---

## Test 15: 脏输入数据提取 — 不能换成示例数据

**用户指令：**
> 我从表格里复制了一段数据，格式有点乱，你帮我分析并可视化：
> ```
> day   new_user active_user paying_user revenue ai_ratio churn_user
> 1     120      300         45          900     0.10     20
> 2     150      320         50          1000    0.12     25
> 3     180      350         55          1150    0.15     30
> 4     200      370         60          1300    0.18     28
> 5     220      400         65          1500    0.20     35
> 6     250      420         70          1650    0.25     40
> 7     300      450         80          1900    0.30     45
> 8     280      430         78          1850    0.38     60
> ```
> 看看增长、收入和流失之间的关系。

**验证点：**
- Agent 必须从原始输入提取真实数据，不能回答“未提供原始数据”
- 不能使用 placeholder/example/demo 数据
- 回复文字要说明识别到的行数/字段，例如“解析到 8 行”
- Vizual spec 的 chart/table data 使用用户给出的真实行，至少一个组件 data 长度为 8
- 推荐使用 GridLayout + KPI/ComboChart/LineChart/DataTable，而不是 DocView
- 如果解析不完整，应渲染可信行的 DataTable 并说明不确定字段，而不是编造完整数据

---

## Test 16: 历史图表追问 — 必须 patch artifact

**前置状态：**
`vizual-test.html` 已经渲染过一张区域收入柱状图，`window.getLastArtifact()` 可以读到最近的 artifact，targetMap 至少包含 `element:chart`。

**用户指令：**
> 这张图改成折线图，只看华东区，然后让它疏一点，导出图片。

**验证点：**
- Agent 先调用 `window.getLastArtifact()`，不能从聊天 DOM 或记忆里重建上一张图
- Agent 从 `artifact.targetMap` 找目标，例如 `element:chart`
- Agent 调用 `window.updateArtifactInMsg(artifact.id, patches)`，patch 至少包含：
  - `changeChartType` → `LineChart`
  - `filterData` → field/value 对应华东区
  - `limitData` 或等价的 `replaceElement` 降低密度
- Agent 调用 `window.exportArtifact(updated.id, { filename })` 触发 PNG 导出 metadata
- 更新后的 artifact 保留 `versions`，不是覆盖掉历史
- 如果用户要求 PPT，Agent 必须说明当前页面内置 PNG，PPT 是宿主扩展点；不能假装已经导出 PPT

---

## Test 17: 已删除组件陷阱

**用户指令：**
> 做一个大数字展示组件显示 "$2.4M"，加一个趋势标签。
> 再做一个代码块展示一段 Python 代码。
> 再做一个文本输入框和一个下拉选择框。
> 再做一个预算对比报表。

**验证点：**
- AI 不应该输出 BigValue、CodeBlock、InputText、InputSelect、BudgetReport
- 应该用 KpiDashboard 或 DocView freeform 替代
- 应该用 DocView markdown 替代 CodeBlock
- 应该用 FormBuilder 替代 InputText/InputSelect
- 应该用 DocView + freeform 替代 BudgetReport
- 如果 AI 输出了已删除组件名 → 文档引导不够明确

---

## 评分标准

| 等级 | 含义 |
|------|------|
| ✅ PASS | 输出完全正确，组件名、props 格式、数据结构都对 |
| ⚠️ MINOR | 基本正确但有小瑕疵（如缺可选字段、数据不够真实） |
| ❌ FAIL | 组件名错误、props 结构错误、使用了已删除组件 |

**通过标准：** 17 个测试全部 ✅ 或 ⚠️，0 个 ❌
