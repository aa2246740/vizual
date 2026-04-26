# DocView Agent 集成指南

DocView 是一个支持 AI Agent 批注修订循环的文档视图 SDK。它不负责调用 LLM；宿主/Agent 负责监听事件、调用模型、生成修订提案，再通过 DocView controller 写回提案或应用修改。

## 架构概览

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   DocView    │ onReviewAction │   Agent      │  LLM API│  AI Model │
│ Review SDK   │ ──────────────→│  Host/Bridge │ ───────→│          │
│              │ ←──────────────│              │ ←───────│          │
│              │ controller API │              │         │          │
└──────────────┘         └──────────────┘         └──────────────┘
```

通信由宿主/Agent 负责。可以用 HTTP、WebSocket、SSE、浏览器 `evaluate_script` 或本地 bridge。DocView 只提供稳定的 review 状态机和 UI。

## DocView 提供的 API

### 1. Review SDK controller

宿主通过 `controllerRef` 获得一个可命令式调用的 controller。Agent 根据用户批注生成 revision proposal，然后调用 controller 写回 DocView。

```tsx
const controllerRef = useRef<DocViewReviewController | null>(null)

<DocView
  sections={sections}
  showPanel={true}
  controllerRef={controllerRef}
  onSectionsChange={setSections}
  onReviewAction={async (event) => {
    if (event.type === 'threadsSubmitted') {
      const response = await fetch('/api/agent/revise', {
        method: 'POST',
        body: JSON.stringify(event),
      })
      const proposal = await response.json()
      controllerRef.current?.createRevisionProposal(proposal)
    }
  }}
/>
```

Controller methods:

- `createThread(input)`
- `addComment(threadId, body, author?)`
- `submitThreads(threadIds?)`
- `createRevisionProposal({ fromThreadIds, summary, patches, author?, risk? })`
- `acceptRevision(proposalId)`
- `rejectRevision(proposalId, reason?)`
- `applyRevision(proposalId)`
- `resolveThread(threadId)`
- `reopenThread(threadId)`
- `deleteThread(threadId)`
- `exportReviewState()`

### 2. onReviewAction events

`onReviewAction` 是新 SDK 的主事件入口。旧的 `onAction(name, params)` 仍保留兼容，但新 Agent 应优先使用 `onReviewAction`。

| event.type | 触发时机 | 关键字段 |
|------------|----------|----------|
| `threadCreated` | 用户添加批注线程 | `{ thread, sectionContext? }` |
| `commentAdded` | 线程追加回复 | `{ thread, comment }` |
| `threadsSubmitted` | 用户批量/单条提交线程 | `{ threads, sectionContexts }` |
| `revisionProposalCreated` | Agent 写回修订提案 | `{ proposal, threads }` |
| `revisionAccepted` | 用户/宿主接受提案 | `{ proposal, threads }` |
| `revisionRejected` | 用户/宿主拒绝提案 | `{ proposal, threads }` |
| `revisionApplied` | 提案 patch 已应用，生成新 sections | `{ proposal, sections, threads }` |
| `threadDeleted` | 删除线程 | `{ thread }` |

### 3. Review data model

批注不是单条 note，而是 review thread：

```ts
interface AnnotationThread {
  id: string
  anchor: AnnotationAnchor
  comments: AnnotationComment[]
  status: 'open' | 'submitted' | 'in_progress' | 'proposed' | 'resolved' | 'rejected' | 'orphaned'
  color: AnnotationColor
  type?: 'comment' | 'question' | 'change_request' | 'issue' | 'suggestion'
  priority?: 'low' | 'medium' | 'high'
}
```

Anchor 是 Agent 理解用户点哪里/选哪里的关键：

```ts
interface AnnotationAnchor {
  sectionId?: string
  sectionIndex: number
  targetType: 'text' | 'heading' | 'chart' | 'kpi' | 'table' | 'callout' | 'component' | 'markdown' | 'freeform'
  targetId?: string
  targetPath?: string
  label: string
  textRange?: { start: number; end: number; selectedText: string; quoteBefore?: string; quoteAfter?: string }
  chartDataPoint?: { seriesIndex: number; dataIndex: number; name: string; value: string | number }
  tableCell?: { rowIndex: number; columnIndex: number; rowKey?: string | number; columnKey?: string; value?: unknown }
}
```

Agent 返回 revision proposal，而不是直接改文档：

```ts
interface RevisionProposal {
  fromThreadIds: string[]
  summary: string
  patches: SectionPatch[]
  author?: { id: string; name?: string; role: 'agent' }
  risk?: 'low' | 'medium' | 'high'
}

type SectionPatch =
  | { op: 'updateSection'; sectionId?: string; sectionIndex?: number; updates: Partial<Section> }
  | { op: 'replaceSection'; sectionId?: string; sectionIndex?: number; section: Section }
  | { op: 'insertSection'; afterSectionId?: string; sectionIndex?: number; section: Section }
  | { op: 'deleteSection'; sectionId?: string; sectionIndex?: number }
