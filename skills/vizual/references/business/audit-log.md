# AuditLog

Element type: `"AuditLog"` | Props type: `"audit_log"`

Operation log with timestamps and severity levels.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `"audit_log"` | yes | fixed literal |
| title | string | no | log title |
| entries | AuditEntry[] | yes | log entries |

Each entry: `{ timestamp: string, user: string, action: string, target?: string, details?: string, severity?: "info" | "warning" | "error" }`

## Example

```json
{
  "type": "AuditLog",
  "props": {
    "type": "audit_log",
    "title": "操作日志",
    "entries": [
      { "timestamp": "2024-01-15 09:30:00", "user": "admin", "action": "创建用户", "target": "user_001", "severity": "info" },
      { "timestamp": "2024-01-15 10:15:00", "user": "editor", "action": "删除文档", "target": "doc_042", "severity": "warning" },
      { "timestamp": "2024-01-15 11:00:00", "user": "system", "action": "登录失败", "details": "连续 5 次密码错误", "severity": "error" }
    ]
  },
  "children": []
}
```
