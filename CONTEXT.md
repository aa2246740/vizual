# Vizual Agent UI Context

Vizual exists to let AI agents answer natural conversations with native visual and interactive UI when text alone would be hard for humans to understand or act on.

## Language

**自然对话可视化**:
用户以普通语言提出分析、解释、规划、比较、诊断或决策问题；Agent 判断纯文本不足以让人直观理解时，主动生成可视或互动 UI surface。
_Avoid_: 用户点名组件, widget 关键词触发, dashboard 关键词触发, 凡分析必出图

**显式创作请求**:
用户明确要求生成网页、小游戏、小工具、自定义页面、代码或其他具体 artifact 时，Agent 按用户请求选择合适创作路径，不强行限制在 Vizual Native Catalog 内。
_Avoid_: 用 Native call 替代用户明确要求, 把所有创作都塞进 Vizual, 忽略用户点名 artifact

**可视化升级**:
当回答包含趋势、对比、分布、排名、异常、关系、多步骤规划、状态流转、调参、筛选、填写、选择或假设探索时，Agent 将纯文本回答升级为 Vizual UI；普通问答、短结论和无结构数据闲聊保持纯文本。
_Avoid_: 分析必出图, 报告必出 UI, 关键词路由

**Agent 层**:
解释用户自然语言、判断是否需要可视化升级，并决定使用何种可视或互动表达的责任层。
_Avoid_: Core intent classifier, renderer policy

**能力发现层**:
通过 Skill、MCP 或 SDK tool schema 向 Agent 暴露 Vizual 能力、使用边界和自检方式的责任层。
_Avoid_: 隐藏系统提示词注入, 测试专用提示包装

**Vizual Native Catalog**:
三合一后的唯一能力真相，统一描述组件、函数/action、data binding、theme token、artifact 能力、校验 schema，以及 A2UI、AG-UI、Vizual spec 和 native operations 的兼容映射。
_Avoid_: A2UI Catalog + Vizual Catalog 双真相, prompt 清单, 测试组件白名单, 手写第二套真相

**完整接入包**:
Agent 产品接入 Vizual 时必须同时提供能力发现、UI 生成入口、校验预览、Host 渲染、artifact 持久化、action 回传和浏览器验收路径；只接其中一个片段不能算正式接入。
_Avoid_: 半套接入, demo-only tool, 只接渲染器, 只接 prompt

**结构化 UI 输出通道**:
Agent 在普通对话回复中需要可视或互动表达时，用结构化消息、tool call 或协议事件输出 Vizual UI，而不是把 UI JSON 混入 Markdown 文本。
_Avoid_: 单独 UI 页面, JSON-in-Markdown, 替换普通聊天入口

**内联交互展示块**:
出现在 assistant 回复中间或回复旁边的可视/互动 UI part，形态类似对话里的 playground；Agent 决定语义位置，Host 按消息顺序渲染并保持交互、持久化和回调。
_Avoid_: 回答末尾固定附图, 独立测试页, 静态截图

**Agent 自主编排**:
Agent 自己决定是否使用 Vizual、在回复何处插入内联交互展示块、使用哪些组件组合以及怎样解释结果；Vizual 提供能力、契约和运行时，不替 Agent 设计答案。
_Avoid_: Core 创作门禁, 关键词强制路由, 固定模板兜底, Host 重排 Agent 回复

**模式判断边界**:
完整接入包告诉 Agent 如何区分显式创作请求、自然对话可视化、用户要求纯文本和用户要求可视化；具体判断权仍属于 Agent 自主编排。
_Avoid_: Core 决策, Host 关键词路由, 忽略用户明确要求

**契约校验**:
验证 Vizual payload 是否符合 catalog、schema、渲染和交互契约，并把失败原因反馈给 Agent 或 Host；它约束可执行性和安全性，不评价业务表达风格。
_Avoid_: 设计品味打分, Agent 意图门禁, 测试答案预设

**可机械验证事实**:
能从用户输入、payload、data model 或渲染结果中直接核对的数据事实，例如字段是否存在、数值是否为空、图表是否全零或 action 是否真实绑定。
_Avoid_: 风格判断, 业务观点审查, 禁止 Agent 正常推理

**硬失败**:
会阻止 Vizual UI 被接受或渲染的问题，只限 schema/catalog/安全/渲染/真实交互等契约层错误。
_Avoid_: 缺少某类业务模块, 图表选择不佳, 设计不够好

**QA 提示**:
不阻止渲染、但会提示 Agent、Host 或人工验收者关注的问题，例如表达是否直观、视觉是否优秀、组件选择是否合适或推理是否过强。
_Avoid_: runtime hard gate, Core rejection

**QAFinding**:
给 Agent 自修复、Host/开发者验收和测试调试使用的结构化工程证据，只记录契约、渲染、交互、安全和可机械验证事实问题。
_Avoid_: 面向最终用户的产品内容, 创意审查, 业务观点审稿

**Catalog Gap**:
Agent 或 SDK 在自然对话可视化中发现 Vizual Native Catalog 缺少合适表达能力时记录的能力缺口，用于后续吸收成 native component、action pattern 或 schema enhancement；它是尽可能收集的学习信号，不要求完整捕获。
_Avoid_: 渲染阻断, 普通用户提示, 自由发挥许可

**Catalog Gap Sink**:
安装时可配置的可选收集目标，用于写入 Agent-declared 或 SDK-detected Catalog Gap；有文件或后端写入能力时收集，没有写入能力时跳过且不影响正常渲染。
_Avoid_: 强制文件写入, 偷偷写用户目录, 无权限时验收失败, 100% gap 捕获承诺

**Catalog Gap Metadata**:
结构化 UI 输出通道中的旁路 metadata，用于携带 Catalog Gap；它不进入 UI spec 本体、不影响渲染、不改变用户看到的效果。
_Avoid_: 污染 component spec, 影响输出, 作为验收门禁

**干净 Agent 环境**:
没有为本次验收预置测试脚本、隐藏提示词、演示 payload 或手工修正状态的 Agent 运行环境；Agent 只能通过完整接入包发现和使用 Vizual。
_Avoid_: 预设脚本验收, guided validation wrapper, demo payload

**冷启动浏览器验收**:
在干净 Agent 环境里，通过真实浏览器页面和 Computer Use 执行自然对话、渲染检查、用户交互和后续回传，作为端到端是否通过的验收方式。
_Avoid_: 只跑单元测试, 只跑 CDP 脚本, 只看静态 JSON, 只看模型 stdout

**验收场景设计**:
用自然语言任务覆盖 Vizual、A2UI 和 AG-UI 能力，让 Agent 自主决定是否与如何使用内联交互展示块；场景不显式点名组件或调用方式。
_Avoid_: 组件点名脚本, 预设答案, 只验证 JSON

**Vizual Core 层**:
接收 A2UI、AG-UI、Vizual spec 或 native input，负责规范化、校验、渲染、artifact、action 回传和质量证据的责任层。
_Avoid_: 设计品味门禁, 业务意图判断, 关键词触发

**Presentation Context**:
Host、Agent 产品、Agent 自主选择、用户显式要求或中性 fallback 提供的视觉上下文；Core 只应用明确传入的 token，不把主题作为创作判断来源。
_Avoid_: Core 注入审美, 用户必须指定 theme, 系统提示词预设风格

**Host 层**:
把 Vizual rich UI 挂载到聊天或业务界面中，并负责持久化、回调、导出和用户交互上下文。
_Avoid_: Markdown 内嵌 JSON, 临时测试页替代产品宿主
