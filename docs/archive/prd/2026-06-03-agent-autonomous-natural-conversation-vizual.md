# PRD: Agent-Autonomous Natural Conversation Vizual Runtime

Date: 2026-06-03

## Problem Statement

Vizual 的目标是让 Agent 在自然对话中按需生成内联可视或互动 UI，而不是让用户显式提出 chart、kanban、widget 或某个组件名。但是当前实现和验收路径仍然混入了运行时语义分类器、关键词/正则判断、测试专用 prompt 和预设脚本，导致产品方向反复偏离：普通业务数据分析可能被误判为显式创作请求，Agent 自己的判断被 Host 或 harness 覆盖，验收结果看似通过但用户真实冷启动一测就挂。

用户面对的问题不是“缺少某个组件”，而是 Vizual 接入边界不够稳定：哪些事情由 Agent 自主判断，哪些事情由 Native Core 机械校验，哪些事情只是 QA 验收报告，没有被 PRD 级别地固定下来。只靠 ADR 和临时计划不足以防止实现再次退回关键词路由、模板兜底或为了交互而交互。

## Solution

把 Vizual 定义为 Agent 产品的原生视觉能力包：它向 Agent 暴露 Native Catalog、tool/MCP/SDK schema、校验预览、Host 渲染、artifact 持久化、action 回传和浏览器验收能力；Agent 在自然对话中自主决定是否使用 Vizual、在哪里插入内联展示块、如何组合组件、是否需要交互。

Runtime、Host、SDK 和验收服务不得用关键词、正则或 hidden classifier 决定“本轮是否需要 Vizual UI”。它们只能提供稳定能力、解析结构化输出、校验契约、渲染 UI、捕获 action/event 和记录证据。验收 fixture 可以保留 `visual` / `text` / `creative` 等场景期望，但这些期望只用于事后判分和报告，不能进入 Agent prompt、不能改变 tool 可用性、不能决定 shortcut、不能阻止或强迫 tool call。

Vizual Core 的硬失败只限契约层：schema、catalog、安全、渲染、持久化、真实 action-loop、可机械验证事实。创作质量、组件选择、是否足够直观、是否可以更好地表达，属于 QA 提示或验收 finding，不是 runtime rejection。显式创作请求由 Agent 按用户要求走网页、HTML、React、游戏、代码 artifact 等路径；只有用户或 Agent 明确选择嵌入 Vizual surface 时才使用 Vizual Native。

## User Stories

