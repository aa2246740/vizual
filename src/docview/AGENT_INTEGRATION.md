# DocView Agent 集成指南

DocView 是一个支持 AI Agent 批注修订的文档视图组件。本文档说明如何将 DocView 集成到你的 Agent 系统中。

## 架构概览

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   DocView    │  onAction│   Agent      │  LLM API│   AI Model   │
│  (前端渲染)  │ ────────→│  (后端服务)  │ ────────→│  (Claude等)  │
│              │ ←─────── │              │ ←─────── │              │
│              │ update() │              │          │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

通信由 Agent 后端负责，DocView 只提供前端 API。你可以用 HTTP、WebSocket、SSE 等任何协议。

## DocView 提供的 API

### 1. onAction 回调

当用户执行操作时触发。你需要在创建 DocView 时传入此回调：

```tsx
<DocView
  sections={sections}
  showPanel={true}
  onAction={(actionName, params) => {
    // 把事件发送给你的 Agent 后端
    fetch('/api/agent/action', {
      method: 'POST',
      body: JSON.stringify({ action: actionName, params }),
    })
  }}
/>
```

**事件列表：**

| 事件名 | 触发时机 | params 内容 |
|--------|----------|-------------|
| `annotationAdded` | 用户添加单条批注 | `{ annotation: { id, text, note, color, status, target? }, sectionContexts: Map<sectionIndex, SectionContext>, sectionContext?: SectionContext }` |
| `batchSubmit` | 用户点击"批量提交" | `{ annotations: [{ id, text, note, color, target, sectionContext? }] }` |
| `requestRevision` | 用户请求单条修订 | `{ annotationId, text, note, target, sectionContext?: SectionContext }` |
| `annotationDeleted` | 用户删除批注 | `{ annotation: { id, ... } }` |
| `annotationClicked` | 用户点击已有批注 | `{ annotation: { id, ... } }` |

**SectionContext 结构**（批注事件附带的上下文信息）：

```typescript
interface SectionContext {
  sectionIndex: number   // 在 sections 数组中的索引（0-based）
  sectionType: string    // "heading", "text", "chart", "kpi", "markdown" 等
  title?: string         // 如果是 heading 类型，返回标题文本
  aiContext?: string     // section 上设置的 aiContext 字段
  contentSummary: string // 自动生成的摘要，例如 "Revenue: $12.3M (+15%)"、
                         // "title, 3 series, 24 points" 等
}
```

- `sectionContexts`：所有 section 的上下文映射（annotationAdded 事件）
- `sectionContext`：被批注的单个 section 上下文（所有修订相关事件）

**aiContext 最佳实践**：在 section 上设置 `aiContext` 字段，为 AI Agent 提供语义描述。例如：
- KPI section: `"Revenue: $12.3M, +15% YoY growth"`
- Chart section: `"Bar chart of quarterly revenue, 4 data points"`
- Markdown section: `"Executive summary with 3 key findings"`

这些描述会出现在 `sectionContext.aiContext` 中，让 AI 在处理批注时获得更精确的上下文。

### 2. updateSections（修订后更新）

Agent 处理完批注后，用新的 sections 数据刷新文档：

```tsx
// 方式1: React state 更新
const [sections, setSections] = useState(initialSections)

// Agent 后端返回修订后的 sections
const response = await fetch('/api/agent/revise', { ... })
const newSections = await response.json()
setSections(newSections)

// DocView 自动用新 sections 重新渲染
<DocView sections={sections} onAction={handleAction} />
```

```javascript
// 方式2: json-render 模式（纯 HTML/JS）
// 通过全局函数更新
window.updateSections(newSections)
```

### 3. 批注状态生命周期

```
draft → active → resolved
                 ↓
              orphaned (AI 修订后原文被改)
```

- **draft**: 用户刚添加，未提交
- **active**: 已提交给 Agent，等待处理
- **resolved**: Agent 已处理，批注保留供参考
- **orphaned**: Agent 修订了原文，批注指向的文本已不存在

## 集成模式

### 模式 A: HTTP 轮询（最简单）

前端 POST 批注到后端，后端处理完返回新 sections。

```javascript
// 前端
onAction={(name, params) => {
  fetch('/api/agent/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: name, ...params }),
  })
  .then(r => r.json())
  .then(result => {
    if (result.sections) {
      setSections(result.sections)  // 重新渲染
    }
  })
}}
```

```python
# 后端 (Python Flask 示例)
@app.post('/api/agent/action')
def handle_action():
    action = request.json['action']
    if action == 'batchSubmit':
        annotations = request.json['annotations']
        # 调用 AI 修订
        new_sections = ai_revise(current_sections, annotations)
        return jsonify({ sections: new_sections })
    return jsonify({})
```

### 模式 B: WebSocket（实时）

适合需要实时反馈的场景（Agent 处理进度流式推送等）。

