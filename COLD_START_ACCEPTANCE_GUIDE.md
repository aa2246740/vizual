# Vizual vNext 冷启动验收指南

这份指南用于验证：一个**只读过 Vizual skill、没有项目上下文的 Agent**，能不能正确把 Vizual 当成宿主运行时来使用。

被测 Agent 必须像真实 SaaS / Chatbot 里的业务 Agent 一样工作：读取用户输入，判断该用静态 spec、可编辑 artifact、实时交互 bridge，还是 DocView；把内容渲染到聊天页面；支持追问改图、实时调参、批注修订和导出。

## 测试环境

本地静态服务：

- 冷启动主测试页：`http://127.0.0.1:8793/validation/vizual-test.html`
- 组件回归参考页：`http://127.0.0.1:8793/validation/eval-full-31.html`
- DocView 独立兜底页：`http://127.0.0.1:8793/validation/demo-docview.html`

冷启动验收的主线只测 `vizual-test.html`。`eval-full-31.html` 是开发者维护组件库时使用的回归页，不是冷启动 Agent 的主要任务；除非用户明确要求，否则被测 Agent 不要跳去跑 31 组件页。

推荐由测试主持人预先准备好浏览器：

- Chrome DevTools Protocol：`http://127.0.0.1:9224`

冷启动 Agent 必须使用用户能看到的同一个浏览器页面。测试主持人负责启动服务、打开 Chrome、打开 `vizual-test.html`，以及确保 Chrome DevTools MCP 能看到这个页面。被测 Agent 不负责启动、重启、杀掉或切换 Chrome，也不负责下载 Playwright 浏览器。

## 测试模式：可见页面监听

这个测试不是“让 Agent 写脚本自动跑完”。正确模式是：

1. 用户在自己能看到的 Chrome 里打开 `vizual-test.html`。
2. 被测 Agent 连接同一个 Chrome/CDP 和同一个页面。
3. 用户在页面聊天框里输入测试 prompt。
4. 被测 Agent 通过 `window.getPendingMessage()` 读取用户输入。
5. 被测 Agent 在同一个可见页面里调用 bridge API 生成 AI 回复、渲染 Vizual、追问修改、交互控件、DocView 或导出。
6. 用户能肉眼看到每一步结果。

禁止行为：

- 不要执行 `open -a "Google Chrome"`、`pkill Chrome`、`kill Chrome`、`curl /json/new` 之类的浏览器管理动作。
- 不要自己寻找、抢占或改造远程调试端口。
- 不要启动 headless 浏览器。
- 不要新开一个用户看不到的 Playwright Chromium。
- 不要运行 `playwright install`、`npx playwright install`、`playwright install chromium` 或任何会下载浏览器的命令。
- 不要把测试改成“自己写 Python/Playwright 脚本跑完”。
- 不要告诉用户“不用输入，我自动测”。这个页面的核心就是测 Agent 能否监听和响应用户输入。
- 如果用户说“我想看着你测”，被测 Agent 应该等待用户在页面里输入，并说明“我会监听这个页面并响应你的输入”。
- 不要把 `eval-full-31.html` 当成冷启动主任务。

如果 Chrome DevTools MCP 没有列出 `vizual-test.html`，被测 Agent 应该停止并告诉测试主持人：“我现在看不到你打开的 `vizual-test.html`，请你确认页面已经打开并且 DevTools MCP 已连接到这个 Chrome。”不要自行重启浏览器或换端口。

## 被测 Agent 约束

被测 Agent 必须遵守：

1. 只能读取已安装的 Vizual skill：
   - `~/.claude/skills/vizual/SKILL.md`
   - `~/.claude/skills/vizual/references/` 下按需引用的组件文档
2. 不能读取 Vizual 仓库源码、validation HTML 源码、历史 QA 报告、git history，或本轮实现对话。
3. 必须像真实宿主 Agent 一样操作已经打开的浏览器页面，可使用 Chrome DevTools MCP 或等价的 `evaluate_script` 能力。
4. 不能只把 JSON 粘到聊天框里就算成功；页面上必须出现真实渲染后的 Vizual UI。
5. 页面提供 bridge API 时，必须优先使用页面 bridge API。
6. 必须保留聊天历史。追问改图默认生成新的 AI 气泡，不能原地篡改老气泡；除非明确是临时预览/调试。
7. 必须提交 QA 报告，包含 PASS/FAIL、DOM/API 状态、控制台错误、导出结果、截图或等价视觉证据。

## 给 Claude Code 的一次性测试 Prompt

把下面这段粘到一个全新的 Claude Code 会话里：