1. As an end user, I want to ask a normal data analysis question, so that the Agent can decide whether a visual explanation helps me understand the answer.
2. As an end user, I want business data with trends, funnels, rankings, or anomalies to be shown visually when useful, so that I do not have to read dense text only.
3. As an end user, I want short factual answers to stay as text, so that the chat is not polluted by unnecessary UI blocks.
4. As an end user, I want explicit webpage, landing page, HTML, React, game, or code artifact requests to follow that request, so that Vizual Native does not override my stated intent.
5. As an end user, I want interactive controls only when they change understanding or workflow state, so that I am not shown fake buttons or demo-only interactions.
6. As an end user, I want an inline UI block to appear at the useful point in the conversation, so that the visual is part of the answer instead of a detached appendix.
7. As an end user, I want follow-up clicks, filters, drill-downs, and form submissions to feed meaningful state back to the Agent or Host, so that interaction has an observable consequence.
8. As an end user, I want the Agent to preserve ordinary prose around a UI block, so that the result still feels like a natural conversation.
9. As an end user, I want Vizual output to render reliably in the browser, so that I can trust the visual result rather than inspect JSON.
10. As an end user, I want failed rendering to have a useful fallback summary, so that I still receive the answer if native UI cannot render.
11. As an Agent, I want a Native Catalog that describes components, actions, bindings, themes, artifact behavior, and compatibility mappings, so that I can choose capabilities without memorizing a separate prompt list.
12. As an Agent, I want `present_vizual_ui` or equivalent structured output available as a stable capability, so that I can emit UI when I decide it is useful.
13. As an Agent, I want the same capability truth across Vizual, A2UI, AG-UI, MCP, SDK, and skill docs, so that I am not forced to reconcile multiple catalogs.
14. As an Agent, I want guidance that explains natural conversation visualization, text-only cases, explicit creative requests, and useful interactions, so that I can make the judgment myself.
15. As an Agent, I do not want the Host to inject a per-message “needs UI” verdict, so that my reasoning is not constrained by brittle keyword matching.
16. As an Agent, I want validation errors to be contract-specific, so that I can repair bad payloads without being second-guessed on creative choices.
17. As an Agent, I want optional Catalog Gap metadata, so that I can report missing native capabilities without blocking the user answer.
18. As an Agent, I want Host-provided action capabilities to be explicit, so that I do not invent dispatch, approval, save, or backend workflows that do not exist.
19. As a Host developer, I want a complete integration package, so that partial rendering-only integration does not masquerade as a reliable Agent UI product.
20. As a Host developer, I want the SDK/tool/MCP layer to expose capability, not intent classification, so that my product remains compatible with different Agent reasoning styles.
21. As a Host developer, I want Vizual Core to validate schema, catalog, renderability, safety, persistence, and action loops, so that invalid UI cannot silently ship.
22. As a Host developer, I want QA findings separated from hard failures, so that useful Agent output is not rejected for subjective design reasons.
23. As a Host developer, I want Catalog Gap Sink to be optional and configurable, so that deployments without write permission still work.
24. As a Host developer, I want no hidden prompt injection in cold-start acceptance, so that passing tests reflect the real integration path.
25. As a Host developer, I want theme to come from platform, Agent, explicit user context, or neutral fallback, so that Core does not impose visual taste.
26. As a Host developer, I want artifact persistence and targetMap-based follow-up edits, so that users can refine prior UI blocks safely.
27. As a Host developer, I want action and event logs captured in acceptance, so that interactive claims can be verified.
28. As a Host developer, I want a stable transport contract for agents without native tool-call support, so that fallback wrappers still represent the same UI capability without semantic gating.
29. As a QA engineer, I want natural-language acceptance scenarios, so that tests reflect how users actually ask questions.
30. As a QA engineer, I want scenarios to avoid naming components or protocols, so that the Agent chooses the visual expression autonomously.
31. As a QA engineer, I want visual, text-only, and explicit creative expectations to be post-run verdict labels, so that tests can catch pollution without steering the Agent.
32. As a QA engineer, I want browser-visible evidence, so that passing requires real rendered UI rather than JSON shape alone.
33. As a QA engineer, I want Computer Use interaction in acceptance, so that clicks, controls, visual output, and event streams are inspected like a real user would inspect them.
34. As a QA engineer, I want arbitrary real prompts beyond fixtures to be testable, so that a narrow scripted pass does not hide production failures.
35. As a QA engineer, I want plain text responses parsed without being treated as render failures when the Agent correctly chose text, so that transport limitations do not distort product verdicts.
36. As a QA engineer, I want generated UI payloads rejected only for mechanical contract failures, so that creative QA remains advisory.
37. As a product owner, I want the PRD to make the Agent/Core/Host/QA boundaries explicit, so that future implementation does not drift back to regex routing.
38. As a product owner, I want Vizual, A2UI, and AG-UI presented as one integrated native capability, so that external developers do not experience a fragmented product.
39. As a product owner, I want examples to avoid fake external operations, so that the product does not imply unavailable backend capabilities.
40. As a product owner, I want acceptance failures to produce actionable evidence, so that failures can be absorbed into catalog, docs, tests, or integration improvements.

## Implementation Decisions

- Agent autonomy is the product boundary. Agent decides whether to use Vizual, where to insert the inline UI block, what components to use, and whether interaction is useful.
- Runtime, Host, SDK, MCP server, and acceptance server must not use semantic classifiers, keyword routing, regular expressions, or scenario labels to decide whether a user request needs Vizual UI.
- Any existing `requiresVizualUi`, `shouldUseVizualUi`, or equivalent runtime value must be removed from the production and cold-start acceptance path. If a similarly named value remains for reports, it must be explicitly renamed as a post-run expectation or verdict and must not affect Agent execution.
- Tool availability must be stable for an integrated Agent environment. The tool can describe Vizual's purpose and boundaries, but it must not be enabled or disabled per message based on Host intent detection.
- A transport wrapper may require a stable output envelope such as assistant text plus optional tool call when an Agent runtime cannot emit real tool calls. That wrapper must be static across requests and must not include a per-message UI verdict.
- Text-only and explicit creative boundaries are Agent guidance and acceptance verdicts, not Host prefilters. The Host may render no Vizual UI when the Agent returns none; it must not force or suppress Vizual based on its own semantic judgment.
- Native Catalog is the single capability truth for components, actions/functions, data bindings, theme tokens, artifact behavior, and A2UI/AG-UI/Vizual compatibility mappings.
- Skill, docs, MCP tools, and SDK schemas explain how to discover and use the Native Catalog. They must not become a second hand-written capability truth.
- Vizual Core hard failures are limited to contract failures: schema/catalog mismatch, unsafe payload, render failure, broken persistence, missing real action loop for claimed interaction, or mechanically verifiable data errors.
- QA findings may flag weak expression, questionable component choice, over-complex UI, missing useful visual structure, or unnecessary interaction, but they must not block rendering unless they are also contract failures.
- Useful interaction is required for interactive surfaces. Buttons, forms, callbacks, filters, drill-down, plan update, or submit actions must either change local state, improve understanding, or use an explicit Host capability.
- Examples and fixtures must not invent external business APIs such as dispatch, approval, backend save, or assignment unless the Host capability is explicitly part of the scenario.
- Explicit creative requests such as webpage, landing page, game, custom HTML, React component, SVG illustration, or code artifact remain outside forced Vizual Native. If the Agent chooses to embed a Vizual surface inside that artifact, it must be because the user or Agent explicitly made that composition useful.
- Catalog Gap is optional side-channel metadata. It can be Agent-declared or SDK-detected, and it can be written to a configured sink only when the environment permits it. It must not affect rendered UI or user-visible success.
- Theme comes from presentation context: Host/platform defaults, Agent context, explicit user request, or neutral fallback. Core applies provided tokens but does not infer theme as part of creative judgment.
- Full integration means capability discovery, UI output channel, validate/preview, Host render, artifact persistence, action return, and browser acceptance. Partial demos should be labeled as partial and not treated as production-ready integration.
- Acceptance fixtures may keep `visual`, `text`, `creative`, interaction, and Catalog Gap expectation labels. These labels are only post-run scoring metadata.
- Acceptance reports must record whether the Agent produced text, a tool call, a renderable native surface, visible browser output, useful interaction evidence, action/event logs, warnings, errors, and optional Catalog Gap metadata.
- Existing legacy demo shortcuts may remain only as clearly marked local development conveniences. They cannot be used as cold-start acceptance evidence.

