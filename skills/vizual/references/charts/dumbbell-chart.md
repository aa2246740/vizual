# DumbbellChart

Element type: `"DumbbellChart"` | Props type: `"dumbbell"`

Range comparison chart.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"dumbbell"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| low | string | no | low value field |
| high | string | no | high value field |
| x | string | no | category field alias |
| y | string[] | no | `[lowField, highField]` shorthand |
| groupField | string | no | preferred category/group label field |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "DumbbellChart",
  "props": {
    "type": "dumbbell",
    "title": "前后对比",
    "data": [
      { "name": "指标A", "before": 30, "after": 65 },
      { "name": "指标B", "before": 45, "after": 70 }
    ],
    "low": "before",
    "high": "after",
    "groupField": "name"
  },
  "children": []
}
```

Use `groupField` or `x` for the category labels. The field does not need to be named `name`; for regional comparison, `groupField: "region"` with rows like `{ "region": "华东", "before": 30, "after": 65 }` is valid.
