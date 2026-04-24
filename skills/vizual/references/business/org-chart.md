# OrgChart

Element type: `"OrgChart"` | Props type: `"org_chart"` (NOT `"orgchart"`)

Organization hierarchy tree.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"org_chart"` | yes | fixed literal |
| title | string | no | chart title |
| nodes | OrgNode[] | yes | node definitions |

Each node: `{ id: string, name: string, role?: string, parentId?: string | null, avatar?: string }`

## Example

```json
{
  "type": "OrgChart",
  "props": {
    "type": "org_chart",
    "title": "团队架构",
    "nodes": [
      { "id": "ceo", "name": "张总", "role": "CEO" },
      { "id": "cto", "name": "李总", "role": "CTO", "parentId": "ceo" },
      { "id": "cfo", "name": "王总", "role": "CFO", "parentId": "ceo" },
      { "id": "dev", "name": "赵工", "role": "前端负责人", "parentId": "cto" }
    ]
  },
  "children": []
}
```