```text
你是 Vizual 的冷启动 QA Agent。

规则：
- 你没有任何 Vizual 先验上下文，只能依赖已安装的 skill。
- 第一步先读 ~/.claude/skills/vizual/SKILL.md。
- 只在需要时读取 ~/.claude/skills/vizual/references/ 下被 SKILL.md 指向的组件参考文件。
- 不要读取 Vizual 仓库源码、validation HTML 源码、git history、历史 QA 报告，或任何实现对话。
- 测试主持人已经打开了可见页面。你只负责连接和监听，不负责启动 Chrome、重启 Chrome、杀 Chrome、打开新浏览器或切换调试端口。
- 优先使用 Chrome DevTools MCP 连接当前页面；如果 MCP 暴露了多个 tab，只选择 URL 为 http://127.0.0.1:8793/validation/vizual-test.html... 的 tab。
- 只测试主页面： http://127.0.0.1:8793/validation/vizual-test.html?cold-start-claude=<timestamp>
- 你必须连接用户正在看的同一个可见 Chrome 页面。不要启动 headless 浏览器，不要启动新的 Playwright Chromium。
- 不要运行 `playwright install` 或任何下载 Chromium 的命令；测试只允许连接现有页面。
- 如果你无法通过 MCP 看到这个页面，直接告诉用户“我看不到已打开的 vizual-test.html，请你确认 DevTools MCP 连接的是这个 Chrome”，然后等待。不要自己执行 open/kill/curl/json/new 等浏览器管理命令。
- 这个测试是“监听用户输入并响应”，不是“自己写脚本自动跑完”。用户会在页面聊天框输入测试内容，你要读取页面 pending message 并在同一个页面里回复。
- 除非用户明确要求，不要测试 eval-full-31.html。

你的任务：
1. 假装自己是嵌入在 SaaS / Chatbot 产品里的业务 Agent，Vizual 是你的可视化运行时。
2. 根据 Vizual skill 判断何时使用静态 spec、可编辑 artifact、实时交互 bridge、DocView。
3. 完成本验收指南里的所有场景。
4. 不要只看 PASS 文案。只有页面上真实渲染正确 UI，并且宿主 debug API 状态合理时，才能判定 PASS。
5. 用户输入后，你要在可见页面里生成新的 AI 回复气泡或交互结果，让用户能跟着看。
6. 输出一份 Markdown QA 报告，包含：
   - 场景 ID
   - 用户输入
   - 你的操作
   - 使用的 API
   - 观察结果
   - PASS / FAIL
   - 截图或 DOM/debug 证据
   - console errors
   - 导出文件/链接记录

重要宿主 API：
- window.getPendingMessage()
- window.createAiMsg()
- window.streamText(id, text)
- window.finishText(id)
- window.renderVizInMsg(id, spec, options?)
- window.renderArtifactInMsg(id, artifact, options?)
- window.updateArtifactInMsg(ref, patches, options?)
- window.renderInteractiveVizInMsg(id, config)
- window.updateInteractiveVizInMsg(ref, patch, options?)
- window.getInteractiveVizState(ref?)
- window.renderDocViewInMsg(id, config)
- window.getVizualConversationState()
- window.getVizualDebugState()
- window.getLastArtifact()
- window.exportArtifact(ref, options)

不要依赖 .message 这种脆弱选择器。优先使用 getVizualConversationState() 和 getVizualDebugState()。
如果必须看 DOM，使用稳定属性：data-message-row、data-ai-msg、data-user-msg、data-viz-container、data-artifact-id。
```

## 必测场景

### S0. 宿主页面就绪

打开 `vizual-test.html`。

通过标准：

- 页面加载完成，没有 console error。
- `window.Vizual` 存在。
- `window.renderVizInMsg` 存在。
- `window.updateArtifactInMsg` 存在。
- `window.renderInteractiveVizInMsg` 存在。
- `window.getVizualConversationState` 存在。
- `window.getVizualDebugState` 存在。

可用检查：

```js
({
  vizual: !!window.Vizual,
  renderVizInMsg: typeof window.renderVizInMsg,
  updateArtifactInMsg: typeof window.updateArtifactInMsg,
  renderInteractiveVizInMsg: typeof window.renderInteractiveVizInMsg,
  getVizualConversationState: typeof window.getVizualConversationState,
  getVizualDebugState: typeof window.getVizualDebugState,
});
```

### S1. 乱格式输入生成静态 Dashboard

用户输入：

