# WaterfallChart

Element type: `"WaterfallChart"` | Props type: `"waterfall"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"waterfall"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| label | string | no | category label field |
| value | string | no | numeric field (positive/negative) |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "WaterfallChart",
  "props": {
    "type": "waterfall",
    "title": "利润瀑布",
    "data": [
      { "label": "收入", "value": 1000 },
      { "label": "成本", "value": -400 },
      { "label": "利润", "value": 600 }
    ],
    "label": "label",
    "value": "value"
  },
  "children": []
}
```
