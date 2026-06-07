# Vizual x A2UI 融合验收目标 v0

日期：2026-05-15
分支：`feature/a2ui-protocol`

## 目标

交付一个可验收版本。验收不能只看固定 demo、静态样例或脚本 PASS，必须满足：

- 真实 Agent 冷启动回复；
- 真实浏览器渲染；
- 真实交互输入；
- 导出链路；
- DocView 审阅/修订链路；
- A2UI/AG-UI 边界和对抗场景；
- 浏览器截图经人工检查没有空白、错位、重叠、明显低质设计。

这个项目的目标不是组件 catalog demo，而是 Agent 视觉运行时：用户用自然语言提问，Agent 输出 A2UI/Vizual 消息，浏览器渲染稳定、有设计感、可交互、可更新、可导出的业务 artifact。

## 协议边界

A2UI 标准消息：

- `createSurface`
- `updateComponents`
- `updateDataModel`
- `deleteSurface`
- `callFunction`
- `actionResponse`

Vizual Bridge 扩展：

- `updateTheme`：Vizual 自己的运行时主题合并能力。
- `errorRecovery`：Vizual 自己的错误恢复能力。

Artifact 持久化、导出、DocView 审阅/修订、版本管理、targetMap、视觉 QA 是 Vizual 产品能力，不属于 A2UI 标准协议。文档和验收不能把 Vizual 扩展误写成 A2UI 标准。

## 质量门槛

1. 协议稳定性
   - 重复 `createSurface` 不应清空已渲染内容。
   - 乱序消息、未知组件、缺失 props、空数据、重复组件更新不能让浏览器崩溃。
   - `callFunction` / `actionResponse` 这类标准 no-op 消息必须可接受。

2. 渲染稳定性
   - 所有 Vizual 组件和 A2UI 原语要么渲染有意义内容，要么局部可恢复失败。
   - 空 artifact、空 root、大面积底部空白、文本重叠、布局溢出都是失败。

3. 视觉质量
   - 截图必须检查密度、层级、间距、对比度、可读性和设计完整度。
   - 输出不能像 debug 页面、占位图或未完成模板。

4. 交互覆盖
   - 按钮、复选框、文本输入、选择器、滑块、Tabs、表单、DocView、AI 更新卡片、导出按钮都要经过真实浏览器输入事件。
   - Agent 后续追问必须能更新当前可见 artifact，不能丢状态或另起无关图。

5. 真实 Agent 覆盖
   - 固定页面 `validation/vizual-test.html?cold-start-codex=...` 只能算回归测试，不能算最终验收。
   - 最终验收必须有真实外部 Agent 参与，例如 `codex exec -m gpt-5.3-codex`，或者通过 Open Design daemon 让本地 CLI Agent 回复。
   - Agent 必须按真实用户问题生成回复，浏览器再渲染 Agent 输出，而不是页面写死分支。

## 是否复用 Open Design Daemon

结论：可以复用，而且长期应该复用，但要把职责分清。

适合复用的部分：

- Agent 发现：`/api/agents`
- Agent 运行：`/api/runs`
- SSE 事件流：`/api/runs/:id/events`
- 取消/恢复 run；
- CLI 适配层：Claude Code、Codex 等；
- cwd、skill、design system、模型参数、权限边界；
- daemon 作为本地浏览器和本地 CLI Agent 之间的稳定桥。

不能直接复用的部分：

- 不能用 OD 的 artifact 协议替代 Vizual runtime；
- 不能让 OD 的 HTML/PPT 生成链路吞掉 Vizual 的 A2UI/Vizual JSON 输出；
- 不能把 daemon 健康检查当作 Vizual 渲染验收；
- 不能依赖错误端口。历史上 `7456` 可能指向错误 daemon 并返回 `401 Unauthorized: valid Bearer token required`，要以实际 `/api/health`、`/api/agents`、`/api/runs` 验证为准。

建议路线：

1. Vizual 页面保留自己的 renderer：`A2UIBridge`、`renderVizInMsg`、`renderArtifactInMessage`、`DocView`、导出。
2. 新增/修正一个 Vizual 专用 daemon adapter：浏览器输入自然语言 -> OD daemon `/api/runs` -> 本地 CLI Agent 真实回复 -> 解析 A2UI/Vizual JSON -> Vizual 渲染。
3. 最终用户验收使用这个真实对话入口，而不是固定回归页。
4. 固定回归页继续保留，用来做 CI/回归和边缘 case。

## 当前证据

截至当前记录：

- 单元测试、typecheck、build 已通过；
- `20260515-real-agent-final-r2`：真实 GPT-5.3/Codex 冷启动浏览器验收通过；
- `20260515-browser-final-r1`：固定浏览器回归通过；
- `20260515-human-input-cua-r5`：headless Chrome 输入事件验收通过；
- `20260515-human-input-headed-r1`：headed Chrome 可见浏览器输入事件验收通过。
- `20260515-od-daemon-long-r5`：通过 OD daemon 调 Codex CLI / `gpt-5.3-codex` 的 3 场景长测通过，结果 3 pass / 0 fail；
- 真实用户验收页已可用：`http://127.0.0.1:8794/validation/daemon-vizual-chat.html`。

详细证据见：[acceptance-evidence-2026-05-15.md](/Users/wu/Documents/vizual-research/vizual-compare/validation/acceptance-evidence-2026-05-15.md)。

## 下一步验收目标

现在“让用户亲自验收”的入口已经改成：

1. 打开真实 Agent 对话页；
2. 用户输入自然语言；
3. OD daemon 或 Codex runner 调用真实 Agent；
4. Agent 回复文本 + A2UI/Vizual JSON；
5. 页面渲染 artifact；
6. 用户手动点击、输入、拖动、导出、追问修改；
7. 记录截图和 run 证据。

当前验收页命令：

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare
node validation/daemon-acceptance-server.mjs --port 8794 --daemon http://127.0.0.1:7456
```

当前验收地址：

```text
http://127.0.0.1:8794/validation/daemon-vizual-chat.html
```

只有这条链路继续通过，才算用户视角验收。
