# AGenUI 批判性研究记录

日期：2026-05-18
研究对象：`AGenUI/AGenUI`
本地克隆：`/Users/wu/Documents/vizual-research/_external/AGenUI`
当前克隆 HEAD：`e65127d ci: add GitHub Actions workflows, issue templates, and Dependabot config`

## 研究目标

用第一性原理判断 AGenUI 对 Vizual 三库融合是否有借鉴价值，而不是因为它也叫 A2UI/GenUI 就照搬。

可校验结论标准：

- 能说清它真实产品形态是什么，不被 README 宣传语带偏。
- 能列出可迁移的机制、不可迁移的实现、需要补证的风险。
- 能落到 Vizual Fusion Runtime 下一步，而不是停留在“看起来不错”。

## 一句话结论

AGenUI 更像“移动端 A2UI 原生 SDK + freestanding catalog + Agent 生成技能”，不是我们当前 Web/Vizual runtime 的直接替代品。它最值得借鉴的是：schema/catalog 约束面、生成前的模式边界、生成后的脚本+设计审查循环、真实 Button/action 与窄屏保护规则、流式组件/dataModel 的状态机思路。它的原生 renderer、A2UI v0.9 锁定、CI/测试成熟度、部分样例和规范不一致，不应直接搬进 Vizual。

## 已确认事实

- 提交史从 2026-03-22 开始，最近一次本地克隆可见提交是 2026-05-17；作者不止一个，包含 GitHub noreply、Autonavi/Alibaba 邮箱和少量个人邮箱。
- 仓库不是 Web/React 项目，根目录没有 `package.json`；主体是 C++ core、Android Java、iOS Swift/Objective-C++、Harmony C++/ETS。
- README 目标是 iOS/Android/HarmonyOS 三端原生渲染 A2UI v0.9，核心架构是 shared C++ core + 三端 renderer。
- 根目录 `agenui_catalog.json` 是 freestanding A2UI catalog，包含 25 个 components、14 个 functions、60 个 `$defs`。
- Core API 中 `SurfaceManager` 采用 `beginTextStream -> receiveTextChunk x N -> endTextStream`，每个 SurfaceManager 是独立流式会话。
- Core 中存在 Surface、DataModel、ComponentManager、VirtualDOM、FunctionCallManager、stream extractor 等真实模块，不是纯 README 空壳。
- CI 只有 Android/iOS 构建级 workflow；Harmony workflow 是手动且默认 GitHub runner 缺 DevEco 会失败。未发现覆盖核心 C++/三端交互行为的系统测试。
- 代码中存在明确未完成点：Android async platform function TODO、Android 多个媒体 icon 未实现、Harmony `RegisterComponent` stub、Harmony Table border-radius 未实现。

## 值得借鉴

### 1. Catalog 作为 Agent 约束面

AGenUI 的 `agenui_catalog.json` 把组件、函数、共享类型放成一个自包含 schema。这个方向适合 Vizual，但应该生成 Vizual 自己的 catalog，而不是采用 AGenUI v0.9 catalog。

对 Vizual 的价值：

- 让 Agent 看到“能输出什么、不能输出什么”。
- 把组件能力从散落的 prompt/README 收回到机器可校验 artifact。
- 为真实 daemon 输出做静态校验入口，避免运行到浏览器才发现 shape 错。

建议迁移方式：

- 基于 `src/catalog.ts` 和现有 31+ A2UI primitives 生成 `vizual_catalog.json`。
- 让 cold-start runner 在调用 daemon 前后都记录 `catalogId`、schema version、组件能力版本。
- 不把 catalog 当排版模板，只当协议能力边界。

### 2. 生成流程里的“模式边界”

`skills/a2ui-generation/SKILL.md` 把任务分成 DTO Component、Non-DTO Component、Non-DTO Page，并强调默认不是 full page。这个对我们很有用，因为此前 Vizual 最容易乱的是：用户要卡片，Agent 做成页面；用户要 dashboard，Agent 又塞进小卡片。

建议迁移方式：

- 在 Vizual daemon prompt 里先要求 Agent 声明输出模式：`card | dashboard | document | report | form | deck-like page`。
- 不同模式使用不同 QA 阈值：卡片检查紧凑和单焦点；dashboard 检查信息密度、图表/表格完整性；document 检查段落层级和批注目标。
- 模式声明必须进入验收证据，方便失败归因。

### 3. “脚本验证 + 设计复审”循环

AGenUI skill 强制先写文件、跑 `validate_a2ui.py`、修到通过，再做模型级设计 review。这个不是 renderer 技术，但对 Agent 稳定性很关键。

建议迁移方式：

- Vizual 应补一个 `validate-vizual-output` 层，检查 surfaceId、root、引用 id、动态 path、Button/action、dataModel 路径、组件是否注册。
- 浏览器 QA 继续检查空白、溢出、不可见控件、内容不足、空壳卡片。
- 两者必须分层：脚本负责协议正确，浏览器负责真实视觉/交互。

### 4. 真实交互原则

AGenUI 对 fake button 的禁止很明确：可点击元素必须是 `Button + functionCall/event`。这与我们要做真实 Agent 回复、真实更新卡片、真实 action 路由一致。

建议迁移方式：

- Vizual A2UI Button schema/runner 继续把 fake button 视为失败。
- daemon 页面验收时，所有 CTA/Button 必须点击并产生可见 action log 或 Agent 可消费事件。
- 对 form/slider/checkbox/choicepicker，必须验证 UI 改动会回写 state，而不是只改变 DOM。

### 5. 窄屏保护和设计质量检查

AGenUI skill 中“protected content wrap review”对我们很贴：CTA、数值、状态词、价格、时间不能被窄列挤成单字换行。这能直接覆盖用户指出的“乱、丑、空位、没有设计性”。

