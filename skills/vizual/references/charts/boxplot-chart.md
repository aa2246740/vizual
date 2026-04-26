# BoxplotChart

Element type: `"BoxplotChart"` | Props type: `"boxplot"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"boxplot"` | yes | fixed literal |
| title | string | no | chart title |
| x | string | no | X axis field |
| y | string | no | Y axis field |
| data | object[] | yes | raw values (auto-calculates quartiles) or precomputed five-number rows |
| valueField | string | no | numeric field for boxplot values (default uses y) |
| groupField | string | no | grouping field for multiple boxplots |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Data formats

Use raw rows when you have individual observations:

```json
{ "subject": "数学", "score": 85 }
```

Use precomputed rows when the data is already summarized:

```json
{ "class": "A班", "min": 60, "q1": 70, "median": 80, "q3": 85, "max": 95 }
```

For precomputed rows, set `x` or `groupField` to the category field when possible.

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

## Precomputed Example

```json
{
  "type": "BoxplotChart",
  "props": {
    "type": "boxplot",
    "title": "班级成绩分布",
    "x": "class",
    "data": [
      { "class": "A班", "min": 60, "q1": 70, "median": 80, "q3": 85, "max": 95 },
      { "class": "B班", "min": 55, "q1": 65, "median": 75, "q3": 80, "max": 90 }
    ]
  },
  "children": []
}
```
