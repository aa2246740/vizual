# DataTable

Element type: `"DataTable"` | Props type: `"table"`

**This is the #1 most error-prone component.** Follow the format exactly.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"table"` | yes | fixed literal (NOT `"data_table"`) |
| title | string | no | table title |
| columns | { key: string, label?: string, align?: `"left"` \| `"center"` \| `"right"` }[] | no | column definitions |
| data | object[] | yes | row data (object array, NOT 2D array) |
| striped | boolean | no | alternate row colors |
| compact | boolean | no | reduce padding |

## Example

```json
{
  "type": "DataTable",
  "props": {
    "type": "table",
    "title": "用户行为表",
    "columns": [
      { "key": "name", "label": "姓名" },
      { "key": "age", "label": "年龄", "align": "right" },
      { "key": "city", "label": "城市" }
    ],
    "data": [
      { "name": "张三", "age": 28, "city": "北京" },
      { "name": "李四", "age": 32, "city": "上海" }
    ],
    "striped": true,
    "compact": false
  },
  "children": []
}
```

## Common Mistakes (DO NOT make these)

- `"type": "data_table"` -> correct: `"type": "table"`
- `columns: ["姓名", "年龄"]` -> correct: `[{key: "name", label: "姓名"}]`
- `data: [["张三", 28], ["李四", 32]]` -> correct: `[{name: "张三", age: 28}]`
- column keys not matching data object keys
