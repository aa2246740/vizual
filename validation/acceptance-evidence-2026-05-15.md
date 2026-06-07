# Vizual x A2UI 验收证据

日期：2026-05-15
分支：`feature/a2ui-protocol`

## 口径修正

`validation/vizual-test.html?cold-start-codex=...` 是固定 host/runtime 回归页。它内部包含 T1-T12 的脚本分支，因此不能单独作为最终“真实 Agent 验收”证据。

最终验收必须包含：

- 真实外部 Agent 回复；
- 真实浏览器渲染；
- 可见 artifact 的人工/浏览器输入交互；
- 导出、DocView 审阅/修订、A2UI 对抗场景；
- 人眼检查截图质量。

## 自动化检查

- `npm test`：通过，34 个文件 / 239 个测试。
- `npm run typecheck`：通过。
- `npm run build`：通过，生成 ESM、CJS、类型声明和 standalone bundle。

## 真实 GPT-5.3 冷启动验收

- 命令：`node validation/real-agent-cold-start-runner.mjs --run 20260515-real-agent-final-r2 --out /tmp/vizual-core-validation --base http://127.0.0.1:8793 --max-scenarios 4`
- 模型：`gpt-5.3-codex`
- 汇总：`/tmp/vizual-core-validation/real-agent-cold-start-20260515-real-agent-final-r2.json`
- 结果：4 pass / 0 fail。

覆盖场景：

- `T1-real-dashboard`：外部 Agent 生成 dashboard；浏览器审计通过：4 个 canvas、13 行表格、0 溢出、0 错误。
- `T2-real-followup-update-export`：外部 Agent 生成追问更新后的折线图 dashboard；PDF 和 XLSX 导出成功；浏览器审计通过：4 个 canvas、7 行表格、0 溢出。
- `T3-real-docview-review`：外部 Agent 生成 root `DocView`；raw audit 强制要求 5+ DOM 表格行，并出现 `审阅`、`留存`、`因果`；浏览器审计通过：6 行表格；PDF/XLSX 导出成功；DocView 批注创建、提交、修订提案、应用全部通过。
- `T4-real-a2ui-interactions`：外部 Agent 生成 A2UI 交互卡片；浏览器修改文本输入、滑块、选择器、复选框，并点击按钮/Tabs；审计通过：4 个表单输入、4 个动作按钮。

截图：

- `/tmp/vizual-core-validation/real-agent-cold-start-20260515-real-agent-final-r2-T1-real-dashboard.png`
- `/tmp/vizual-core-validation/real-agent-cold-start-20260515-real-agent-final-r2-T2-real-followup-update-export.png`
- `/tmp/vizual-core-validation/real-agent-cold-start-20260515-real-agent-final-r2-T3-real-docview-review.png`
- `/tmp/vizual-core-validation/real-agent-cold-start-20260515-real-agent-final-r2-T4-real-a2ui-interactions.png`

## 浏览器回归

- 命令：`node validation/cdp-browser-acceptance.mjs --run 20260515-browser-final-r1 --out /tmp/vizual-core-validation --base http://127.0.0.1:8793 --headless true`
- 汇总：`/tmp/vizual-core-validation/browser-acceptance-20260515-browser-final-r1.json`

结果：

- 固定冷启动 host 回归：14 pass / 0 fail，`done=true`，18 条导出记录。
- A2UI full acceptance 页面：28 pass / 0 fail / 28 total。
- A2UI adversarial 页面：20 pass / 0 fail / 20 total。
- Full 31 component 页面：31 pass / 0 fail / 31 total。

截图：

- `/tmp/vizual-core-validation/cold-start-20260515-browser-final-r1.png`
- `/tmp/vizual-core-validation/a2ui-full-acceptance-20260515-browser-final-r1.png`
- `/tmp/vizual-core-validation/a2ui-adversarial-20260515-browser-final-r1.png`
- `/tmp/vizual-core-validation/eval-full-31-20260515-browser-final-r1.png`

## 浏览器输入交互验收

Headless Chrome：

