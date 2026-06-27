# Vizual Native Core 原生协议覆盖矩阵

日期：2026-05-29  
分支：`feature/a2ui-protocol`

## 结论

应该用同一个 `VizualNativeCore` 原生处理 A2UI、AG-UI、AGenUI 和 Vizual spec，而不是维护三段桥接链路。三者本质都在表达同一组对象：surface、message、data model、component tree、action/function、quality finding。

因此本轮实现的验收标准是：每一种源输入都必须进入同一条 native operation reduce path，最终生成同一种 Vizual snapshot/spec，由真实 renderer 渲染。

## 来源核对

### A2UI

本地来源：

- `/Users/wu/Documents/vizual-research/a2ui/docs/reference/messages.md`
- `/Users/wu/Documents/vizual-research/a2ui/docs/reference/components.md`
- `/Users/wu/Documents/vizual-research/a2ui/specification/v0_9/json/catalogs/basic/examples/`

覆盖点：

- v0.8：`surfaceUpdate`、`dataModelUpdate`、`beginRendering`、nested component wrapper、typed value fields、`userAction`。
- v0.9：`createSurface`、`updateComponents`、`updateDataModel`、flat component object、literal/path binding、children array。
- Component：Row、Column、List、Text、Image、Icon、Divider、Button、TextField、CheckBox、Slider、DateTimeInput、ChoicePicker、Card、Modal、Tabs、Video、AudioPlayer。
- Dynamic children：`children.explicitList`、`children.template`、item scoped data binding。
- Action：Button event/function call -> native action -> subscriber callback。

### AG-UI

本地来源：

- `/Users/wu/Documents/vizual-research/ag-ui/sdks/typescript/packages/core/src/events.ts`

覆盖点：

- 完整 33 个 `EventType` 名称。
- Text message stream：start/content/chunk/end。
- Reasoning/thinking stream：旧 thinking 事件和新 reasoning 事件。
- Tool call：start/args/chunk/end/result，包含 tool args 里嵌入 A2UI payload。
- State/activity/messages snapshot 和 delta。
- Run/step/raw/custom/error 事件不应导致 native core 崩溃。

### AGenUI

本地来源：

- `/Users/wu/Documents/vizual-research/_external/AGenUI/README.md`
- `/Users/wu/Documents/vizual-research/_external/AGenUI/agenui_catalog.json`
- `/Users/wu/Documents/vizual-research/_external/AGenUI/playground/resource/stories/A2UI Show/`

覆盖点：

- 25 个 catalog components：Text、Image、Icon、Video、AudioPlayer、Row、Column、List、Card、Tabs、Modal、Divider、Button、TextField、CheckBox、ChoicePicker、Slider、DateTimeInput、RichText、Lottie、Table、Web、Markdown、Chart、Carousel。
- AGenUI extensions 映射为 Vizual native render targets，不引入移动端 renderer。
- Chart 支持 `bar`、`line`、`donut`、`bar_grouped` 的 `xAxis + series[].data[]` 结构。
- Table 支持 columns + rows。
- Markdown/RichText/Web/Lottie/Carousel 必须有可见降级，不允许整块空白。

## 新增测试资产

- Unit matrix：`src/native-core/protocol-matrix.test.ts`
- Browser matrix：`validation/native-protocol-matrix.html`
- User acceptance：`docs/USER_ACCEPTANCE_CN.md`

## 不采纳的方向

- 不把 AGenUI 的移动端 C++/Android/iOS/Harmony renderer 搬进 Vizual。
- 不把 layout/design policy 写进 native core。
- 不把三库串成 `AG-UI -> adapter -> A2UI -> bridge -> VizualSpec`。
- 不用空白 fallback 或伪造 PASS 掩盖渲染失败。

## 验收门槛

自动化：

```bash
npm test -- --run
npm run typecheck -- --pretty false
npm run build
```

浏览器：

```text
http://127.0.0.1:8796/validation/native-protocol-matrix.html
```

必须满足：

- 正向：`total 7 / pass 7 / fail 0`
- 负向自检：URL 加 `break-agui-events=1` 时，AG-UI EventType case 必须失败，用来证明裁判不会把少喂事件误判为 PASS。
- A2UI 控件真实可输入、可点、可回传 action。
- A2UI template children 有真实展开项。
- AG-UI tool call args 能嵌入并渲染 A2UI surface。
- AGenUI Chart canvas 非空像素。
- AGenUI catalog 25 components 全覆盖。
- AG-UI 33 个事件名全接收。

## 2026-06-04 覆盖校准

