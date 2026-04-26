# Vizual vNext 冷启动盲测任务书

这份文档只给**被测 Agent** 使用。目标是验证：一个只读过 Vizual skill、没有项目上下文的 Agent，能否在 `vizual-test.html` 中独立完成真实对话式可视化工作。

注意：这不是答案文档，也不是评分标准。你需要自己读 Vizual skill、自己判断组件和交互方式、自己操作页面、自己生成报告。

## 绝对规则

1. 你只能读取：
   - `~/.claude/skills/vizual/SKILL.md`
   - `~/.claude/skills/vizual/references/` 下由 skill 指向、且当前任务确实需要的参考文件
2. 你不能读取：
   - Vizual 仓库源码
   - `COLD_START_ACCEPTANCE_GUIDE.md`
   - `validation/` 目录源码
   - 历史 QA 报告
   - git history
   - 当前实现对话记录
3. 你必须使用已经打开的可见页面：
   - `http://127.0.0.1:8793/validation/vizual-test.html`
4. 你只能连接现有 Chrome / Chrome DevTools MCP 页面。不要启动、重启、杀掉 Chrome。
5. 不要运行 `playwright install`、`npx playwright install`、`playwright install chromium` 或任何会下载浏览器的命令。
6. 不要启动 headless 浏览器，不要新开用户看不到的 Playwright Chromium。
7. 如果你通过 MCP 看不到 `vizual-test.html`，停止测试并报告环境问题，不要自己改浏览器环境。

## 你的测试方式

你要同时扮演“用户输入模拟器”和“接入 Vizual 的业务 Agent”：

1. 在可见的 `vizual-test.html` 聊天框里输入下面每一轮用户消息，并发送。
2. 通过页面宿主 API 读取待处理消息。
3. 按 Vizual skill 判断如何回复，并在同一个页面生成 AI 回复。
4. 每一轮都要让页面上出现真实渲染结果，不能只输出 raw JSON。
5. 每一轮结束后记录你做了什么、调用了什么 API、页面观察到什么。
6. 全部完成后保存一份 Markdown QA 报告。

优先使用页面宿主 API：

- `window.getPendingMessage()`
- `window.createAiMsg()`
- `window.streamText(id, text)`
- `window.finishText(id)`
- `window.renderVizInMsg(id, spec, options?)`
- `window.renderArtifactInMsg(id, artifact, options?)`
- `window.updateArtifactInMsg(ref, patches, options?)`
- `window.renderInteractiveVizInMsg(id, config)`
- `window.updateInteractiveVizInMsg(ref, patch, options?)`
- `window.getInteractiveVizState(ref?)`
- `window.renderDocViewInMsg(id, config)`
- `window.createDocViewThread(ref, input)`
- `window.submitDocViewThreads(ref, threadIds?)`
- `window.getDocViewReviewState(ref?)`
- `window.createDocViewRevision(ref, input)`
- `window.applyDocViewRevision(ref, proposalId?)`
- `window.getVizualConversationState()`
- `window.getVizualDebugState()`
- `window.getLastArtifact()`
- `window.exportArtifact(ref, options)`

关键语义：

- `getInteractiveVizState(ref?)` 返回 `{ artifact, state, lastPreviewSpec, renderCount }`；控件值在 `state.controls`，多个 interactive artifact 必须互相隔离。
- `createDocViewThread(ref, input)` 可用 `{ sectionId, selectedText, body }` 创建文本批注；也可加 `targetType` / `label` 创建图表、KPI、表格或整段批注。`anchor` 可省略，宿主会从 section 信息推断。
- `submitDocViewThreads(ref, threadIds?)` 省略 `threadIds` 时提交该 DocView 的所有 open threads。
- `getDocViewReviewState(ref?)` 返回的 `sections` 是顶层文档 sections；不要用 DOM 里 `[data-section-id]` 的数量判断 section 数，因为 KPI、图表、表格会展开成多个可批注目标。
- `exportArtifact(ref, options)` 导出的是指定 artifact 的渲染面，不是整页聊天记录。

不要依赖 `.message`、`.bubble` 这类脆弱选择器。需要检查 DOM 时，优先使用稳定属性：`data-message-row`、`data-ai-msg`、`data-user-msg`、`data-viz-container`、`data-artifact-id`。

## 测试输入

请按顺序完成 9 轮输入。每轮都必须真的写入页面聊天框并发送，不要直接跳过用户输入流程。

### T1. 乱格式数据 Dashboard

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

注意：不要只复述数据，要给我业务判断，也要提醒哪些地方不能直接下因果结论。
```

### T2. 历史追问改图并导出

```text
把刚才的 dashboard 里主趋势图改成折线图，只看华东区，数据点少一点，然后导出 PDF 和 XLSX。
```

### T3. 实时可调图表

```text
做一个可以实时调参的图表：我想用控件调数据点数量、图表类型、是否堆叠、主色。右侧要实时预览，改控件以后图表马上变化。
```

### T4. 品牌色实时切换

```text
把刚才的实时图表改成我们品牌风格：主色 #FF6B35，背景深色。再给我一个颜色选择器，我改颜色的时候图表也要一起变。
```

### T5. 组合图计算

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

计算规则：ARPPU = revenue / paying
```

### T6. 复杂图表视觉抽查

```text
请在同一条回复里做 5 个小图，分别展示：
1. 散点关系：x 是 AI 内容占比，y 是流失用户数
2. 分布：用一组用户消费金额画分布图
3. 日历：只展示 2026 年 4 月每天的活跃情况
4. 前后对比：用 dumbbell 展示 5 个区域改版前后的转化率
5. 流程：用 Mermaid 或 Sankey 展示“取数 → 分析 → 可视化 → 批注 → 修订 → 导出”
```

### T7. DocView 报告与批注

```text
把这份增长分析做成一份可以批注和修订的 DocView 报告。报告里要有标题、摘要、KPI、图表、表格、下一步行动。生成后请模拟我选中一段“下一步行动”的文字，添加批注：写详细一点。
```

### T8. DocView 修订循环

```text
根据刚才的批注修订 DocView：把“下一步行动”扩写得更具体，然后把已解决的批注处理掉。修订后不要保留旧的错误提示或失效标记。
```

### T9. 最终导出与状态检查

```text
导出当前普通图表或 dashboard，再导出当前 DocView。最后给我总结：这次对话里生成了哪些可视化，哪些可以继续追问修改，哪些可以导出。
```

## 报告要求

完成后保存 Markdown 报告。报告必须包含：

```markdown
# Vizual 冷启动盲测报告

测试时间：
目标页面：
读取的 skill 文件：
是否读取了禁止文件：
浏览器连接方式：

## 总结

| 场景 | 结果 | 主要 API | 备注 |
| --- | --- | --- | --- |
| T1 | PASS/FAIL | | |

## 每轮详情

### T1

- 用户输入：
- 读取的参考文档：
- 使用的 Vizual 能力：
- 调用的页面 API：
- 页面观察结果：
- debug state 摘要：
- console errors：
- 截图或 DOM 证据：
- 结果：PASS/FAIL

## 导出记录

## 残留问题

## 你认为 skill 或宿主 API 还不清楚的地方
```

## 判定原则

你不能只看页面上的 “Rendered” 字样。你需要结合：

- 页面实际视觉结果
- `getVizualConversationState()`
- `getVizualDebugState()`
- console error
- 导出结果
- 交互控件状态
- 历史气泡是否保留
- DocView 批注和修订是否形成闭环

只要真实渲染或交互有问题，就应该记为 FAIL 或 PARTIAL，并写明原因。