- 命令：`node validation/manual-human-input-acceptance.mjs --run 20260515-human-input-cua-r5 --out /tmp/vizual-core-validation --base http://127.0.0.1:8793 --headless true`
- 汇总：`/tmp/vizual-core-validation/manual-human-input-acceptance-20260515-human-input-cua-r5.json`
- 截图：`/tmp/vizual-core-validation/manual-human-input-acceptance-20260515-human-input-cua-r5.png`
- 结果：12 pass / 0 fail。

可见 Chrome 窗口：

- 命令：`node validation/manual-human-input-acceptance.mjs --run 20260515-human-input-headed-r1 --out /tmp/vizual-core-validation --base http://127.0.0.1:8793 --headless false`
- 汇总：`/tmp/vizual-core-validation/manual-human-input-acceptance-20260515-human-input-headed-r1.json`
- 截图：`/tmp/vizual-core-validation/manual-human-input-acceptance-20260515-human-input-headed-r1.png`
- 结果：12 pass / 0 fail。

覆盖内容：

- 等待完整冷启动页面结束后再做输入测试：固定 runner 为 14 pass / 0 fail，18 条导出记录。
- 按 artifact id 精准定位真实 `a2uiKitchenSink` artifact，不再误点页面上第一个输入框。
- 使用真实 Chrome 输入事件覆盖：按钮点击、复选框切换、文本输入、选择器键盘交互、滑块拖动、日期键盘修改、Tabs 切换、DocView 点击路径、导出工具栏点击路径。
- A2UI artifact probe 记录到 30 个浏览器输入事件。
- 状态变化：复选框 `false -> true`，文本输入追加人工验收文本，滑块 `75 -> 90`，日期 `2026-05-16 -> 2028-05-16`，页面无可见渲染错误。

边界：

- Codex in-app Browser CUA 的 `type` 动作先尝试过，但当前环境返回 `Browser Use virtual clipboard is not installed`。
- 替代验收采用 Chrome CDP 的 `Input.dispatchMouseEvent`、`Input.dispatchKeyEvent`、`Input.insertText`。这是浏览器真实输入事件测试，但不是 macOS Accessibility 层的鼠标键盘控制。

## 发现并修复的问题

- 固定 `vizual-test.html` 一开始被当成过强验收依据。现已明确：它只算回归页，真实 GPT-5.3 冷启动证据单独记录。
- 工具栏导出审计曾误找复用 artifact id 的旧气泡，并且没有正确统计真实导出事件。已修复 `findArtifactContainer` 和工具栏审计逻辑。
- 浏览器验收曾在第一个固定失败处停止，可能掩盖后续场景。现在会等待 runner 完整结束。
- 真实 DocView 输出暴露过裸 `\n`。已在 DocView 文本、callout、table fallback、markdown renderer、A2UI `Text` 中做文本规范化；审计现在会拒绝裸 `\n`、`\r`、`\t` 和 `[object Object]`。
- 真实 GPT final r1 曾因为 DocView 表格太薄、可见文本缺少 `审阅` 而失败。没有降低门槛，而是收紧 prompt 和 raw audit，final r2 通过。
- 早期真实 GPT smoke 暴露了常见别名和布局风险：`Text.text`、`KpiDashboard.items`、`DataTable.rows`、图表 `xField/yFields/barSeries/lineSeries`、危险 12 列 grid。相关兼容和布局 fallback 已由测试和浏览器跑通覆盖。
- 人工输入脚本起初缓存坐标，滚动后坐标失效，导致误点 A2UI FreeformHtml 区域。现已改为每一步输入前重新滚动并重新查询目标。
- Chrome 原生 date input 不接受 `Input.insertText`，现改为键盘增量事件验证日期控件。

## Open Design Daemon 复用判断

可以复用 OD daemon，且更符合最终“真实 Agent 回复我”的验收方式。

复用目标：

- 用 OD daemon 负责本地 CLI Agent 发现、启动、SSE、取消、cwd、skill、design system、模型参数；
- 用 Vizual 页面负责 A2UI/Vizual JSON 解析、渲染、交互、导出、DocView；
- 用户验收时应在页面输入自然语言，由 daemon 调真实 Agent 回复，再渲染结果。

