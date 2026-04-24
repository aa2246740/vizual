# CalendarChart

Element type: `"CalendarChart"` | Props type: `"calendar"`

Calendar heatmap for time-series patterns.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"calendar"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| dateField | string | no | date field (YYYY-MM-DD) |
| valueField | string | no | intensity field |
| range | string | no | year range (e.g. "2024") |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "CalendarChart",
  "props": {
    "type": "calendar",
    "title": "提交日历",
    "data": [
      { "date": "2024-01-01", "commits": 5 },
      { "date": "2024-01-02", "commits": 12 }
    ],
    "dateField": "date",
    "valueField": "commits",
    "range": "2024"
  },
  "children": []
}
```