```text
帮我把下面这段乱格式数据做成一个增长分析 dashboard，要有核心指标、趋势图、结构洞察和明细表。

日期    区域   新增用户 active revenue churn ai内容占比
D1 华东 120  980  12000 20  10%
D2 华东 150  1120 13800 22  15%
D3 华东 180  1280 15500 26  20%
D4 华东 210  1450 17300 31  25%
D5 华东 240  1580 18800 38  30%
D6 华东 260  1660 19700 48  35%
D7 华东 275  1690 20100 62  40%
D8 华东 255  1610 19400 78  48%
D9 华东 230  1490 18100 96  55%
D10 华东 205 1360 16600 115 62%
D11 华东 180 1240 15300 132 68%
D12 华东 165 1160 14600 145 72%

注意：不要只复述数据，要指出可能的虚假相关、混杂变量、用户筛选效应。
```

期望行为：

- 读取相关参考文档：`GridLayout`、`KpiDashboard`、`ComboChart`、`ScatterChart` 或 `LineChart`、`DataTable`。
- 使用 `renderVizInMsg()` 或 `renderArtifactInMsg()` 在新的 AI 气泡里渲染。
- 图表外应有文字解释。
- 不要因为用户说了 dashboard / report 就默认使用 DocView。
- 最终用户看到的不能只是 raw JSON。

通过标准：

- 出现新的 AI 气泡。
- 气泡里有真实渲染的 Vizual UI。
- Dashboard 至少包含 KPI、趋势图/组合图、关系图、明细表。
- 分析文字提到：
  - D5-D7 斜率变化或阶段性拐点
  - D7/D8 前后的阶段变化
  - AI 占比和 churn 同步上升不等于因果证明
  - 存在时间趋势混杂变量风险
  - 如果活跃用户下降但 ARPPU 上升，可能存在用户筛选效应
- `getVizualConversationState()` 显示至少一个 AI message 的 `hasViz: true`。
- `getLastArtifact()` 存在，并且有可编辑 artifact 状态或 target map。

### S2. 历史追问必须生成新气泡

在 S1 后继续输入：

```text
把刚才的 dashboard 里主趋势图改成折线图，只看华东区，数据点少一点，然后导出 PDF 和 XLSX。
```

期望行为：

- 使用 `getLastArtifact()`，不要凭记忆重造。
- 使用 `updateArtifactInMsg()` 和 typed patches，例如 `changeChartType`、`filterData`、`limitData`、`updateElementProps`。
- 默认生成新的 AI 气泡。
- 使用 `exportArtifact()` 导出。

通过标准：

- AI message 数量增加。
- 老 artifact / 老气泡仍可见，且没有被原地篡改。
- 新气泡包含修改后的图。
- 图表确实改成折线或等价的线图表达。
- 数据被过滤到华东。
- 数据点数量减少。
- PDF 和 XLSX 导出完成，返回可用链接或记录。
- 没有出现 `Invalid Vizual artifact`。

可用检查：

```js
const before = window.getVizualConversationState();
// 执行追问改图流程
const after = window.getVizualConversationState();
after.messages.filter(m => m.role === 'ai').length > before.messages.filter(m => m.role === 'ai').length;
```

### S3. 容器适配与气泡宽度

检查 S1/S2 生成的图表布局。

通过标准：

- 图表内容居中，或干净地填满可用视觉区域。
- 不能有明显右侧空白、偏移、固定宽度造成的死 padding。
- 气泡宽度合理：
  - 普通图表：`wide`
  - dashboard / layout / table / doc：`full`
  - 小 KPI / sparkline：必要时可用 `normal` 或 `compact`
- `.viz-wrap` 不能把所有 artifact 都锁死成固定 `400px` 最小宽度。
- Sankey / Radar / FormBuilder 在普通桌面视口下不能被裁切。

### S4. ComboChart 多序列回归

用户输入：

```text
做一个收入与 ARPPU 的组合图：左轴 revenue，右轴 ARPPU，revenue 用柱状，ARPPU 用折线。不要让第二条线变成 0。

数据：
D1 revenue=12000 paying=300
D2 revenue=13800 paying=320
D3 revenue=15500 paying=340
D4 revenue=17300 paying=360
D5 revenue=18800 paying=370
D6 revenue=19700 paying=365
D7 revenue=20100 paying=350
D8 revenue=19400 paying=320
D9 revenue=18100 paying=285
D10 revenue=16600 paying=245
```

计算规则：

- `ARPPU = revenue / paying`

通过标准：

- ComboChart 渲染成功。
- 第二条折线不是 0 直线。
- tooltip 或 series 值显示 ARPPU 大约在 40-68，而不是 0。
- 双轴选择合理、可读。

### S5. 实时交互控件与兼容选项

