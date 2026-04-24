# BarChart

Element type: `"BarChart"` | Props type: `"bar"`

Column chart with grouped, stacked, and horizontal variants.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"bar"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | yes | X axis field name |
| y | string \| string[] | yes | Y axis field(s). Array = multiple series |
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
    "x": "month",
    "y": "sales",
    "data": [
      { "month": "1月", "sales": 120 },
      { "month": "2月", "sales": 135 },
      { "month": "3月", "sales": 168 }
    ],
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
    "x": "quarter",
    "y": ["online", "offline"],
    "data": [
      { "quarter": "Q1", "online": 80, "offline": 40 },
      { "quarter": "Q2", "online": 120, "offline": 80 }
    ],
    "stacked": true
  },
  "children": []
}
```
