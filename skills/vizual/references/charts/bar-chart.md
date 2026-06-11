# BarChart

Element type: `"BarChart"` | Props type: `"bar"`

Column chart with grouped, stacked, and horizontal variants.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"bar"` | yes | fixed literal |
| title | string | no | chart title |
| encoding | object | no | preferred field mapping, e.g. `{x:{field:"month"}, y:{field:"sales"}, color:{field:"channel"}}` |
| measures | object[] | no | preferred numeric series list for multiple bars |
| x | string | no | compatibility shortcut for X axis field name |
| y | string \| string[] | no | compatibility shortcut for Y axis field(s) |
| data | object[] | yes | data array, each item is { key: value } |
| stacked | boolean | no | stack series |
| horizontal | boolean | no | rotate axes |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "BarChart",
  "props": {
    "type": "bar",
    "title": "月度销售",
    "data": [
      { "month": "1月", "sales": 120 },
      { "month": "2月", "sales": 135 },
      { "month": "3月", "sales": 168 }
    ],
    "encoding": {
      "x": { "field": "month", "type": "ordinal" },
      "y": { "field": "sales", "type": "quantitative" }
    },
    "stacked": false,
    "horizontal": false
  },
  "children": []
}
```

Multi-series:

```json
{
  "type": "BarChart",
  "props": {
    "type": "bar",
    "title": "季度收入",
    "data": [
      { "quarter": "Q1", "online": 80, "offline": 40 },
      { "quarter": "Q2", "online": 120, "offline": 80 }
    ],
    "encoding": { "x": { "field": "quarter", "type": "ordinal" } },
    "measures": [
      { "field": "online", "label": "线上", "mark": "bar" },
      { "field": "offline", "label": "线下", "mark": "bar" }
    ],
    "stacked": true
  },
  "children": []
}
```
