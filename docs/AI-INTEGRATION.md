# AI 集成指南 — Vizual

Vizual 是给 AI Agent 产品接入的视觉运行时。Agent 不只返回 Markdown，而是返回 Vizual spec/artifact；宿主前端把它渲染成图表、Dashboard、表格、实时可调面板、可导出报表或可批注文档。

## 适用场景

Vizual 适合：

- 自有 SaaS / B 端系统里的 Agent 对话框
- 类 ChatGPT 的独立 Agent 对话页面
- 数据分析 Agent 的图表、报表和导出结果
- 可被用户批注、由 Agent 修订的长文档 / 报告
- 需要保存历史对话并支持后续追问修改的 Agent 平台

Vizual 不能直接在 ChatGPT / Claude.ai 等封闭消费级聊天界面里渲染，除非该平台集成 Vizual runtime。它不是“让任意聊天机器人直接显示图表”的魔法；它需要一个宿主前端。

## 两层接入

### 1. Agent 层：让 Agent 知道怎么输出

Claude Code 推荐安装 skill：

```bash
cp -R skills/vizual/ ~/.claude/skills/vizual/
cp -R skills/design-md-parser/ ~/.claude/skills/design-md-parser/
cp -R skills/design-md-creator/ ~/.claude/skills/design-md-creator/
```

其他 Agent 可把 `skills/vizual/prompt.md` 作为系统提示，并按需读取 `skills/vizual/references/` 下的组件文档。

### 2. 宿主层：让前端会渲染和回调

宿主前端需要支持：

- 渲染一次性 JSON spec
- 保存 `VizualArtifact` 到聊天记录或业务存储
- 后续追问时基于 artifact targetMap 做 patch
- 导出 PNG/PDF/CSV/XLSX
- 实时可调场景下提供 FormBuilder state bridge
- DocView 场景下接入 review controller 和 revision proposal loop

## 渲染普通 spec

```tsx
import { registry } from 'vizual'
import { Renderer, StateProvider } from '@json-render/react'

function AgentVisual({ spec }) {
  return (
    <StateProvider>
      <Renderer spec={spec} registry={registry} />
    </StateProvider>
  )
}
```

普通数据分析、Dashboard、报表默认用宿主文本 + `GridLayout` / charts / `KpiDashboard` / `DataTable`。不要因为用户说“报告”就使用 DocView。

## 保存可追问 Artifact

当用户之后可能会说“这张图改成折线图”“只看华东区”“导出 PDF”时，保存 artifact，而不是只保存原始 JSON。

```ts
import { createHostRuntime, createMemoryArtifactStore } from 'vizual'

const runtime = createHostRuntime({
  store: createMemoryArtifactStore(),
  renderArtifact: async (artifact, container) => {
    // 宿主用自己的 React root + Renderer 渲染 artifact.spec
    renderVizualSpec(artifact.spec, container)
    return { artifact }
  },
})

const artifact = await runtime.renderMessageArtifact({
  conversationId,
  messageId,
  prompt: userText,
  spec: aiSpec,
  container,
})

const updated = await runtime.updateArtifact(artifact.id, [
  { type: 'changeChartType', targetId: 'element:chart', chartType: 'LineChart' },
  { type: 'filterData', targetId: 'element:chart', field: 'region', values: '华东' },
])
```

关键原则：

- 使用 targetMap，不要猜 JSON path。
- follow-up 修改默认生成新的 AI 气泡，旧气泡作为历史保留。
- `mode: 'replace'` 只适合临时预览，不适合真实聊天历史。

## 实时可调图表

实时可调不是纯 JSON spec。宿主需要提供 bridge：左侧 FormBuilder 控件绑定 state，右侧由 `makeSpec(state)` 重新渲染预览。

`validation/vizual-test.html` 的参考 API：

```js
window.renderInteractiveVizInMsg(id, {
  answerText: '可以实时调整图表类型、数据点和品牌色。',
  initialState: {
    controls: { chartType: 'bar', points: 8, brandColor: '#ff6b35' },
  },
  controlsSpec: {
    root: 'controls',
    elements: {
      controls: {
        type: 'FormBuilder',
        props: {
          type: 'form_builder',
          value: { $bindState: '/controls' },
          fields: [
            { name: 'chartType', type: 'select', label: '图表类型', options: ['bar', 'line'] },
            { name: 'points', type: 'slider', label: '数据点', min: 3, max: 15 },
            { name: 'brandColor', type: 'color', label: '主色' },
          ],
        },
        children: [],
      },
    },
  },
  applyTheme: (state, Vizual) => {
    Vizual.loadDesignMd(`Primary: ${state.controls.brandColor}`, { apply: true })
  },
  makeSpec: (state) => ({
    root: 'chart',
    elements: {
      chart: {
        type: state.controls.chartType === 'line' ? 'LineChart' : 'BarChart',
        props: {
          type: state.controls.chartType === 'line' ? 'line' : 'bar',
          x: 'day',
          y: 'value',
          data: makeData(Number(state.controls.points || 8)),
        },
        children: [],
      },
    },
  }),
})
```

