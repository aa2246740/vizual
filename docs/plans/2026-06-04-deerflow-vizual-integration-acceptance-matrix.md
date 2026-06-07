# DeerFlow Vizual Integration Acceptance Matrix

日期：2026-06-04

## 目标

这份矩阵用于验收 DeerFlow 接入 Vizual Native Core 后，是否真正覆盖 Vizual、A2UI、AG-UI、stream 和 Agent 互动回传。

它区分两类证据：

- 自然语言浏览器验收：用户只给普通任务，不点名协议、组件、tool 或 payload。Agent 自主决定是否使用 Vizual。通过真实浏览器观察可见渲染、文字混排、action/event 和负向边界。
- 协议合约验收：直接给 Native Core 或 Host tool 传 Vizual/A2UI/AG-UI/stream payload。这不是替 Agent 做判断，而是验证接入层不会把协议形状改坏。

不能把协议合约测试当成自然语言验收；也不能把自然语言里 Agent 没刚好产出 AG-UI wire format 当成 AG-UI runtime 不支持。

## 验收矩阵

| ID | 能力面 | 输入方式 | 验收任务 | 必须观察到的证据 |
| --- | --- | --- | --- | --- |
| N1 | Vizual 自然数据分析 | 自然语言 | 给一组经营数据，让 Agent 分析收入增长但利润下降并用图表证明 | Agent 自主调用 `present_vizual_ui`；浏览器中可见图表/表格；结论文字和 UI 在同一回答上下文里出现 |
| N2 | Vizual 概念互动解释 | 自然语言 | 让 Agent 解释二分查找、梯度下降、现金流敏感性等可交互概念 | 出现有用的 slider/form/button 或可视状态；互动能改变本地状态或回传 Agent，而不是装饰按钮 |
| N3 | Agent action roundtrip | 自然语言 + 浏览器点击 | 在已渲染 UI 中触发 drill-down、filter、submit 或 next-step | 页面记录 action/event；DeerFlow 产生后续用户消息或 Agent 继续回复；回传内容包含 surfaceId/action/params |
| N4 | Text-only 负向 | 自然语言 | 用户明确要求只用文字，或提出短事实/改写类请求 | 不出现 Vizual surface；回答仍可用；没有为了展示能力强塞 UI |
| N5 | 显式网页/HTML 负向 | 自然语言 | 用户明确要求 landing page、HTML、React、游戏、文件 artifact | 走对应创作/文件路径；不强制进入 Vizual Native |
| N6 | 失败吸收 | 自然语言或坏 payload | Agent 产出未知组件、部分字段缺失或渲染风险 | 对话不崩；能显示 fallback/degraded 或保留文字答案；错误进入证据而非吞掉整轮回复 |
| C1 | Vizual native | 协议合约 | 传 native root/elements、operation 或 flat spec | Native Core preview/render 通过；Host tool envelope 原样保留 native input |
| C2 | A2UI surface lifecycle | 协议合约 | `createSurface -> updateDataModel -> updateComponents -> appendDataModel` | 同一 surface 增量更新；数据追加后图表/表格数据同步 |
| C3 | A2UI primitives/actions | 协议合约 | A2UI Button/TextField/ChoicePicker/Slider/FormBuilder 等控件 | 归一到 Native Catalog；action 名称和参数可回传 Host |
| C4 | AG-UI messages/tool/activity | 协议合约 | `TEXT_MESSAGE_*`、`MESSAGES_SNAPSHOT`、`ACTIVITY_SNAPSHOT`、`TOOL_CALL_ARGS/CHUNK/END` | message/reasoning/tool args 被 native core 接收；嵌入的 A2UI operations 渲染为同一 native surface |
| C5 | Stream | 协议合约 | JSONL A2UI 增量流和 SSE AG-UI + A2UI activity 流 | 不完整 chunk 不提前渲染；完整行/event 到达后才更新 surface |
| C6 | Host tool preservation | 协议合约 | `present_vizual_ui` 收到 A2UI list、AG-UI single event、AG-UI event array | 工具层只包装 envelope，不把 AG-UI event 错当组件、不改坏 A2UI/stream payload |

