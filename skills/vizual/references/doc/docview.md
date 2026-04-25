# DocView

Element type: `"DocView"` | Props type: `"doc_view"`

Interactive document with mixed sections and annotation support.

## When to Use DocView

Use DocView when the **document interaction** is part of the requirement:

- The user asks for annotations, comments, highlighting, review, revisions, or version history.
- The output should be a self-contained reviewable document artifact, not just a chart/dashboard/report in a chat message.
- The host app supports DocView callbacks such as `onAction`, annotation panel submission, or an AI revision loop.

Do **not** use DocView just because the user says "report", "analysis", "summary", or "export". For ordinary chat answers, dashboards, and exportable reports, render visuals with `GridLayout`/charts/KPIs/tables, put narrative explanation in the host message text, and use artifact export APIs when needed.

## Interacting With a Rendered DocView

If the task is to test or operate an existing DocView page, do not replace it with a new spec. Use the rendered UI:

1. Click the target section, KPI card, chart, table cell/row, or select text inside a text/markdown section.
2. Wait for the annotation popup.
3. Type the annotation or requested revision.
4. Confirm the popup.
5. Check that the annotation appears in the panel and the target is highlighted.
6. For revision workflows, submit the batch or request revision from the panel so the host receives the `onReviewAction` / legacy `onAction` event.

The host should receive `annotationAdded` payloads with target metadata such as section id/type, target kind, and target label when available.

## Agent Review SDK Contract

DocView is an SDK surface for AI-agent document review. It does **not** call an LLM by itself.

Host/Agent integration flow:

1. Host renders DocView with `controllerRef`, `onReviewAction`, and usually controlled `sections`.
2. User creates review threads by selecting text or clicking chart/KPI/table targets.
3. User submits threads from the panel.
4. Host receives `onReviewAction({ type: "threadsSubmitted", threads, sectionContexts })`.
5. Agent reads the thread anchors and section contexts, calls its model, and returns a `RevisionProposal`.
6. Host calls `controller.createRevisionProposal(proposal)`.
7. User or host calls `controller.applyRevision(proposalId)` or `controller.rejectRevision(proposalId)`.
8. `applyRevision` emits `onSectionsChange(nextSections)`; host persists the updated sections.

Important: realtime review/revision is not a pure JSON spec feature. The Agent must operate as a host/bridge and call the page/controller APIs. Without JS evaluation or host callbacks, it can only generate a static DocView spec.

In `validation/vizual-test.html`, prefer the built-in DocView bridge:

```js
const id = window.createAiMsg();
window.streamText(id, '我生成了一份可批注报告。');
window.finishText(id);
const artifact = window.renderDocViewInMsg(id, {
  sections,
  showPanel: true,
});

// After the user submits annotations:
const state = window.getDocViewReviewState(artifact.id);
const submitted = state.threads.filter(t => t.status === 'submitted');
window.createDocViewRevision(artifact.id, {
  fromThreadIds: submitted.map(t => t.id),
  summary: 'Apply requested document revisions',
  patches: [
    { op: 'updateSection', sectionId: 'exec-summary', updates: { content: 'Updated summary text.' } },
  ],
});
```