```javascript
const ws = new WebSocket('ws://localhost:8080/agent')

// 前端发送批注事件
onAction={(name, params) => {
  ws.send(JSON.stringify({ action: name, ...params }))
}}

// 前端接收修订结果
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'sections_updated') {
    setSections(data.sections)
  }
}
```

### 模式 C: SSE + fetch（单向推送）

Agent 处理可能耗时较长，用 SSE 推送进度和结果。

```javascript
// 批注提交用 fetch
onAction={(name, params) => {
  fetch('/api/agent/action', { method: 'POST', body: JSON.stringify({ action: name, ...params }) })
}}

// 修订结果用 SSE 监听
const sse = new EventSource('/api/agent/stream')
sse.addEventListener('revised', (e) => {
  setSections(JSON.parse(e.data).sections)
})
```

## Sections 数据格式

DocView 的 sections 数组是 Agent 和前端之间的数据契约：

```typescript
sections: [
  { type: 'heading', content: '标题文字', level: 1, aiContext: '报告主标题' },
  { type: 'text', content: '段落内容...' },
  { type: 'markdown', content: '## 重点摘要\n\n- **收入** 超出目标 12%\n- 新市场：东南亚、拉丁美洲\n\n> 战略合作贡献了 40% 的新增长。' },
  { type: 'kpi', content: '', layout: 'grid', aiContext: '三个核心KPI指标', data: { metrics: [
    { label: '指标名', value: '128万', change: '+12.3%', color: '#3b82f6' },
  ]}},
  { type: 'chart', title: '图表标题', content: '', data: {
    // ECharts 格式
    xAxis: { type: 'category', data: ['1月','2月'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [100, 200] }],
  }},
  { type: 'table', content: '', data: {
    columns: ['列1', '列2'],
    rows: [['值1', '值2']],
  }},
  { type: 'callout', content: '提示内容', layout: 'banner', variant: 'info' },
  { type: 'component', content: '', data: { componentType: 'BarChart', x: 'month', y: 'sales', data: [{ month: '1月', sales: 120 }, { month: '2月', sales: 200 }] } },
]
```

Agent 修订时只需要修改对应 section 的数据，然后推送新 sections 即可。

## 完整示例：最小 Agent 后端

```python
# minimal_agent.py — 最小可运行的 Agent 后端
from flask import Flask, request, jsonify, send_file
import json, anthropic

app = Flask(__name__)
client = anthropic.Anthropic()
SECTIONS_FILE = 'sections.json'

@app.route('/')
def index():
    return send_file('docview.html')

@app.route('/api/sections', methods=['GET'])
def get_sections():
    with open(SECTIONS_FILE) as f:
        return json.load(f)

@app.route('/api/sections', methods=['PUT'])
def update_sections():
    sections = request.json
    with open(SECTIONS_FILE, 'w') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    return jsonify(ok=True)

@app.route('/api/agent/action', methods=['POST'])
def handle_action():
    data = request.json
    action = data.get('action')

    if action == 'batchSubmit':
        annotations = data.get('annotations', [])
        with open(SECTIONS_FILE) as f:
            sections = json.load(f)

        # 构建包含 sectionContext 的批注描述
        annotation_descriptions = []
        for ann in annotations:
            ctx = ann.get('sectionContext', {})
            desc = f"- 批注: {ann.get('text', '')}"
            if ctx:
                desc += f"\n  位置: section[{ctx.get('sectionIndex', '?')}] ({ctx.get('sectionType', '?')})"
                if ctx.get('aiContext'):
                    desc += f"\n  AI上下文: {ctx['aiContext']}"
                if ctx.get('contentSummary'):
                    desc += f"\n  内容摘要: {ctx['contentSummary']}"
            if ann.get('note'):
                desc += f"\n  用户备注: {ann['note']}"
            annotation_descriptions.append(desc)

        # 调用 AI 修订 sections
        prompt = f"""你是文档修订助手。用户提交了以下批注：
{chr(10).join(annotation_descriptions)}

当前文档 sections 数据：
{json.dumps(sections, ensure_ascii=False, indent=2)}

请根据批注意见修改 sections 数据，返回完整的修改后 JSON 数组。只输出 JSON，不要其他内容。"""

        response = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4096,
            messages=[{'role': 'user', 'content': prompt}],
        )
        new_sections = json.loads(response.content[0].text)
        with open(SECTIONS_FILE, 'w') as f:
            json.dump(new_sections, f, ensure_ascii=False, indent=2)
        return jsonify({ 'sections': new_sections })

    return jsonify({})

if __name__ == '__main__':
    app.run(port=8080)
```

## json-render 集成

如果你的项目使用 json-render 平台：

```javascript
Vizual.renderSpec({
  root: 'm',
  elements: { m: {
    type: 'DocView',
    props: {
      sections: sections,
      showPanel: true,
      panelPosition: 'right',
      onAction: function(name, params) {
        // 发送到你的 Agent 后端
      }
    },
    children: []
  }}
}, container)
```