用户输入：

```text
做一个可以实时调参的图表：左边是控制面板，右边是预览。
控制项：
1. 数据点数量 3-15
2. 图表类型：柱状图、折线图、组合图
3. 平滑折线，只在折线图和组合图时有意义
4. 堆叠模式，只在柱状图时有意义
5. 品牌主色

要求控件改动后右边立即变化。不要出现和当前图表类型不兼容的选项误导用户。
```

期望行为：

- 使用 `renderInteractiveVizInMsg(id, config)`。
- FormBuilder 使用 `value: { "$bindState": "/controls" }`。
- 使用 `makeSpec(state)` 重新生成右侧预览。
- 对不兼容控件做条件显示、禁用或清晰处理。
- 品牌色用 `applyTheme` 或 `Vizual.loadDesignMd()`。

通过标准：

- 左侧控制面板出现。
- 右侧预览图出现。
- slider 改变数据点数量。
- 图表类型切换会改变预览组件或图表配置。
- 平滑折线只影响折线图/组合图。
- 堆叠模式只影响柱状图。
- 品牌色变化能更新图表主题/颜色。
- `getInteractiveVizState()` 能看到当前 controls 和 `lastPreviewSpec`。

稳定的程序化测试：

```js
const state0 = window.getInteractiveVizState('last');
window.updateInteractiveVizInMsg('last', {
  controls: { points: 9, chartType: 'line', smooth: true, brandColor: '#123456' }
}, { immediate: true });
const state1 = window.getInteractiveVizState('last');
({
  controls: state1.state.controls,
  previewType: state1.lastPreviewSpec?.elements?.chart?.type || state1.lastPreviewSpec?.type,
});
```

### S6. 品牌色与 Design.md 契约

用户输入：

```text
把这个 dashboard 套成品牌视觉：主色 #FF6B35，深色背景，不要只改 theme 字段。之后让我可以用颜色选择器实时改主色。
```

期望行为：

- 使用 `Vizual.loadDesignMd()` 或 interactive `applyTheme`。
- 不能把 chart `theme` 当成品牌色注入机制。
- `theme: "dark"` / `theme: "light"` 只表示预设明暗主题。

通过标准：

- 初始品牌色可见。
- 改 color picker 后图表颜色可见变化。
- debug state 或 interactive state 能体现当前品牌色。

### S7. DocView 只能用于可批注文档

Prompt A：

```text
给我做一个普通的经营分析 dashboard。
```

通过标准：

- 不应该使用 DocView。
- 应使用普通聊天文字 + GridLayout / charts / tables。

Prompt B：

```text
把刚才的分析变成一份可以批注、可以让 AI 根据批注修订的报告。
```

通过标准：

- 此时应该使用 DocView。
- `showPanel: true`。
- 重要 section 有稳定 `id`。
- section 包含 heading / text / kpi / chart / table / markdown 等合适类型。
- 在 `vizual-test.html` 里测试时，使用 `renderDocViewInMsg()`。

### S8. DocView 批注与修订闭环

在 S7 的 DocView 中，选择类似下面的段落：

```text
下一步行动：对 AI 占比 30% vs 40% 做为期 7 天的 A/B 对照实验；分群分析流失用户画像；监控用户内容反馈 NPS。
```

添加批注：

```text
写详细一点，给出负责人、优先级、验收指标。
```

期望行为：

- 批注提交时带有 section / target metadata。
- 如果选中文本属于某个 section，不能变成 orphaned / 孤立。
- Agent 能读取已提交的批注线程。
- Agent 能提出或应用修订。
- 修订后 DocView 内容更新。

通过标准：

- 批注可以提交。
- 批注面板里能看到选中文本和目标上下文。
- 修订后文本变得更详细。
- 旧高亮/旧批注标记不会污染新正文。
- 如果渲染失败，错误提示要有明显背景和可操作说明。

### S9. 导出能力

分别测试普通图表/dashboard artifact 和 DocView artifact 的导出。

要求格式：

- PNG
- PDF
- CSV
- XLSX

通过标准：

- 导出返回可用链接或记录。
- PNG/PDF 包含渲染后的视觉内容。
- PDF 不能有明显异常的大白边。
- CSV/XLSX 在存在表格数据时包含正确 rows/columns。
- 导出动作不能改变原 artifact 内容。

### S10. 错误处理

故意输入一个 invalid artifact 或 invalid spec，观察 UI。

通过标准：

- 错误提示可见，并且有明显背景。
- 错误文案说明失败原因。
- 页面不能崩溃。
- 后续再渲染合法内容仍然正常。

