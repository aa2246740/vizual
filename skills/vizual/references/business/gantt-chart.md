# GanttChart

Element type: `"GanttChart"` | Props type: `"gantt"`

Project schedule with task bars and dependencies.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"gantt"` | yes | fixed literal |
| title | string | no | chart title |
| tasks | GanttTask[] | yes | task definitions |

Each task: `{ id: string, name: string, start: string, end: string, progress?: number(0-100), color?: string, dependencies?: string[] }`

## Example

```json
{
  "type": "GanttChart",
  "props": {
    "type": "gantt",
    "title": "项目排期",
    "tasks": [
      { "id": "t1", "name": "需求分析", "start": "2024-01-01", "end": "2024-01-15", "progress": 100 },
      { "id": "t2", "name": "UI 设计", "start": "2024-01-10", "end": "2024-02-01", "progress": 60, "dependencies": ["t1"] },
      { "id": "t3", "name": "开发", "start": "2024-02-01", "end": "2024-03-15", "progress": 20, "dependencies": ["t2"] }
    ]
  },
  "children": []
}
```