## 当前已验证

截至 2026-06-04：

- `vizual-compare` 本地测试已覆盖 C1、C2、C3、C4、C5 的协议合约路径，并新增 native core 覆盖一致性测试：catalog manifest、React registry、validator renderable 白名单和 gallery fixture 必须同为 52 个组件。
- Native lifecycle 本地测试已覆盖 `theme.update`、`error.report`、`surface.recovery` 的 retry/fallback/无效 fallback、`quality.report`、action subscriber 异常隔离、Host callback 异常吸收、`surface.reset`、`surface.delete`。
- Native data model 本地测试已覆盖 root-level append、path append、对象字段删除、数组项删除、缺失路径 no-op。
- Native validation 本地测试已覆盖 `no renderable surface`、root 缺失、empty elements、children 循环这些进入 renderer 前必须发现的问题；`requireRenderable: false` 的 text-only 输入不会被强行判成必须出 UI。
- Chart validation matrix 已覆盖 Scatter/Bubble/Calendar/Heatmap/Pie/Funnel/Waterfall/Xmr/Sparkline/Histogram/Boxplot/Dumbbell/Sankey 字段规则，以及字段存在但非数值的错误证据。
- 失败吸收本地测试已覆盖：未知 AG-UI 事件只进 event log、不破坏消息；坏的 visual update 产生 recoverable error 证据，但已有文字结论保持完整。
- Quality finding -> validation warning 已覆盖：fallback/gap 证据会进入 validation issues，但不让可见 fallback 输出失败。
- Unsupported raw input no-op 已覆盖：无法识别的原始输入不会偷偷创建 hidden surface 或 operation。
- Native public SDK 本地测试已覆盖 `dispatchAll`、`process`、`processA2UIMessage(s)`、`processAGUIEvents`、`processVizualSpec`、`updateSurfaceDataModel`、`resetSurface`、getter、callback 和 action unsubscribe，确保公开入口都回到同一 native reducer。
- Native stream 本地测试已覆盖 JSONL、SSE、`format:auto` 自动识别、半包等待、`end()` flush、`reset()` 丢弃半包、`Uint8Array` chunk、OpenAI chat/Responses text delta、Anthropic-style `message_stop`、空 chunk/空行/SSE comment/无 data SSE/半截 JSON 防误渲染、record/input/snapshot 回调顺序。
- Assistant message fallback 本地测试已覆盖：完成的 assistant message content 如果是 A2UI operations JSON，native core 会提取并生成 surface；尾部缺失闭合括号但可修复的 JSON 也会先 repair 再提取。
- A2UI message 入口本地测试已覆盖 standard/loose `createSurface`、`updateComponents`、`updateDataModel`、`appendDataModel`、`deleteSurface`、`callFunction`、`actionResponse`、`updateTheme`、`errorRecovery`，以及 legacy `beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`action/userAction`。
- A2UI generic wrapper 本地测试已覆盖 `rootId` 不是 canonical `root` 时自动包装为 `root -> rootId`、rootless loose `updateComponents` 自动合成 canonical `root`、parentId 提示不匹配时仍保留可见组件，避免 agent 自然输出造成空白 surface。
- Semantic shorthand 本地测试已覆盖 dashboard 中的 metrics/charts/tables/risks/actions/forms、semantic data-rich records、semantic 重复 child id 去重、direct text-card KPI 自动合成、direct inline child id 去重、inline child object 展开、常见组件 alias 矩阵；native data component string binding 已覆盖 `data: 'rows'` 解析成真实数据，非 binding 数据字符串不会被误造 path；chart validation 已覆盖字段缺失和字段非数值两类错误证据。
- A2UIBridge 薄桥本地测试已覆盖 getter、artifact/data/theme/error/surface state、`updateSurfaceDataModel`、`resetSurface`、action callback/unsubscribe，避免旧 A2UI SDK 入口形成半套实现。
- AG-UI 33 个事件名和 AGenUI 25 个 catalog component 已收进共享 fixture；unit matrix 会读取浏览器矩阵 HTML 常量做一致性校验，Fusion `AGUIEventType` 也收口到这组事件 union，而不是裸 `string`。
- Native operation union 和 reducer switch 已有防漂移测试：新增 `VizualNativeOperation` type 但漏掉 reducer case 时本地 gate 会失败。
- 本地全量命令已通过：`npm test -- --run`，结果 `49 passed / 473 passed`；`npm run typecheck -- --pretty false` 通过；`npm run build` 通过；3 个 CDP runner 的 `node --check` 通过。
- Native Core 覆盖率证据：`npx vitest run --coverage --coverage.include='src/native-core/**/*.{ts,tsx}' --coverage.reporter=json-summary --coverage.reporter=text --coverage.reportsDirectory=/tmp/vizual-native-core-coverage-detail` 通过；native-core include 范围行覆盖 `100%`、函数覆盖 `100%`，其中 `core.ts`、`validate.ts`、`normalize.ts`、`preview.ts`、`stream.ts` 都是 100% 行覆盖。
- Native gallery 旧浏览器证据：`validation/artifacts/native-core-gallery-2026-06-04T03-32-59-949Z/summary.json`，`52 pass / 0 fail / 52 total`。
- Native protocol matrix 正向旧浏览器证据：`validation/artifacts/native-protocol-matrix-2026-06-04T03-34-17-611Z/summary.json`，`7 PASS`。`validation/artifacts/native-protocol-matrix-2026-06-04T03-34-43-489Z/summary.json` 是带 `break-agui-events=1` 的负向自检，故意少喂一个 AG-UI event，失败是预期结果，不能当作正向回归。
- CDP 验收脚本安全边界已补：`deerflow-natural-browser-runner.mjs`、`cdp-native-gallery-audit.mjs`、`cdp-native-protocol-matrix-audit.mjs` 默认关闭新建 CDP target；即使 WebSocket connect 失败也会尝试清理；只有显式 `--keep-tab` 或 `KEEP_CDP_TAB=true` 才保留页面。
- CDP 自然语言证据审计器已补：`validation/deerflow-evidence-audit.mjs` 只读 `result.json`、summary、thread state 和截图文件，按显式 expectation 审计 evidence 是否足够；它不替 Agent 做自然语言意图判断，也不按关键词决定是否应该调用 Vizual。
- Native Core 完整性审计器已补：`validation/native-core-completion-audit.mjs --allow-pending` 当前输出 `pass=27 fail=0 pending=5 complete=false`；默认不加 `--allow-pending` 会因 5 个自然语言浏览器复验缺口返回非 0，防止误把目标标完成。
- DeerFlow 后端 `present_vizual_ui` 工具测试已覆盖 C1、C2、C3、C4、C5、C6 的包装/保留边界。
- DeerFlow 真实浏览器 N1 证据：`deerflow-natural-n1-pet-hospital-growth-profit-data-viz-2026-06-04T05-40-52-106Z`，线程 `0d86eae9-d2dc-4600-b0c2-46df6b876a64`，页面有 Vizual surface、5 个 canvas 和 1 个 table。
- DeerFlow 真实浏览器 N3 证据：`deerflow-natural-n3-smart-curtain-triage-centered-click-2026-06-04T05-22-46-252Z`，线程 `fea668f2-dae4-4bb4-9a09-75f399920d5a`，点击后 state 从 4 条消息增长到 8 条，最后一条仍为 AI。
- 历史证据审计结果：`deerflow-evidence-audit.mjs` 对当前选中的旧产物判定 N1/N3/N4 可作为历史证据；N2 二分查找互动旧轮次失败，因为是 fallback surface、没有真实控件、缺交互后截图；N5 显式 HTML 旧轮次失败，因为 run timeout。
- N2 在后续测试中暴露过 A2UI wrapper/content-object 形状失败，相关工具层修复已完成，但最新 content-object 修复后的浏览器轮次被中断，只留下 `submitted-before-click.png`，不能算通过。
- N4、N5、N6 仍需要在单页签策略下重新做自然语言浏览器验收。

注意：A2UI、AG-UI、stream 当前已通过协议合约测试和 DeerFlow 工具层包装测试；还没有各自用自然语言端到端稳定诱发并在浏览器中完成全链路验收。这个差异不能混淆。

## 自然语言场景池

后续真实浏览器验收按场景池抽题，每次执行都基于旧类型改写成新题，避免先有结果再反推测试结论。测试输入不能点名 Vizual、A2UI、AG-UI、Native Core、tool、payload、component 名称。

| 场景 | 目标能力 | 示例输入方向 | 通过信号 |
| --- | --- | --- | --- |
| 经营诊断 | Vizual chart/table | 给多张经营表，要求找原因、风险和证据 | 图表、表格、文字结论混排；Agent 自主用 Vizual |
| 算法/概念实验 | Vizual + A2UI primitives | 解释二分查找、梯度下降、缓存命中率、排队模型，并要求可调参数 | slider/form/button 真实改变状态或触发回传 |
| 决策筛选 | A2UI actions | 给候选方案，让用户筛选权重或提交偏好 | action 参数有业务意义，并能进入 Agent 后续回复 |
| 长任务进度 | AG-UI activity/message | 要求 Agent 分步研究/比较/整理，并展示当前进度和阶段状态 | message/activity/tool 状态在 UI 中可见，不只是一段最终文本 |
| 增量数据流 | Stream | 给逐步到达的数据或要求边算边展示 | 不完整 chunk 不渲染；完整事件到达后 surface 增量更新 |
| 只要文字 | 负向 | 明确说只要文字、短事实、改写 | 不出现 Vizual surface |
| 明确网页/文件 | 负向 | 明确要 HTML、landing page、React app、可下载文件 | 走文件/artifact 路径，不强塞 Native |
| 渲染失败吸收 | 失败吸收 | 诱发较复杂/边缘组件表达 | 对话不崩，保留可读答案和 fallback/degraded 证据 |

## 下一步浏览器实测

下一轮真实浏览器验收必须补：

1. N2：用新的自然语言概念互动题重跑，确认 wrapper/content-object 修复后浏览器可见、可交互、无空白 surface。
2. N4/N5：明确只要文字、明确要 HTML/React/landing page/file artifact 的负向边界，确认不会强塞 Native。
3. N6：失败吸收，例如让 Agent 尝试表达一个 Native Catalog 没完全覆盖的展示需求，确认它降级后仍然保留有效文字答案。
4. AG-UI 自然语言端到端：设计不点名协议的长任务/进度/活动流场景，观察 Agent 是否能自然地产生适合 activity/message 的 inline UI。
5. Stream 自然语言端到端：设计逐步到达或多阶段更新的任务，观察浏览器中是否出现增量更新，而不是只看最终 JSON。

通过口径：

- 必须有真实浏览器截图或视觉指标。
- 必须有 thread URL、tool-call/state/action 证据。
- 对自然语言场景，只能在运行后判分，不能用预设脚本、正则或场景标签去决定 Agent 是否调用 Vizual。
- 下一轮不得批量打开浏览器页面；每次只允许一个 CDP target，脚本默认清理页面。需要保留给人工观察时，只能显式使用 `--keep-tab`。

## 单页签复验纪律

- 每轮只跑一个自然语言任务，任务文本在执行前才写入临时 prompt 文件；不能把预期 JSON、组件名、协议名或答案结构写进 prompt。
- 默认不保留页面。需要给用户看页面时，只允许当前这一轮显式加 `--keep-tab`，并在下一轮开始前确认旧 target 已关闭。
- 底层 `deerflow-natural-browser-runner.mjs` 默认会在创建新 target 前检查 CDP `/json/list`；如果已经存在 DeerFlow 页面，默认拒绝继续，避免重复开页。确实需要绕过时必须显式传 `--skip-target-preflight`。
- 每轮结束后检查 `result.json`、截图、thread state、action log；如果缺少任一证据，该轮只能记为未通过或证据不足。
- 每轮结束后用 `validation/deerflow-evidence-audit.mjs` 审计产物；这个脚本只检查已产生的 evidence 是否足够，不替 Agent 判断自然语言意图，也不按关键词决定是否应该调用 Vizual。
- 每轮结束后检查本机状态：不得留下 `deerflow-natural-browser-runner`、`chrome.*9227`、DeerFlow dev server 或额外 CDP target。
- 自动化无法稳定操作时，改为用户在同一个 DeerFlow 页面手工输入任务；Agent 只监控后端 state、tool call、action log 和截图，不另开页面。

命令模板：

```bash
DEERFLOW_URL=http://localhost:2026 \
CDP_BASE=http://127.0.0.1:9227 \
node validation/deerflow-natural-browser-runner.mjs \
  --slug <fresh-case-slug> \
  --prompt-file /tmp/<fresh-natural-task>.txt \
  --wait-ms 240000