```

**SectionContext 结构**（批注事件附带的上下文信息）：

```typescript
interface SectionContext {
  sectionIndex: number   // 在 sections 数组中的索引（0-based）
  sectionType: string    // "heading", "text", "chart", "kpi", "markdown" 等
  title?: string         // 如果是 heading 类型，返回标题文本
  aiContext?: string     // section 上设置的 aiContext 字段
  contentSummary: string // 自动生成的摘要，例如 "Revenue: $12.3M (+15%)"、
                         // "title, 3 series, 24 points" 等
}
```

- `sectionContexts`：所有 section 的上下文映射（annotationAdded 事件）
- `sectionContext`：被批注的单个 section 上下文（所有修订相关事件）

**aiContext 最佳实践**：在 section 上设置 `aiContext` 字段，为 AI Agent 提供语义描述。例如：
- KPI section: `"Revenue: $12.3M, +15% YoY growth"`
- Chart section: `"Bar chart of quarterly revenue, 4 data points"`
- Markdown section: `"Executive summary with 3 key findings"`

这些描述会出现在 `sectionContext.aiContext` 中，让 AI 在处理批注时获得更精确的上下文。

### 4. Applying revisions

`applyRevision(proposalId)` 会根据 proposal patches 生成新 sections，并通过 `onSectionsChange(nextSections)` 交给宿主。宿主负责持久化。

```tsx
const [sections, setSections] = useState(initialSections)
const controllerRef = useRef<DocViewReviewController | null>(null)

<DocView
  sections={sections}
  controllerRef={controllerRef}
  onSectionsChange={setSections}
/>
```

### 5. 批注状态生命周期

```
open → submitted → proposed → resolved
                    ↓          ↑
                 rejected      applied
                    ↓
                 orphaned
```

- **open**: 用户刚添加，未提交
- **submitted**: 已提交给 Agent
- **proposed**: Agent 已返回修订提案
- **resolved**: 用户/宿主已处理
- **rejected**: 修订提案被拒绝
- **orphaned**: 文档修改后锚点文本已不存在

## 集成模式

### 模式 A: Browser/Local Agent Bridge

适合 `validation/vizual-test.html`、Codex/Claude Code、Playwright、Chrome DevTools 等场景。Agent 在页面上下文拿到 controller，然后按事件驱动工作。

```js
let controller = null

renderDocView({
  controllerRef: (c) => { controller = c },
  onReviewAction: async (event) => {
    if (event.type !== 'threadsSubmitted') return
    const proposal = await callYourAgent(event)
    controller.createRevisionProposal(proposal)
  },
  onSectionsChange: persistSections,
})
```

### 模式 B: HTTP / WebSocket / SSE

网络协议由宿主决定。关键不是协议，而是 payload：发送 `threadsSubmitted` 事件，接收 `RevisionProposal`，再调用 controller。

```ts
async function handleReviewAction(event: DocViewReviewActionEvent) {
  if (event.type !== 'threadsSubmitted') return
  const proposal = await fetch('/api/agent/revise', {
    method: 'POST',
    body: JSON.stringify(event),
  }).then(r => r.json())
  controllerRef.current?.createRevisionProposal(proposal)
}
```

### 模式 C: Fully Controlled SDK State

生产应用建议控制 `sections`、`threads`、`revisionProposals`，并持久化到后端。

```tsx
<DocView
  sections={sections}
  onSectionsChange={setSections}
  threads={threads}
  onThreadsChange={setThreads}
  revisionProposals={revisionProposals}
  onRevisionProposalsChange={setRevisionProposals}
  controllerRef={controllerRef}
  onReviewAction={handleReviewAction}
/>
```

## Sections 数据格式

DocView 的 sections 数组是 Agent 和前端之间的数据契约：

```typescript
sections: [
  { type: 'heading', content: '标题文字', level: 1, aiContext: '报告主标题' },
  { type: 'text', content: '段落内容...' },
  { type: 'markdown', content: '## 重点摘要\n\n- **收入** 超出目标 12%\n- 新市场：东南亚、拉丁美洲\n\n> 战略合作贡献了 40% 的新增长。' },
  { type: 'kpi', content: '', layout: 'grid', aiContext: '三个核心KPI指标', data: { metrics: [
    { label: '指标名', value: '128万', change: '+12.3%', color: '#3b82f6' },
  ]}},
  { type: 'chart', title: '图表标题', content: '', data: {
    chartType: 'BarChart',
    x: 'month',
    y: 'sales',
    data: [{ month: '1月', sales: 100 }, { month: '2月', sales: 200 }],
  }},
  { type: 'table', content: '', data: {
    columns: ['列1', '列2'],
    rows: [['值1', '值2']],
  }},
  { type: 'callout', content: '提示内容', layout: 'banner', variant: 'info' },
  { type: 'component', content: '', data: { componentType: 'BarChart', x: 'month', y: 'sales', data: [{ month: '1月', sales: 120 }, { month: '2月', sales: 200 }] } },
]
```

Agent 修订时应该返回 `RevisionProposal`，不要直接覆盖 sections。

## Agent 修订提示词建议

给模型的任务应该是“返回 revision proposal”，不是“返回完整新文档”：

```text
你是 DocView 文档修订 Agent。
输入包含 threadsSubmitted 事件、threads、anchors、sectionContexts 和当前 sections。
请返回 JSON：
{
  "fromThreadIds": ["..."],
  "summary": "这次修订做了什么",
  "patches": [
    { "op": "updateSection", "sectionId": "intro", "updates": { "content": "..." } }
  ],
  "author": { "id": "agent", "role": "agent" },
  "risk": "low"
}
不要返回 Markdown，不要直接返回完整 HTML。
```

## Legacy onAction

`onAction` 仍然会收到 `annotationAdded`、`batchSubmit`、`requestRevision`、`revisionApplied` 等兼容事件。新接入不要依赖它；新 Agent 应使用 `onReviewAction + controllerRef`。