- Native Core gallery 已扩展为 52 个 renderable components。`validation/specs-31.js` 是历史文件名，当前必须覆盖全部 52 个组件。
- 新增 parity 测试：catalog、manifest、registry、validator renderable 白名单、gallery fixture 必须完全一致，防止某个组件只在一处注册。
- 新增 lifecycle/validation 测试：theme、error/recovery、fallback quality finding、无效 fallback 保留现有 UI、action 回传异常隔离、Host callback 异常吸收、reset/delete、no surface、root 缺失、empty elements、children 循环、text-only relaxed validation 都进入本地 gate。
- 新增 data model 边界测试：root-level append、path append、对象字段删除、数组项删除、缺失路径 no-op 都进入本地 gate。
- 新增 chart validation matrix：Scatter/Bubble/Calendar/Heatmap/Pie/Funnel/Waterfall/Xmr/Sparkline/Histogram/Boxplot/Dumbbell/Sankey 的字段规则，以及字段缺失、字段存在但非数值的错误证据都进入本地 gate。
- 新增失败吸收测试：未知 AG-UI 事件不报错且记录 event log；缺少 id 的 AG-UI message/tool/activity 事件会被吸收；坏的 visual update 会留下 recoverable error 证据，但不会损坏已完成的文字消息。
- 新增 quality finding 证据测试：fallback/gap 会进入 validation warning issues；unsupported raw input 不创建 hidden surface 或 operation。
- 新增 public SDK 测试：`dispatchAll`、`process`、`processA2UIMessage(s)`、`processAGUIEvents`、`processVizualSpec`、`updateSurfaceDataModel`、`resetSurface`、getter、callback 和 action unsubscribe 都进入本地 gate。
- 新增 stream/message 测试：JSONL/SSE、`format:auto` 自动识别、半包、end flush、reset、Uint8Array、空 chunk/空行/SSE comment/无 data SSE/半截 JSON 防误渲染、OpenAI chat/Responses delta、Anthropic-style `message_stop`、回调顺序、assistant message content 中嵌入 A2UI operations 的提取和可修复 trailing JSON 都进入本地 gate。
- 新增 A2UI wrapper 测试：standard/loose surface/data/function/theme/recovery 消息、generic `updateComponents` 自动补 canonical root、rootless loose wrapper 自动合成 root、parentId 提示不匹配时保留可见组件，以及 legacy beginRendering/action/typed data model 入口都进入本地 gate；修复 loose `callFunction` 丢失 `functionCallId` 和 rootless loose wrapper 空白 surface 问题。
- 新增 semantic shorthand 测试：dashboard 中的 metrics/charts/tables/risks/actions/forms、semantic data-rich records、semantic array 和 child id 去重、direct text-card KPI 自动合成、direct inline child id 去重、inline child object 展开、常见组件 alias 矩阵、native data component string binding 和非 binding 数据字符串保留都进入本地 gate。
- 新增 A2UIBridge 薄桥 SDK 测试：getter、artifact/data/theme/error/surface state、`updateSurfaceDataModel`、`resetSurface`、action callback/unsubscribe 都回到 native runtime。
- 新增协议清单防漂移测试：AG-UI 33 个事件名和 AGenUI 25 个 catalog component 由 `src/native-core/protocol-fixtures.ts` 统一导出，unit matrix 会解析 `validation/native-protocol-matrix.html` 并校验两边清单一致；Fusion `AGUIEventType` 也复用同一组事件 union。
- 新增 operation reducer 防漂移测试：`VizualNativeOperation` union 和 `reduceOperation` switch case 必须完全一致。
- 2026-06-04 本地全量 gate：`npm test -- --run` 为 49 个文件 / 473 个测试通过；`npm run typecheck -- --pretty false` 通过；`npm run build` 通过；3 个 CDP runner 的 `node --check` 通过。
- 2026-06-04 Native Core 覆盖率 gate：`npx vitest run --coverage --coverage.include='src/native-core/**/*.{ts,tsx}' --coverage.reporter=json-summary --coverage.reporter=text --coverage.reportsDirectory=/tmp/vizual-native-core-coverage-detail` 通过；native-core include 范围行覆盖 `100%`、函数覆盖 `100%`，`core.ts`、`validate.ts`、`normalize.ts`、`preview.ts`、`stream.ts` 均为 100% 行覆盖。
- 旧浏览器正向证据：`validation/artifacts/native-protocol-matrix-2026-06-04T03-34-17-611Z/summary.json` 为 7/7 PASS。
- 旧浏览器负向自检证据：`validation/artifacts/native-protocol-matrix-2026-06-04T03-34-43-489Z/summary.json` 带 `break-agui-events=1`，出现 6 PASS / 1 FAIL 是预期。
