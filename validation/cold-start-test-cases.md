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
- ComboChart: type = `"combo"`，有 series 数组
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

## Test 11: InteractivePlayground（LiveKit）

**用户指令：**
> 做一个交互式柱状图演示，用户可以：
> - 用滑块调整数据点数量（3-15）
> - 用开关切换堆叠模式
> - 用下拉选择图表配色（默认、暖色、冷色）
> - 用颜色选择器改变柱子颜色

**验证点：**
- InteractivePlayground: type = `"interactive_playground"`
- component 字段格式正确：`{ type: "BarChart", props: {...} }`
- controls 用 `name` + `targetProp`（不是 key 或 wrappedSpec）
- 包含 slider、toggle、select、color 四种控件

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
- chart section 有 componentType
- markdown section 的 content 是 markdown 源码
- freeform section 的 content 是 HTML 字符串

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

## Test 14: 三合一联动（Parser + LiveKit + Vizual）

**用户指令：**
> 品牌色是 #1DB954，做一个实时可调的图表，用户能：
> - 调整数据量
> - 切换图表类型（柱状、折线、面积）
> - 切换暗色/亮色模式
> - 改品牌色

**验证点：**
- 正确组合 parseDesignMd + InteractivePlayground + 主题切换
- controls 的 targetProp 映射正确
- 主题切换时知道重新渲染

---

## Test 15: 已删除组件陷阱

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

**通过标准：** 15 个测试全部 ✅ 或 ⚠️，0 个 ❌
