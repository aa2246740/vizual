# PieChart

Element type: `"PieChart"` | Props type: `"pie"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"pie"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| donut | boolean | no | donut/ring mode |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "PieChart",
  "props": {
    "type": "pie",
    "title": "市场份额",
    "data": [
      { "name": "产品A", "value": 35 },
      { "name": "产品B", "value": 28 },
      { "name": "产品C", "value": 22 },
      { "name": "其他", "value": 15 }
    ],
    "donut": false
  },
  "children": []
}
```
