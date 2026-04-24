# BoxplotChart

Element type: `"BoxplotChart"` | Props type: `"boxplot"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"boxplot"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string | no | Y axis field |
| data | object[] | yes | data array (raw values, auto-calculates quartiles) |
| valueField | string | no | numeric field for boxplot values (default uses y) |
| groupField | string | no | grouping field for multiple boxplots |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "BoxplotChart",
  "props": {
    "type": "boxplot",
    "title": "分数分布",
    "x": "subject",
    "y": "score",
    "data": [
      { "subject": "数学", "score": 85 },
      { "subject": "数学", "score": 72 },
      { "subject": "英语", "score": 90 },
      { "subject": "英语", "score": 65 }
    ]
  },
  "children": []
}
```
