# FunnelChart

Element type: `"FunnelChart"` | Props type: `"funnel"`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"funnel"` | yes | fixed literal |
| title | string | no | chart title |
| data | object[] | yes | data array |
| label | string | no | stage label field |
| value | string | no | numeric field |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "FunnelChart",
  "props": {
    "type": "funnel",
    "title": "转化漏斗",
    "data": [
      { "label": "访问", "value": 10000 },
      { "label": "注册", "value": 3000 },
      { "label": "付费", "value": 500 }
    ],
    "label": "label",
    "value": "value"
  },
  "children": []
}
```
