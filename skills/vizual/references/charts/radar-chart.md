# RadarChart

Element type: `"RadarChart"` | Props type: `"radar"`

Radar chart for multi-dimensional comparison. Supports indicator mode (indicators + series) and table mode (data + x + y).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"radar"` | yes | fixed literal |
| title | string | no | chart title |
| indicators | { name: string, max?: number }[] | no | dimension definitions |
| series | { name: string, values: number[] }[] | no | data series (one per indicator set) |
| x | string | no | category field (table mode) |
| y | string \| string[] | no | value field(s) (table mode) |
| data | object[] | no | data array (table mode) |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example (indicator mode)

```json
{
  "type": "RadarChart",
  "props": {
    "type": "radar",
    "title": "能力雷达",
    "indicators": [
      { "name": "速度", "max": 100 },
      { "name": "力量", "max": 100 },
      { "name": "技巧", "max": 100 },
      { "name": "耐力", "max": 100 },
      { "name": "智慧", "max": 100 }
    ],
    "series": [
      { "name": "选手A", "values": [80, 70, 90, 60, 85] },
      { "name": "选手B", "values": [60, 85, 70, 80, 75] }
    ]
  },
  "children": []
}
```
