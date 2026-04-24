# AreaChart

Element type: `"AreaChart"` | Props type: `"area"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"area"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string \| string[] | no | Y axis field(s) |
| data | object[] | yes | data array |
| stacked | boolean | no | stack areas |
| smooth | boolean | no | smooth curves |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "AreaChart",
  "props": {
    "type": "area",
    "title": "流量趋势",
    "x": "date",
    "y": "visitors",
    "data": [
      { "date": "周一", "visitors": 1200 },
      { "date": "周二", "visitors": 1800 }
    ],
    "stacked": false,
    "smooth": true
  },
  "children": []
}
```