## Testing Decisions

- The highest-value test seam is the clean-agent browser acceptance seam: a real Agent receives a natural-language user task and a complete Vizual integration package, then the browser is inspected and operated with Computer Use.
- Good acceptance tests validate external behavior: user message in, Agent response out, optional structured UI call, browser-visible render, interaction/event evidence, and final verdict. They must not assert internal regex matches, selected component names, or hidden classifier branches.
- Scenario fixtures should cover natural data analysis, concept or algorithm explanation with useful controls, A2UI-style surface/action behavior, AG-UI-style event flow, drill-down and follow-up loops, text-only negative requests, explicit creative negative requests, arbitrary real business prompts, and optional Catalog Gap reporting.
- Scenario fixtures must not mention component names, protocols, tool names, or expected payload shapes in the user task. They may describe the user goal naturally.
- Negative text-only scenarios pass when no Vizual surface is produced and the answer is useful text. They fail when the Agent or Host pollutes the answer with unnecessary native UI.
- Negative explicit creative scenarios pass when no forced Vizual Native surface is produced. Freeform artifact output may require manual inspection if the Agent runtime cannot represent that artifact in the harness.
- Positive visual scenarios pass only when there is a real renderable surface visible in the browser. JSON-only success is insufficient.
- Interaction scenarios pass only when visible controls exist and action/state/event evidence is captured. Interaction without effect is a QA failure or review finding.
- Contract tests should continue at the Native Core seam for normalization, validation, preview, rendering, action-loop metadata, and catalog compatibility.
- Catalog manifest tests should verify that SDK/tool/MCP-facing capability data is derived from the Native Catalog rather than a separate list.
- Agent helper tests should verify contract-vs-QA separation. They should not test “should this prompt use Vizual” as a Core/Host decision.
- Tool/envelope parsing tests should accept plain assistant text when no tool call is present, and should parse structured tool calls without requiring a Host semantic verdict.
- Browser acceptance should capture screenshots or visual metrics, tool-call evidence, action logs, warnings, errors, and final scenario verdicts.
- Regression tests must include the mobile banking growth diagnosis prompt that exposed the regex `APP安装` failure, but only as a natural prompt. The expected result is post-run QA scoring, not preclassification.
- Build verification should include unit tests, typecheck, build, syntax checks for validation scripts, and at least one real browser cold-start acceptance run before claiming completion.

## Out of Scope

- Building a generic webpage, landing page, game, HTML artifact, or React app generator inside Vizual Native.
- Guaranteeing that every possible Agent will always choose the best visual expression.
- Guaranteeing 100% Catalog Gap capture across Agents without write permissions or metadata support.
- Creating fake backend integrations, fake dispatch operations, fake approvals, or fake save flows for demos.
- Making Core responsible for business reasoning quality, design taste, or final answer grading.
- Replacing external Agent products' normal creative workflows with Vizual Native.
- Requiring end users to know component names, chart names, A2UI, AG-UI, MCP, or Vizual protocol details.
- Treating local scripted fixtures, static JSON snapshots, or stdout-only checks as full acceptance.

## Further Notes

- This PRD is the source requirement for removing runtime semantic gating from the acceptance server and any SDK/Host paths touched by this work.
- The ADRs remain valid: contract validation is not creative gating, Catalog Gap is optional metadata, and cold-start acceptance uses scenarios rather than scripts.
- The implementation should treat yesterday's failure as a regression class: a user-provided business prompt containing words such as APP, dashboard, report, or analysis must not be routed by regex or keyword assumptions.
- The acceptable implementation shape is capability-first: expose the tool/catalog/runtime to Agent, let Agent choose, then validate and render what it chose.
- The acceptable testing shape is verdict-after-execution: run the scenario, inspect the real browser result, capture evidence, and only then judge whether the Agent's choice matched the scenario expectation.