当前固定回归页不能替代这条最终验收链。

## OD daemon 最终长测

主验收入口：

```text
http://127.0.0.1:8794/validation/daemon-vizual-chat.html
```

启动命令：

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare
node validation/daemon-acceptance-server.mjs --port 8794 --daemon http://127.0.0.1:7456
```

页面链路：

```text
用户自然语言输入 -> /od-daemon/api/runs -> OD daemon -> Codex CLI gpt-5.3-codex -> SSE -> A2UI/Vizual JSON -> Vizual runtime 渲染
```

最后一次真实页面验收：

- runId：`f6e005b8-53e5-4b72-85d9-0976427b0cbc`
- 页面状态：`run succeeded`
- 视觉审计：通过，内容宽度使用率 `0.96`，底部空白 `0.05`，0 溢出，按钮背景不透明。
- 交互审计：通过，文本输入改为 `Codex真实验收-增长活动B`，滑块改为 `45`，下拉改为 `7日留存`，复选框切为 `false`，按钮点击后 `data-clicked=true`。
- 截图：`/tmp/vizual-core-validation/daemon-page-real-agent-f6e005b8-after-interaction.png`

最终 3 场景 daemon runner：

- 命令：`node validation/od-daemon-real-agent-runner.mjs --run 20260515-od-daemon-long-r5 --out /tmp/vizual-core-validation --base http://127.0.0.1:8793 --daemon http://127.0.0.1:7456 --agent codex --model gpt-5.3-codex --reasoning medium --max-scenarios 3`
- 汇总：`/tmp/vizual-core-validation/od-daemon-real-agent-20260515-od-daemon-long-r5.json`
- 结果：3 pass / 0 fail。

覆盖场景：

- `OD1-daemon-dashboard`：真实 Agent 输出 dashboard；3 个 canvas、11 行表格、KPI、明细表、DocView 业务判断；0 溢出、0 错误。
- `OD2-daemon-followup-export`：真实 Agent 基于上一轮追问更新；折线图、行动建议表；PDF 导出成功，大小 `19662701`；XLSX 导出成功，5 行。
- `OD3-daemon-a2ui-interactions`：真实 Agent 输出 A2UI 交互卡片；TextField、Slider、ChoicePicker、CheckBox、Button、Tabs 全覆盖；浏览器输入事件修改文本、滑块、下拉、复选框并点击按钮；0 溢出、0 错误。

最终长测截图：

- `/tmp/vizual-core-validation/od-daemon-real-agent-20260515-od-daemon-long-r5-OD1-daemon-dashboard.png`
- `/tmp/vizual-core-validation/od-daemon-real-agent-20260515-od-daemon-long-r5-OD2-daemon-followup-export.png`
- `/tmp/vizual-core-validation/od-daemon-real-agent-20260515-od-daemon-long-r5-OD3-daemon-a2ui-interactions.png`

本轮真实 daemon 测试暴露并修复的问题：

- Agent 会用 `type` 代替 `component`：`A2UIBridge` 已兼容。
- Agent 会用 `payload.components`、`dataModel`、直接 `path`、`textPath`、`optionsPath`：已归一化到 Vizual 可渲染 props。
- DataTable 会用 `field/title`，ComboChart 会用 `barField/lineField`，PieChart 会用 `nameField/valueField`：已兼容。
- `gridColumn: "1 / span 7"` 以前不会被 GridLayout 识别，导致竖排和大片空白：已解析为 spans。
- `GridLayout columns: 12` 但只有 1-3 个 children 时，以前会被挤到 1/12 宽：已自动铺成全宽/半宽/三等分。
- standalone 页面缺少 `--rk-accent` 等 CSS 变量时，按钮会透明白字：`tcss()` 现在输出 CSS var fallback。
- Card 的 `title/subtitle`、Text 的 `value`、KPI 的 `name/unit/change`、DocView 的字符串 sections 已做兼容。

## 剩余边界

当前分支仍隔离在 `feature/a2ui-protocol`，没有合入主分支。用户正式验收前不应影响本地正在使用 Vizual core 的项目。
