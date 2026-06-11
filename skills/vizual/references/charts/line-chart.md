# LineChart

Element type: `"LineChart"` | Props type: `"line"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"line"` | yes | fixed literal |
| title | string | no | chart title |
| encoding | object | no | preferred field mapping, e.g. `{x:{field:"month"}, y:{field:"revenue"}, color:{field:"client"}}` |
| x | string | no | compatibility shortcut for X axis field |
| y | string \| string[] | no | compatibility shortcut for Y axis field(s) |
| data | object[] | yes | data array |
| smooth | boolean | no | smooth curves |
| multiSeries | boolean | no | enable multi-series mode |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "LineChart",
  "props": {
    "type": "line",
    "title": "增长趋势",
    "data": [
      { "month": "Q1", "revenue": 100, "cost": 60 },
      { "month": "Q2", "revenue": 130, "cost": 70 },
      { "month": "Q3", "revenue": 180, "cost": 85 }
    ],
    "measures": [
      { "field": "revenue", "label": "收入", "mark": "line" },
      { "field": "cost", "label": "成本", "mark": "line" }
    ],
    "encoding": { "x": { "field": "month", "type": "ordinal" } },
    "smooth": true
  },
  "children": []
}
```
