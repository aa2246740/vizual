# DocView

Element type: `"DocView"` | Props type: `"doc_view"`

Interactive document with mixed sections and annotation support.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"doc_view"` | yes | fixed literal |
| title | string | no | document title |
| sections | Section[] | yes | array of document sections |
| showPanel | boolean | no | show annotation panel sidebar (default true) |
| panelPosition | `"right"` \| `"left"` \| `"bottom"` | no | panel position (default right) |

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
