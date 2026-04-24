# BubbleChart

Element type: `"BubbleChart"` | Props type: `"bubble"`

Same as ScatterChart, `size` field is the bubble radius dimension.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"bubble"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string \| string[] | no | Y axis field(s) |
| data | object[] | yes | data array |
| size | string | no | bubble size field |
| groupField | string | no | group/category field |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "BubbleChart",
  "props": {
    "type": "bubble",
    "title": "市场分析",
    "x": "x_val",
    "y": "y_val",
    "data": [
      { "x_val": 10, "y_val": 20, "size": 100, "group": "A" }
    ],
    "size": "size",
    "groupField": "group"
  },
  "children": []
}
```
