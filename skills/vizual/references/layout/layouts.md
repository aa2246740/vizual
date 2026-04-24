# Layout Components (3)

Layout components are containers — they hold other components as children. They do NOT render content themselves.

**Critical rule:** Layout components have NO `type` field in their `props`.

## GridLayout

Element type: `"GridLayout"` | Props type: (none — no type in props)

CSS Grid container for arranging child components.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| columns | number | no | number of grid columns (default 3) |
| gap | number | no | gap between items in pixels (default 16) |
| columnWidths | string[] | no | custom width for each column (CSS values) |

```json
{
  "type": "GridLayout",
  "props": { "columns": 2, "gap": 16 },
  "children": ["card1", "card2"]
}
```

## SplitLayout

Element type: `"SplitLayout"` | Props type: (none — no type in props)

Two-pane layout with configurable direction and ratio.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| direction | `"horizontal"` \| `"vertical"` | no | split direction (default horizontal) |
| ratio | number | no | split ratio 10-90, percentage for first pane (default 50) |
| gap | number | no | gap between panes in pixels |

```json
{
  "type": "SplitLayout",
  "props": { "direction": "horizontal", "ratio": 40 },
  "children": ["leftPane", "rightPane"]
}
```

## HeroLayout

Element type: `"HeroLayout"` | Props type: (none — no type in props)

Hero banner section with configurable height and background.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| height | number | no | hero section height in pixels (default 240) |
| background | `"gradient"` \| `"solid"` \| `"transparent"` | no | background style (default gradient) |
| align | `"left"` \| `"center"` \| `"right"` | no | content alignment (default center) |

```json
{
  "type": "HeroLayout",
  "props": { "height": 300, "background": "gradient", "align": "center" },
  "children": ["heroContent"]
}
```

## Multi-component composition example

```json
{
  "root": "root",
  "elements": {
    "root": {
      "type": "GridLayout",
      "props": { "columns": 1 },
      "children": ["header", "chart", "footer"]
    },
    "header": {
      "type": "KpiDashboard",
      "props": { "type": "kpi_dashboard", "metrics": [] },
      "children": []
    },
    "chart": {
      "type": "BarChart",
      "props": { "type": "bar", "x": "month", "y": "sales", "data": [] },
      "children": []
    },
    "footer": {
      "type": "DataTable",
      "props": { "type": "table", "columns": [], "data": [] },
      "children": []
    }
  }
}
```
