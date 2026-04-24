# MermaidDiagram

Element type: `"MermaidDiagram"` | Props type: `"mermaid"`

Renders Mermaid syntax diagrams (flowchart, sequence, gantt, etc.).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"mermaid"` | yes | fixed literal |
| title | string | no | diagram title |
| code | string | yes | Mermaid syntax |
| theme | `"default"` \| `"dark"` \| `"forest"` \| `"neutral"` | no | visual theme |
| height | number | no | chart height in pixels |

## Example

```json
{
  "type": "MermaidDiagram",
  "props": {
    "type": "mermaid",
    "title": "用户流程",
    "code": "graph TD\n  A[用户访问] --> B{已注册?}\n  B -->|是| C[登录]\n  B -->|否| D[注册]\n  D --> C\n  C --> E[使用产品]",
    "theme": "dark"
  },
  "children": []
}
```
