# Kanban

Element type: `"Kanban"` | Props type: `"kanban"`

Task board with columns and cards.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"kanban"` | yes | fixed literal |
| title | string | no | board title |
| columns | KanbanColumn[] | yes | column definitions |

Each column: `{ id: string, title: string, color?: string, cards: KanbanCard[] }`
Each card: `{ id: string, title: string, description?: string, tags?: string[], assignee?: string, priority?: "low" | "medium" | "high" }`

## Example

```json
{
  "type": "Kanban",
  "props": {
    "type": "kanban",
    "title": "任务看板",
    "columns": [
      {
        "id": "todo",
        "title": "待办",
        "cards": [
          { "id": "t1", "title": "设计首页", "tags": ["设计"], "priority": "high" }
        ]
      },
      {
        "id": "doing",
        "title": "进行中",
        "cards": [
          { "id": "t2", "title": "开发 API", "assignee": "张三", "tags": ["后端"], "priority": "medium" }
        ]
      },
      {
        "id": "done",
        "title": "已完成",
        "cards": [
          { "id": "t3", "title": "需求文档", "description": "PRD v2.0 已定稿" }
        ]
      }
    ]
  },
  "children": []
}
```
