# HistogramChart

Element type: `"HistogramChart"` | Props type: `"histogram"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"histogram"` | yes | fixed literal |
| title | string | no | chart title |
| value | string | no | field to histogram |
| bins | number | no | number of bins |
| data | object[] | yes | data array |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Data formats

Use raw rows when Vizual should calculate bins:

```json
{ "age": 25 }
```

Use pre-binned rows when the data is already aggregated:

```json
{ "range": "60-70", "count": 15 }
```

For pre-binned rows, set `x` to the bin label field and `y` to the count/frequency field.

## Example

```json
{
  "type": "HistogramChart",
  "props": {
    "type": "histogram",
    "title": "年龄分布",
    "data": [
      { "age": 25 }, { "age": 30 }, { "age": 35 }
    ],
    "value": "age",
    "bins": 10
  },
  "children": []
}
```

## Pre-Binned Example

```json
{
  "type": "HistogramChart",
  "props": {
    "type": "histogram",
    "title": "考试成绩分布",
    "x": "range",
    "y": "count",
    "data": [
      { "range": "0-60", "count": 5 },
      { "range": "60-70", "count": 15 },
      { "range": "70-80", "count": 35 }
    ]
  },
  "children": []
}
```
