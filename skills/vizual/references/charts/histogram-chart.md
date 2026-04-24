# HistogramChart

Element type: `"HistogramChart"` | Props type: `"histogram"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"histogram"` | yes | fixed literal |
| title | string | no | chart title |
| value | string | no | field to histogram |
| bins | number | no | number of bins |
| data | object[] | yes | data array |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "HistogramChart",
  "props": {
    "type": "histogram",
    "title": "年龄分布",
    "data": [
      { "age": 25 }, { "age": 30 }, { "age": 35 }
    ],
    "value": "age",
    "bins": 10
  },
  "children": []
}
```
