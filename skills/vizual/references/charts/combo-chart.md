# ComboChart

Element type: `"ComboChart"` | Props type: `"combo"`

Mixed bar + line chart with dual Y axes.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"combo"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string \| string[] | yes | Y axis field(s). First field = bar series, rest = line series |
| data | object[] | yes | data array |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

**Important:** Do NOT use `series`. Use `y` as an array — the first field renders as bar, all subsequent fields render as line.

## Example

```json
{
  "type": "ComboChart",
  "props": {
    "type": "combo",
    "title": "收入 vs 增长率",
    "x": "month",
    "y": ["revenue", "growth"],
    "data": [
      { "month": "1月", "revenue": 120, "growth": 15 },
      { "month": "2月", "revenue": 135, "growth": 12 }
    ]
  },
  "children": []
}
```