多个 interactive artifact 必须隔离 state 和 theme scope。不要让图 1 的颜色选择器影响图 2。

## DocView 批注修订循环

DocView 是 SDK，不会自己调用 LLM。宿主负责把用户批注交给 Agent，Agent 返回 revision proposal。

```tsx
const controllerRef = useRef<Vizual.DocViewReviewController | null>(null)
const [sections, setSections] = useState(initialSections)

<Vizual.DocView
  sections={sections}
  showPanel
  controllerRef={controllerRef}
  onSectionsChange={setSections}
  onReviewAction={async (event) => {
    if (event.type !== 'threadsSubmitted') return
    const proposal = await agent.revise({
      threads: event.threads,
      sectionContexts: event.sectionContexts,
    })
    controllerRef.current?.createRevisionProposal(proposal)
  }}
/>
```

Proposal 示例：

```json
{
  "fromThreadIds": ["thread_123"],
  "summary": "补充下一步行动细节",
  "patches": [
    {
      "op": "updateSection",
      "sectionId": "next-steps",
      "updates": {
        "content": "1. 明确实验负责人...\n2. 设置 7 天观察窗口..."
      }
    }
  ],
  "author": { "id": "agent", "role": "agent" },
  "risk": "low"
}
```

在 `validation/vizual-test.html` 中测试 DocView 时，使用：

- `renderDocViewInMsg(id, config)`
- `createDocViewThread(ref, input)`
- `submitDocViewThreads(ref, threadIds?)`
- `getDocViewReviewState(ref?)`
- `createDocViewRevision(ref, input)`
- `applyDocViewRevision(ref, proposalId?)`

## 导出

宿主可以按 artifact 导出：

```js
await window.exportArtifact(artifact.id, { format: 'pdf', filename: 'report' })
await window.exportArtifact(artifact.id, { format: 'xlsx', filename: 'data' })
```

库级 API：

```ts
import { exportElement, exportDataToXLSX, downloadBlob } from 'vizual'

const pdf = await exportElement(element, 'pdf', { filename: 'report' })
const xlsx = await exportDataToXLSX(rows, { sheetName: '明细' })

await downloadBlob(pdf, 'report.pdf')
await downloadBlob(xlsx, 'data.xlsx')
```

## 冷启动验收

主验收页面是 `validation/vizual-test.html`。它模拟真实 Agent 聊天宿主，覆盖：

- 乱格式数据解析并渲染 Dashboard
- 历史追问改图，新气泡保留旧历史
- 实时调参和品牌色变更
- 多个 interactive artifact 隔离
- ComboChart、Scatter、Histogram、Calendar、Dumbbell、Mermaid 等复杂图
- DocView 批注、提交、修订 proposal、apply、resolved
- 普通 dashboard 和 DocView 导出

文档分工：

| 文件 | 给谁 | 说明 |
| --- | --- | --- |
| `COLD_START_BLIND_TEST.md` | 被测 Agent | 只包含任务和约束。Agent 需要自己读 skill、自己操作 `vizual-test.html`、自己写 QA 报告。 |
| `COLD_START_ACCEPTANCE_GUIDE.md` | 测试主持人 / 维护者 | 包含验收标准和预期结果。不要给被测 Agent，否则测试会失真。 |

最小执行流程：

1. 安装 `skills/vizual/` 到被测 Agent 环境。
2. 在仓库根目录运行 `python3 -m http.server 8793`。
3. 打开 `http://127.0.0.1:8793/validation/vizual-test.html`，并让 Chrome DevTools MCP 或等价能力连接同一个可见页面。
4. 开一个全新 Agent 会话，只给它 `COLD_START_BLIND_TEST.md`。
5. Agent 必须在可见页面里输入测试消息、读取 `window.getPendingMessage()`、调用页面 bridge API，并提交 Markdown QA 报告。
