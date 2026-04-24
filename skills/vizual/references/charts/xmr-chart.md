# XmrChart (SPC Control Chart)

Element type: `"XmrChart"` | Props type: `"xmr"`

Control chart for process monitoring.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"xmr"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | measurement data |
| value | string | no | measurement field name |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "XmrChart",
  "props": {
    "type": "xmr",
    "title": "过程控制",
    "data": [
      { "sample": 1, "value": 25.1 },
      { "sample": 2, "value": 24.8 }
    ],
    "value": "value"
  },
  "children": []
}
```
