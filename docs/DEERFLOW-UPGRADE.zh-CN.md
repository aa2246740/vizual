# 旧版 DeerFlow 接入升级指南

这份文档给已经接入过旧版 Vizual 的 DeerFlow 项目使用。目标不是让
DeerFlow 变成特殊适配，而是让它成为一个标准 Vizual 宿主：Agent 自己判断什么时候用可视化，后端只暴露一个稳定的展示工具，前端只渲染已经验收通过且真实可见的 Vizual surface。

## 升级范围

这几块必须一起更新：

- 前端依赖：安装当前 `vizual` 包。
- 后端工具：保留一个 `present_vizual_ui`，返回可被 Agent 修复的结果。
- Agent prompt / tool schema：暴露当前 native catalog，不要继续用旧白名单。
- 聊天渲染：从消息历史中抽取成功的 Vizual tool call，再用 `VizualRenderer` 渲染。
- Action bridge：把有意义的 UI action 作为内部消息回传给 Agent。
- 验收测试：必须看真实浏览器渲染，不能只看 `ok: true`。

不要只升级前端，也不要只改 prompt。半套升级很容易出现“前端以为渲染了，但用户实际看不到图”或者“先失败再用 Mermaid 假装成功”的问题。

## 1. 升级包

正常项目：

```bash
pnpm --dir frontend add vizual@latest
pnpm --dir frontend install
```

如果要在 npm 发布前用本地包验证：

```bash
pnpm --dir frontend add "vizual@file:/absolute/path/to/vizual"
pnpm --dir frontend install
```

升级后必须重启所有加载过旧代码的服务。DeerFlow 常见会缓存旧代码的地方包括 LangGraph、Next.js/Turbopack、gateway 进程。只改磁盘文件、不重启服务，会继续复现旧版问题。

## 2. 后端工具契约

保留一个工具名：`present_vizual_ui`。它应该接受这些真实 Agent 常见输出：

- Vizual native payload
- A2UI message
- AG-UI event / event stream
- `vizual.native.v1` create-surface envelope
- Agent 修复后的再次尝试

如果 DeerFlow 后端是 TypeScript，直接用 SDK：

```ts
import { createVizualAgentToolDefinition, renderVizualAgentInput } from 'vizual'

export const presentVizualUiTool = createVizualAgentToolDefinition({
  includeCatalogManifest: true,
})

export async function presentVizualUi(args: {
  input: unknown
  surfaceId?: string
  fallbackText?: string
  display?: unknown
}) {
  const result = renderVizualAgentInput(args.input, {
    surfaceId: args.surfaceId,
    fallbackText: args.fallbackText,
    display: args.display,
  })

  return {
    schema: 'vizual.agent.tool_result.v1',
    ok: result.ok,
    toolName: 'present_vizual_ui',
    surfaceId: result.envelope.surfaceId,
    envelope: result.envelope,
    issues: result.preview.issues,
    renderEvidence: result.preview.summary,
    repairInstructions: result.ok
      ? []
      : ['请使用受支持的 Vizual native 组件重建 payload。'],
  }
}
```

如果 DeerFlow 后端是 Python，不要长期维护另一套手写 catalog。更稳的做法是：

- 通过一个很薄的 Node bridge 调 `renderVizualAgentInput`；
- 或者在 CI/readiness script 中从已安装的 `vizual` 包生成/比对 backend catalog。

Python 侧最低要求：

- `SUPPORTED_NATIVE_COMPONENTS` 必须和当前 Vizual catalog 一致。
- 图表家族要包含 Radar、Waterfall、Boxplot、Histogram、XMR、Sankey、Funnel、Heatmap、Calendar、Sparkline、Dumbbell、Bubble、Combo、Mermaid。
- 已移除组件必须保持 unsupported：DocView、GridLayout、SplitLayout、FreeformHtml、HeroLayout、Modal、Kanban、AuditLog。
- `ok: false` 必须返回 issues 和 repair instructions，让 Agent 有机会修复。
- 失败的内部尝试可以保存在 tool history 中给 Agent 使用，但不能作为最终用户可见的 Vizual 卡片展示。

## 3. Agent Prompt 和工具目录

从当前 Vizual catalog 重新生成或刷新 prompt/tool schema，不要复制旧版组件白名单。

Prompt 必须保留这些规则：

- 用户自然提问，Agent 自己判断可视化是否有帮助。
- 分析、对比、诊断、仪表盘、表单、时间线、组织图、甘特图等场景适合用 Vizual。
- 用户明确只要文字时，不要强塞 UI。
- 用户明确要求网页、HTML、React、游戏、SVG、自定义 App 时，不要强行套 native core。
- Mermaid 用于流程图、关系图、序列图等 diagram；不要把 Mermaid `xychart` 当成 RadarChart、BarChart 等原生图表的 fallback。
- UI action 必须是有意义的 host event，不要假装能保存、审批、派单、写库或调用不存在的银行系统。

旧版典型错误信号：

```text
RadarChart 不在原生组件目录中，我用 Mermaid 来呈现。
```

这通常说明运行中的后端工具或 prompt 仍然是旧版，即使磁盘代码看起来已经更新。

## 4. 前端聊天渲染

前端不能只因为 assistant 文本说“已渲染”或 tool result `ok: true` 就展示成功。应该从聊天历史中抽取 Vizual presentations，只渲染通过 SDK renderability gate 的结果。在 Vizual Core 里，`ok: true` 只是 tool transport/result 状态；聊天前端还必须要求 native preview 成功并拿到真实 spec。

推荐流程：

