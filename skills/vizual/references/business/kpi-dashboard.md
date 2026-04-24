# KpiDashboard

Element type: `"KpiDashboard"` | Props type: `"kpi_dashboard"`

Multi-metric dashboard cards with trend arrows.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"kpi_dashboard"` | yes | fixed literal |
| title | string | no | dashboard title |
| metrics | object[] | yes | metric cards (NOT `data`, NOT `items`) |
| columns | number | no | grid columns (default min(metrics.length, 4)) |

Each metric object:
- `label` (string, required) — metric name
- `value` (string | number, required) — display value
- `prefix` / `suffix` (string, optional) — value prefix/suffix
- `trend` (`"up"` | `"down"` | `"flat"`, optional) — trend arrow
- `trendValue` (string, optional) — e.g. "+15.3%"
- `color` (string, optional) — custom color

## Example

```json
{
  "type": "KpiDashboard",
  "props": {
    "type": "kpi_dashboard",
    "title": "核心指标",
    "columns": 3,
    "metrics": [
      { "label": "总收入", "value": "$2.85M", "trend": "up", "trendValue": "+15.3%" },
      { "label": "用户数", "value": "12,847", "trend": "up", "trendValue": "+8.5%" },
      { "label": "流失率", "value": "2.1%", "trend": "down", "trendValue": "-0.3%", "color": "#ef4444" }
    ]
  },
  "children": []
}
```
