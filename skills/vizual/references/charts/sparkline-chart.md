# SparklineChart

Element type: `"SparklineChart"` | Props type: `"sparkline"`

Inline mini chart.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"sparkline"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| value | string | no | value field |
| sparkType | `"line"` \| `"bar"` \| `"pct_bar"` | no | chart variant (default line) |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "SparklineChart",
  "props": {
    "type": "sparkline",
    "title": "迷你趋势",
    "data": [
      { "label": "W1", "value": 30 },
      { "label": "W2", "value": 45 },
      { "label": "W3", "value": 28 }
    ],
    "value": "value",
    "sparkType": "line"
  },
  "children": []
}
```