```tsx
import {
  VizualRenderer,
  extractVizualPresentations,
  selectRenderableVizualPresentations,
  previewVizualNativeInput,
  buildVizualActionMessage,
} from 'vizual'

const presentations = selectRenderableVizualPresentations(
  extractVizualPresentations(messages),
)

for (const presentation of presentations) {
  const preview = previewVizualNativeInput(presentation.input, {
    surfaceId: presentation.surfaceId,
  })

  if (!preview.ok) {
    // 只记录开发/遥测。除非最终回答确实无法渲染，否则不要把失败内部卡片展示给用户。
    continue
  }

  render(
    <VizualRenderer
      spec={preview.spec}
      onAction={(name, params, currentState) => {
        sendInternalUserMessage(
          buildVizualActionMessage({
            presentation,
            action: name,
            params,
            currentState,
          }),
        )
      }}
      onRenderReceipt={(receipt) => {
        recordVizualRenderReceipt(presentation.surfaceId, receipt)
      }}
    />,
  )
}
```

DeerFlow 里通常要重点看这些文件：

- `frontend/src/components/workspace/messages/message-list.tsx`
- `frontend/src/components/workspace/messages/vizual-inline.tsx`
- 负责隐藏内部 action message 的 message utility

前端规则：

- 不要把失败 repair attempt 展示成普通 AI 卡片。
- 不能只根据 `ok: true` 显示“已渲染”；至少要有 accepted tool result 和实际挂载的 renderer。
- 这些可见性错误要当成真实问题：
  - `expected-chart-host-missing`
  - `expected-chart-canvas-missing`
  - `expected-chart-not-painted`
- Action 回传消息要作为内部消息，不要污染普通用户对话。

## 5. Action Bridge

Vizual 只发事件，DeerFlow 决定事件含义。

当前建议支持：

- `submitForm`
- `applyFilter`
- `drillDown`
- `selectLocation`
- `updatePlan`

每个 action 都应该转成一条内部 follow-up message 交给 Agent。不要让 Vizual 自己假装完成保存、审批、派单、开工单或调用银行内部系统。

## 6. Readiness Gate

建议新增或更新一个 fail-closed readiness script，至少检查：

- `present_vizual_ui` 已注册到 built-in tools。
- 后端支持组件和已安装 Vizual catalog 一致。
- 所有支持图表家族都能通过后端工具。
- 已移除组件返回稳定 unsupported-component error。
- 前端从 `vizual` 导入 `VizualRenderer`。
- 前端只渲染 accepted tool call，不渲染每一次失败尝试。
- 失败内部尝试不会作为最终用户卡片展示。

示例命令：

```bash
pnpm --dir frontend typecheck
backend/.venv/bin/python -m pytest backend/tests/test_present_vizual_ui_tool.py
python scripts/check-vizual-deerflow-ready.py
```

如果 DeerFlow 项目实际命令不同，以项目内命令为准。

## 7. 浏览器验收

JSON 测试必要，但不充分。必须在真实 DeerFlow 页面里验收，最好就是用户实际打开的聊天页。

用自然语言新题目，不要用已经写死答案的脚本：

1. 银行网点经营诊断：多个网点、排行、KPI、图表、风险提示。
2. 网点能力对标：要求适合时用雷达图；确认是原生 `RadarChart`，不是 Mermaid `xychart`。
3. 排队/窗口/排班 what-if：只有参数调整确实有用时才用 FormBuilder 或控件。
4. 项目进度：让 Agent 生成甘特图视图。
5. 组织或责任诊断：让 Agent 使用组织图或时间线。
6. A2UI 路径：确认能归一到同一个 native surface。
7. AG-UI event 路径：确认 stream/event 输入能渲染。
8. 纯文本负向：确认不会强行出现 Vizual 卡片。
9. 显式网页/HTML 负向：确认按照用户创作请求处理，不强塞 native core。
10. 已移除组件旧输入：发送旧 HeroLayout/GridLayout payload，确认稳定失败，并且不会显示成成功卡片。

每个案例记录：

- thread id
- 第一次 `present_vizual_ui` tool result
- 最终浏览器可见状态
- render receipt errors
- 用户是否看到了失败内部卡片

## 常见故障判断

| 现象 | 常见原因 | 修复方向 |
| --- | --- | --- |
| “RadarChart 不在目录”然后退到 Mermaid | 后端进程没重启或旧白名单还在 | 重启 LangGraph/gateway，重新生成 backend catalog |
| 显示“已渲染”但图是空白 | 前端只信 `ok: true`，没有看 render evidence | 接 `VizualRenderer` receipt 和可见性检查 |
| `expected-chart-not-painted` | 图表组件挂载了但 canvas 没画出来 | 修图表 renderer 和 ECharts 容器尺寸 |
| HeroLayout 还会出现 | 旧 prompt/tool schema/package 仍然在线 | 从 prompt、tool schema、backend aliases 删除并重新构建 |
| `VizualInline` 报 `Cannot read properties of undefined` | 前端把畸形 raw input 直接给 renderer | 先 preview/normalize，只渲染 `preview.spec` |
| 用户先看到错误卡片，再看到正确卡片 | 失败 repair attempt 被公开渲染了 | 只渲染 accepted presentations |

## 完成标准

升级完成必须满足：

- 已移除组件不再被导出、提示或接受。
- 支持的图表家族在 DeerFlow 中原生渲染。
- 失败的内部 Vizual 尝试不显示给用户。
- 浏览器验收覆盖数据分析、A2UI、AG-UI、交互、负向案例、已移除组件失败。
- 所有服务从升级后的代码重启过，而不是只改了磁盘文件。

[English version](DEERFLOW-UPGRADE.md)
