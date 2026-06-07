# ComboChart

Element type: `"ComboChart"` | Props type: `"combo"`

Vizual native mixed chart. Use it for one coordinate system that combines bars,
lines, and optional scatter markers. Do **not** output ECharts/Chart.js options;
the runtime renders this native spec.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"combo"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string \| string[] | no | Shortcut Y field(s). First field = bar series, rest = line series |
| data | object[] | yes | data array |
| series | `ComboSeries[]` | no | Explicit bar/line/scatter mapping. Use this for dual-axis or dense mixed charts |
| bar | string[] | no | Bar series fields, shorthand for simple cases |
| line | string[] | no | Line series fields, shorthand for simple cases |
| scatter | string[] | no | Scatter series fields, shorthand for simple cases |
| scatterFields | string[] | no | Alias for scatter |
| leftAxisName | string | no | Left Y axis label |
| rightAxisName | string | no | Right Y axis label |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

`ComboSeries`:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"bar"` \| `"line"` \| `"scatter"` | yes | Visual layer type |
| y | string | yes | Data field for the value |
| name | string | no | Legend label |
| yAxisIndex | `0` \| `1` | no | `0` = left axis, `1` = right axis |
| size | string | no | Data field controlling scatter point size |
| sizeField | string | no | Alias for size |
| r | string | no | Alias for size |

Use `y` as an array only for simple bar + line charts. Use `series` for mixed
bar/line/scatter, dual Y axes, or when labels must be precise.

## Direct Vizual Spec Example

```json
{
  "root": "chart",
  "elements": {
    "chart": {
      "component": "ComboChart",
      "props": {
        "type": "combo",
        "title": "研发投入与质量风险",
        "x": "week",
        "leftAxisName": "研发投入工时",
        "rightAxisName": "崩溃率 / 流失率 (%)",
        "data": [
          { "week": "W1", "hours": 420, "crashRate": 1.2, "churnRate": 0.5 },
          { "week": "W2", "hours": 450, "crashRate": 1.1, "churnRate": 0.4 }
        ],
        "series": [
          { "name": "研发投入工时", "type": "bar", "y": "hours", "yAxisIndex": 0 },
          { "name": "系统崩溃率", "type": "line", "y": "crashRate", "yAxisIndex": 1 },
          { "name": "用户流失率", "type": "scatter", "y": "churnRate", "size": "churnRate", "yAxisIndex": 1 }
        ]
      }
    }
  }
}
```

## Compact Element Example

```json
{
  "type": "ComboChart",
  "props": {
    "type": "combo",
    "title": "收入 vs 增长率",
    "x": "month",
    "y": ["revenue", "growth"],
    "data": [
      { "month": "1月", "revenue": 120, "growth": 15 },
      { "month": "2月", "revenue": 135, "growth": 12 }
    ]
  },
  "children": []
}
```