```

保留页面给人工观察时才加：

```bash
--keep-tab
```

证据审计示例：

```bash
node validation/deerflow-evidence-audit.mjs \
  --case n1:/path/to/deerflow-natural-.../result.json \
  --case n4:/path/to/text-only-result.json
```

生成新的自然语言复验任务：

```bash
node validation/deerflow-natural-task-generator.mjs --scenario n2 --out-dir /tmp
```

可选场景：`n2`、`n5`、`n6`、`activity`、`stream`。生成器只输出自然语言 prompt、单页 runner 命令、审计命令和 registry id；不写预期答案、不点名协议/组件/tool。

跑完单页浏览器后登记证据：

```bash
node validation/register-deerflow-evidence.mjs \
  --id deerflow.n2-concept-interaction-current \
  --target /path/to/deerflow-natural-.../result.json
```

登记后再跑：

```bash
node validation/native-core-completion-audit.mjs
```

如果登记的 result 通过对应 expectation，pending 会变成 pass；如果证据不足，会变成 fail。

或者使用单 pending 执行器。默认 dry-run，不打开浏览器：

```bash
node validation/run-deerflow-pending-evidence.mjs --scenario n2
```

确认后显式执行一轮：

```bash
node validation/run-deerflow-pending-evidence.mjs --scenario n2 --execute
```

执行器一次只处理一个 pending。它会生成 fresh 自然语言任务、调用单页 runner、跑 evidence audit；只有审计通过才写入 registry。

完整性审计示例：

```bash
node validation/native-core-completion-audit.mjs
```

该命令会把 Native Core 本地测试资产、coverage、browser matrix、DeerFlow 自然语言历史证据和仍需复验项汇总到同一份报告。只要 N2/N5/N6/AG-UI natural/Stream natural 仍缺当前浏览器证据，`complete=false`，默认返回非 0；如果只想确认本地证据资产没有坏，可以加：

```bash
node validation/native-core-completion-audit.mjs --allow-pending
```

审计口径：

- `n1` 必须有 thread、截图、可见 surface、图表/表格视觉证据、文字和 UI 同轮出现。
- `n2` 必须有 thread、截图、可见 surface、真实控件、交互后证据；fallback surface 不算通过。
- `n3` 必须有点击前控件、点击后截图、thread state 增长且 Agent 继续回复。
- `n4/n5` 必须回答可读、无 Vizual surface、无 `present_vizual_ui` 调用、无 timeout。
- `n6` 必须保留可读答案、无 load failure、无空白 surface；允许有降级证据，但不能吞掉整轮对话。
