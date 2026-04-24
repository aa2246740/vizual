# Timeline

Element type: `"Timeline"` | Props type: `"timeline"`

Vertical event timeline.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"timeline"` | yes | fixed literal |
| title | string | no | timeline title |
| events | { date: string, title: string, description?: string }[] | yes | events |

## Example

```json
{
  "type": "Timeline",
  "props": {
    "type": "timeline",
    "title": "项目进展",
    "events": [
      { "date": "2024-01-15", "title": "项目启动", "description": "完成立项评审" },
      { "date": "2024-02-20", "title": "MVP 发布", "description": "核心功能上线" },
      { "date": "2024-03-10", "title": "公测", "description": "开放 1000 用户内测" }
    ]
  },
  "children": []
}
```
