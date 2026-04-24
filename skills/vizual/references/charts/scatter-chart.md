# ScatterChart

Element type: `"ScatterChart"` | Props type: `"scatter"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"scatter"` | yes | fixed literal |
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
  "type": "ScatterChart",
  "props": {
    "type": "scatter",
    "title": "价格 vs 销量",
    "x": "price",
    "y": "sales",
    "data": [
      { "price": 10, "sales": 200, "category": "A" },
      { "price": 20, "sales": 150, "category": "B" }
    ],
    "size": "sales",
    "groupField": "category"
  },
  "children": []
}
```
