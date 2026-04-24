# HeatmapChart

Element type: `"HeatmapChart"` | Props type: `"heatmap"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"heatmap"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| xField | string | no | X dimension |
| yField | string | no | Y dimension |
| valueField | string | no | intensity field |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "HeatmapChart",
  "props": {
    "type": "heatmap",
    "title": "活跃度热力图",
    "data": [
      { "hour": "9:00", "day": "周一", "count": 15 },
      { "hour": "10:00", "day": "周一", "count": 22 }
    ],
    "xField": "hour",
    "yField": "day",
    "valueField": "count"
  },
  "children": []
}
```
