# Vizual Native Core 用户验收说明

## 1. 验收什么

验收目标不是“Agent 会不会背组件名”，而是：

- 用户用自然语言提问时，Agent 能在合适位置插入 Vizual 可视/互动 UI。
- 数据分析、概念解释、结构化输入、计划/组织/时间线等场景能真实渲染。
- 纯文本请求不会被强行塞 UI。
- 用户明确要求网页、HTML、React、landing page、小游戏等创作时，不被强行套 native core。
- 表单、按钮、筛选、drill-down 等交互必须有用，并能进入 host-visible action log。
- 已移除组件输入返回稳定 unsupported error，不静默假装成功。

## 2. 当前 Native Core 边界

Agent-facing catalog:

- 19 charts。
- DataTable。
- KpiDashboard, GanttChart, OrgChart, Timeline。
- FormBuilder。
- Markdown, Container, Row, Column, Card, Text, Image, Icon, List, Divider, Button, CheckBox, TextField, ChoicePicker, Slider, DateTimeInput, Tabs, Video, AudioPlayer。

Runtime 仍保留一个历史兼容组件 `HeroLayout`，但它不是 Agent-facing 输出方式。

已移出 native core 的产品/页面层组件不再作为验收目标，也不能在新示例里被 Agent 使用。

## 3. 验收入口

推荐顺序：

1. 真实 Agent 宿主页面，例如 DeerFlow 或本地 Agent chat。
2. `validation/vizual-test.html` 作为 SDK demo bridge。
3. `validation/native-protocol-matrix.html` 检查协议归一化。
4. 单元测试和 typecheck/build 只证明代码层，不等于用户体验通过。

浏览器必须可见，测试者要能看到真实图表/表格/表单。不能只看 JSON 或后端日志。

## 4. 自然语言场景矩阵

每次回归至少覆盖这些类型，且输入不能写成显式组件调用：

| 场景 | 期待 |
| --- | --- |
| 银行网点经营分析 | KPI + 趋势/对比图 + 明细表 + 风险/动作说明 |
| 销量增长但利润下降 | 成本率/营销/渠道/退货的可视证据 |
| 投委会基金经理比较 | 收益、回撤、波动、夏普的多图和表 |
| 概念互动解释 | 有意义参数控制，预览随参数变化 |
| 项目进度 | Gantt 或 Timeline，展示日期/进度/依赖 |
| 组织/责任关系 | OrgChart 或结构化责任表 |
| 信息收集 | FormBuilder 提交后 action log 可见 |
| 纯文本请求 | 不生成 Vizual |
| 明确网页/HTML/React 请求 | 按用户创作请求处理，不强行 native |
| 已移除组件旧输入 | 返回 unsupported-component error |

## 5. 视觉通过标准

- 图表实际绘制出来，不能只有“已渲染”标记。
- 表格有可读数据、列名和数值。
- KPI 值和趋势与输入数据一致。
- Markdown/文本不与图表或控件重叠。
- 表单字段可见、可填写、可提交。
- action log 记录交互事件。
- 暗色/亮色主题下文本仍可读。

## 6. 代码通过标准

```bash
npm test
npm run typecheck
npm run build
```

这些通过后还要做浏览器验收。浏览器验收失败时，优先修 native core 内部 bug；不要帮 Agent、harness、DeerFlow 输出做表面补丁。

## 7. 证据记录

每轮验收至少记录：

- 测试日期和入口页面。
- 输入的自然语言任务。
- Agent 原始输出或 tool call 摘要。
- 渲染结果截图/观察结论。
- action log / renderEvidence / errors。
- 明确 proof boundary：浏览器实测、后端日志、单元测试、静态检查分别到哪一步。

## 8. 不合格例子

- 先写好组件答案，再反推出测试 prompt。
- 只检查 JSON，不看页面。
- 给没有意义的按钮或“派单”功能。
- 用户只问一句解释，却强行塞图。
- 用户明确要 HTML 页面，却被转成 native core surface。
- 已移除旧组件被 silently fallback 成空白或假渲染。
