# LineChart

Element type: `"LineChart"` | Props type: `"line"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"line"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string \| string[] | no | Y axis field(s) |
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
    "x": "month",
    "y": ["revenue", "cost"],
    "data": [
      { "month": "Q1", "revenue": 100, "cost": 60 },
      { "month": "Q2", "revenue": 130, "cost": 70 },
      { "month": "Q3", "revenue": 180, "cost": 85 }
    ],
    "smooth": true
  },
  "children": []
}
```