建议迁移方式：

- 把“保护内容”加入 Vizual browser QA：检测按钮文字换行、短数值断裂、表格/卡片横向溢出、右侧 CTA 被挤出。
- 卡片/报告/dashboard 用不同阈值，不能把 AGenUI 的移动卡片 1/3 屏规则硬套到 Vizual 大屏 dashboard。

### 6. 流式解析和 Surface 状态机

AGenUI core 的 `ProtocolStreamExtractor` 对 `updateComponents` 做组件级增量提取，对 `updateDataModel/appendDataModel` 做流式处理，Surface 内有 DataModel、ComponentManager、VirtualDOM。它证明“协议流 -> surface state -> renderer diff”是合理方向。

对当前 Vizual Fusion Runtime 的启发：

- 我们现在已经有 `VizualFusionRuntime` 维护 surface/data/spec/artifact，但还缺更完整的 `appendDataModel` 语义、functionCall request/response 生命周期、schema validation。
- 可以借鉴状态机边界，但不应照搬 C++ parser。Web runtime 应用 TypeScript/structured parser 和 AG-UI event stream 对接。

## 不应直接借鉴

- 不迁移原生 renderer。AGenUI 的 Android/iOS/Harmony 代码服务移动原生 UI，和 Vizual Web/React catalog 不是同一运行环境。
- 不把 A2UI v0.9 当最终协议。我们当前已经处理 v0.10 和 Vizual 扩展，AGenUI v0.9 只能作为兼容参考。
- 不照搬它的卡片尺寸硬规则。Vizual 有 dashboard、DocView、report、表单、图表、导出、评审目标，不能都按移动端卡片约束。
- 不接受 README 的性能宣传作为事实。仓库没有足够行为测试或 benchmark 证明“120 fps”等说法。
- 不接受它的 skill 规则作为 renderer 真能力。它自己的 playground 样例出现 `width: "100%"`、`gap` 等，与 skill 中“尺寸只支持 px / gap 不支持”的说法存在不一致。

## 成熟度和 AI 生成痕迹判断

我不会把它定性成“纯 AI 空仓库”。它有真实多端工程结构、core 状态管理、renderer 注册、playground 样例、build scripts 和多个作者提交。

但它明显有 AI 辅助/快速包装痕迹：

- 文档和 skill 规则非常完整，测试覆盖却很薄，呈现“文档先行、行为证据不足”的典型失衡。
- README/QuickStart/build 配置有细节不一致：README 写 Android NDK 27.3/API 35，QuickStart/build.gradle 实际是 NDK 25.2、compileSdk 34。
- CI 是构建门禁，不是交互/视觉/协议行为门禁。
- 存在 stub/TODO/not implemented，同时 README 对能力描述较满。
- playground 样例、skill validation、catalog 之间有不一致，说明规范未被同一套测试闭环约束。

更准确的判断：它可能是基于真实移动端代码快速开源，再用 AI/文档工程把“Agent 生成技能、README、CI、样例”补齐。可以借鉴流程思想，不能把实现成熟度默认视为可靠。

## 对 Vizual Fusion Runtime 的具体落点

短期应该做：

1. 生成 `vizual_catalog.json`，从我们的 `src/catalog.ts` 和 A2UI primitive schema 派生，不手写第二套真相。
2. 增加输出验证器：surface/root/id 引用、dataModel path、Button/action、已注册组件、禁止 hidden fallback。
3. 在 daemon prompt/runner 中加入输出模式声明和质量自检字段，验收证据保留模式、组件列表、交互点、QA findings。
4. 扩充 Fusion Runtime 的缺口：`appendDataModel`、functionCall request/response lifecycle、component schema validation、event/action 可审计日志。
5. 把浏览器 QA 从“是否可见”推进到“是否像设计好的产品”：空白、过窄、过松、错位、按钮不可见、短文本断裂、表格挤压、卡片套卡片。

中期可以研究：

- AGenUI 的 streaming plugin 思路，设计 Vizual 的增量 text/markdown/data append 语义。
- AGenUI 的 FunctionCallManager，把 Vizual action routing 从 callback 扩展成可验证 request/result 模型。
- Catalog negotiation，但只作为 Agent 能力协商，不作为 layout gate。

当前不建议做：

- 不合入 AGenUI 代码。
- 不把 AGenUI catalog 作为 Vizual catalog。
- 不改成移动端 A2UI 风格布局系统。
- 不为了“统一”增加新的 bridge/adapter 层；统一点仍应是 Vizual Fusion Runtime。

## 证据路径

- AGenUI README：`/Users/wu/Documents/vizual-research/_external/AGenUI/README.md`
- AGenUI catalog：`/Users/wu/Documents/vizual-research/_external/AGenUI/agenui_catalog.json`
- AGenUI skill：`/Users/wu/Documents/vizual-research/_external/AGenUI/skills/a2ui-generation/SKILL.md`
- AGenUI validator：`/Users/wu/Documents/vizual-research/_external/AGenUI/skills/a2ui-generation/scripts/validate_a2ui.py`
- AGenUI stream parser：`/Users/wu/Documents/vizual-research/_external/AGenUI/core/src/stream/agenui_protocol_stream_extractor.cpp`
- AGenUI surface/data/runtime：`/Users/wu/Documents/vizual-research/_external/AGenUI/core/src/surface/`
- AGenUI CI：`/Users/wu/Documents/vizual-research/_external/AGenUI/.github/workflows/`
- 当前 Vizual Fusion Runtime：`/Users/wu/Documents/vizual-research/vizual-compare/src/fusion/runtime.ts`
- 当前 Vizual runtime 设计记录：`docs/archive/plans/2026-05-16-vizual-fusion-runtime-design.md`
