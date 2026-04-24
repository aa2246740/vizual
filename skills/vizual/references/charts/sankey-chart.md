# SankeyChart

Element type: `"SankeyChart"` | Props type: `"sankey"`

Flow diagram with explicit nodes and links.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"sankey"` | yes | fixed literal |
| title | string | no | chart title |
| nodes | { name: string }[] | no | node definitions |
| links | { source: string, target: string, value: number }[] | no | flow connections |
| theme | `"light"` \| `"dark"` | no | color theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "SankeyChart",
  "props": {
    "type": "sankey",
    "title": "用户转化漏斗",
    "nodes": [
      { "name": "访问" }, { "name": "注册" }, { "name": "付费" }
    ],
    "links": [
      { "source": "访问", "target": "注册", "value": 1000 },
      { "source": "注册", "target": "付费", "value": 200 }
    ]
  },
  "children": []
}
```