### S11. 主页面代表性视觉抽查

仍然只在 `vizual-test.html` 里测试。用户会在同一个聊天页面输入几个较难的可视化需求，被测 Agent 需要监听并响应。

通过标准：

- 被测 Agent 没有离开 `vizual-test.html`。
- 所有结果都出现在用户正在看的同一个聊天页面。
- 每个结果都是真实渲染的 Vizual UI，不是 raw JSON。
- 需要截图或人工可见证据，但不需要跳到 `eval-full-31.html`。
- 没有 console error。

建议覆盖这些曾经出过问题的组件和图形语义：

- 相关性：生成 `ScatterChart`，必须看到散点，不能只有坐标轴。
- 分布：生成 `BoxplotChart` 或 `HistogramChart`，箱线/多柱必须可见，不能退化成 unknown / 0 / 单柱。
- 时间日历：生成 `CalendarChart`，如果用户指定某月，就应该是该月视图，不能把一个月的数据挤到全年日历里。
- 对比变化：生成 `DumbbellChart`，两个点之间应有连接；数值接近时连接会短，但不能完全没有。
- 双轴组合：生成 `ComboChart`，第二条线不能是 0 直线。
- 流程/关系：生成 `MermaidDiagram` 或 `SankeyChart`，不能空白，标签和流向应可见。

测试方式：

1. 用户在 `vizual-test.html` 聊天框输入上述需求。
2. 被测 Agent 用 `getPendingMessage()` 获取用户输入。
3. 被测 Agent 用 Vizual bridge 在同一个可见页面回复。
4. 用户肉眼确认结果；Agent 记录截图或 debug state。

`eval-full-31.html` 可以由维护者另行打开做组件库回归，但它不属于冷启动 Agent 的主线验收。

### S12. 宿主 API 稳定性

Agent 应该通过宿主 API 检查状态，而不是脆弱地抓 DOM 文本。

通过标准：

- 使用 `getVizualConversationState()` 检查 message / artifact 状态。
- 使用 `getVizualDebugState()` 检查 runtime / debug 状态。
- 使用 `getPendingMessage()` 获取用户原始输入，尤其是乱格式粘贴内容。
- 不依赖 `.message`、`.bubble`、大段 `innerText` 这类不稳定选择器。

## 负例清单

被测 Agent 必须明确避免这些错误：

- 不要使用 `InteractivePlayground`，它已经移除。
- 不要提 LiveKit 作为 Vizual 交互方案。
- 不要因为用户说“报告”就滥用 DocView。
- 不要在历史追问里原地修改老气泡。
- 不要假设 raw JSON spec 能自动完成实时交互。
- 不要用 `theme` 字段伪装品牌色注入。
- 不要展示与当前图表类型不兼容的控件。
- 不要生成第二条线全为 0 的 ComboChart。
- 不要把空白 Mermaid / Heatmap / Calendar / Scatter / Histogram 当成 PASS。
- 不要启动 headless / 不可见浏览器。
- 不要安装或下载 Playwright Chromium。
- 不要把测试改成纯脚本自动化。
- 不要跳去 `eval-full-31.html` 当主线测试。

## 最终 QA 报告格式

冷启动 Agent 应保存类似下面的 Markdown 报告：

```markdown
# Vizual 冷启动 QA 报告

目标页面：
读取的 skill 文件：
浏览器/CDP 目标：
测试时间：

## 总结

| 结果 | 数量 |
| --- | ---: |
| PASS | |
| FAIL | |
| SKIP | |

## 场景结果

| ID | 场景 | 结果 | 证据 |
| --- | --- | --- | --- |
| S0 | 宿主页面就绪 | PASS/FAIL | |

## 发现的问题

### F1. 标题

- 严重级别：
- 所属场景：
- 复现步骤：
- 预期：
- 实际：
- 证据：
- 疑似归属：skill / host bridge / runtime component / test script

## Console Errors

## 导出记录

## 截图或视觉证据
```

## 成功标准

vNext 冷启动验收只有在满足下面条件时才算通过：

- S0-S12 全部 PASS；如果有 SKIP，必须是浏览器能力缺失，而不是 Vizual 行为缺失。
- 没有 P0/P1 问题。
- 历史追问会生成新气泡。
- 实时控件能更新预览和 state。
- DocView 批注/修订闭环可用。
- 至少一个普通 chart/dashboard artifact 和一个 DocView artifact 能导出。
- S11 的代表性视觉抽查都在 `vizual-test.html` 的可见聊天页面完成。
- 被测 Agent 全程使用用户可见页面，不能用 headless 或用户看不到的新浏览器冒充验收。