Do not overwrite the DocView directly after a user comment. The loop is: user annotates → user submits → Agent creates a revision proposal → user/host applies or rejects.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"doc_view"` | yes | fixed literal |
| title | string | no | document title |
| sections | Section[] | yes | array of document sections |
| showPanel | boolean | no | show annotation panel sidebar (default true). Use `true` for annotation workflows, `false` only for read-only document previews |
| panelPosition | `"right"` \| `"left"` \| `"bottom"` | no | panel position (default right) |

Host-only SDK props:

| Prop | Type | Description |
|------|------|-------------|
| controllerRef | function/ref | receives `DocViewReviewController` |
| onReviewAction | function | typed review events: `threadCreated`, `threadsSubmitted`, `revisionProposalCreated`, `revisionApplied`, etc. |
| onSectionsChange | function | receives next sections when `applyRevision()` applies proposal patches |
| threads / onThreadsChange | controlled state | optional controlled review threads |
| revisionProposals / onRevisionProposalsChange | controlled state | optional controlled revision proposals |

## Section Types

| type | content | data | Description |
|------|---------|------|-------------|
| heading | string (heading text) | - | Section heading. Supports `level: 1-6` |
| text | string (paragraph text) | - | Text paragraph |
| kpi | "" | { metrics: [{label, value, trend, trendValue}] } | KPI dashboard cards |
| chart | "" | { chartType, x, y, data, ... } | Embedded chart |
| table | "" | { columns: [{key, label}], data: [...] } | Data table |
| callout | string (callout text) | - | Highlighted callout/alert note |
| component | "" | { componentType, ...props } | Embedded vizual component |
| markdown | string (markdown content) | - | Renders markdown |
| freeform | string (HTML with inline CSS) | - | Arbitrary HTML (blocks class attr and event handlers) |

Every section may include optional `id`. Use stable IDs when the document can be revised:

```json
{ "id": "exec-summary", "type": "text", "content": "..." }
```

Agents should prefer `sectionId` over `sectionIndex` when creating revision patches.

## Revision Proposal Shape

Agents should return proposals, not direct document overwrites:

```json
{
  "fromThreadIds": ["thread_123"],
  "summary": "Clarify the churn explanation and update the risk callout.",
  "patches": [
    {
      "op": "updateSection",
      "sectionId": "risk-callout",
      "updates": { "content": "Churn risk remains elevated because..." }
    }
  ],
  "author": { "id": "agent", "role": "agent" },
  "risk": "low"
}
```

Supported patch ops: `updateSection`, `replaceSection`, `insertSection`, `deleteSection`. Prefer `sectionId`; use `sectionIndex` only as fallback.

## Embedded Charts in DocView

DocView supports two chart/component embedding patterns:

1. Use a `chart` section for ordinary report charts:

```json
{
  "type": "chart",
  "content": "",
  "data": {
    "chartType": "ComboChart",
    "x": "month",
    "y": ["revenue", "arppu"],
    "data": [
      { "month": "Jan", "revenue": 120, "arppu": 24 },
      { "month": "Feb", "revenue": 140, "arppu": 26 }
    ]
  }
}
```

`chartType` can name any Vizual chart component. For common Cartesian charts, use the same `x` / `y` / `data` contract as the standalone chart references; `ComboChart` may use `y` as an array.

2. Use a `component` section when you need exact standalone component props or a chart shape that is easier to express as a component:

```json
{
  "type": "component",
  "content": "",
  "data": {
    "componentType": "RadarChart",
    "indicators": [
      { "name": "Correctness", "max": 40 },
      { "name": "Insight", "max": 30 }
    ],
    "data": [
      { "name": "Answer", "values": [32, 26] }
    ]
  }
}
```

Do not put a nested `{ "type": "BarChart", "props": { ... } }` object inside a DocView section. Use `chartType` for chart sections or `componentType` for component sections.

## Section layout variants (optional `layout` field on any section)

| Layout | Effect |
|--------|--------|
| default | No special wrapping |
| hero | Gradient background, centered text |
| split | 1:1 two-column grid |
| grid | N-column grid |
| banner | Accent left border + secondary background |
| card | Elevated card with shadow |
| compact | Dense layout, small text |

## Example

```json
{
  "type": "DocView",
  "props": {
    "type": "doc_view",
    "title": "分析报告",
    "showPanel": true,
    "panelPosition": "right",
    "sections": [
      { "type": "heading", "content": "Q1 销售分析", "level": 1 },
      { "type": "text", "content": "本季度整体表现良好..." },
      { "type": "kpi", "content": "", "data": { "metrics": [{ "label": "收入", "value": "$1.2M", "trend": "up", "trendValue": "+15%" }] } },
      { "type": "chart", "content": "", "data": { "chartType": "BarChart", "x": "month", "y": "sales", "data": [{ "month": "1月", "sales": 100 }] } },
      { "type": "table", "content": "", "data": { "columns": [{ "key": "name", "label": "Name" }], "data": [{ "name": "示例" }] } },
      { "type": "callout", "content": "注意：所有数据为初步统计" },
      { "type": "markdown", "content": "## 分析结论\n\n- 收入增长 15%\n- 用户活跃度提升" }
    ]
  },
  "children": []
}
```
