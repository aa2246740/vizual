# 组件级 LiveKit — InteractivePlayground

用 `InteractivePlayground` 组件包裹任意 vizual 组件，添加实时控件。

## JSON Spec

```json
{
  "type": "InteractivePlayground",
  "props": {
    "type": "interactive_playground",
    "title": "标题（可选）",
    "description": "说明（可选）",
    "component": {
      "type": "<任意 vizual 组件名>",
      "props": { /* 组件的 props */ }
    },
    "controls": [
      { "name": "id", "label": "显示名", "type": "<类型>", "targetProp": "<组件的真实 prop 名>", ... }
    ],
    "layout": "side-by-side"
  }
}
```

## targetProp 核心机制

**`targetProp` 是控件值注入到被包裹组件 props 的 key。** 运行时执行：

```
component.props[targetProp] = 控件当前值
```

### 必须遵守的规则

1. **targetProp 必须是被包裹组件的真实 prop 名** — 如果你 wrap 的是 BarChart，targetProp 必须是 BarChart schema 中存在的字段（如 `"stacked"`、`"title"`、`"horizontal"`、`"theme"`）
2. **控件返回值的类型必须匹配 prop 类型** — toggle 返回 boolean，slider 返回 number，select 返回 string
3. **如果 targetProp 不是组件的有效 prop，控件操作不会产生任何效果** — 值被设置了但组件不识别，静默忽略

### BarChart 可用的 targetProp 对照表

| BarChart prop | 类型 | 适合的控件 |
|---------------|------|-----------|
| `stacked` | boolean | toggle |
| `horizontal` | boolean | toggle |
| `title` | string | text |
| `theme` | "light" \| "dark" | select / buttonGroup |

### 其他组件可用 targetProp 示例

| 被包裹组件 | targetProp | 类型 | 控件 |
|-----------|-----------|------|------|
| PieChart | `donut` | boolean | toggle |
| PieChart | `title` | string | text |
| AreaChart | `stacked` | boolean | toggle |
| AreaChart | `smooth` | boolean | toggle |
| DataTable | `striped` | boolean | toggle |
| DataTable | `compact` | boolean | toggle |
| KpiDashboard | `columns` | number | slider (1-6) |
| MermaidDiagram | `theme` | string | select ("default"/"dark"/"forest"/"neutral") |
| SparklineChart | `sparkType` | string | select ("line"/"bar"/"pct_bar") |
| BarChart | `theme` | string | select ("light"/"dark") |

### 常见错误

```json
// ❌ 错误 — "dataCount" 不是 BarChart 的 prop，控件无效
{ "name": "dataCount", "type": "slider", "min": 3, "max": 15, "defaultValue": 8, "targetProp": "dataCount" }

// ❌ 错误 — "palette" 不是 BarChart 的 prop
{ "name": "palette", "type": "select", "options": ["默认","暖色"], "targetProp": "palette" }

// ❌ 错误 — "chartType" 不是 BarChart 的 prop（BarChart 的 type 是 literal "bar"，不可切换）
{ "name": "chartType", "type": "buttonGroup", "options": ["柱状","折线"], "targetProp": "chartType" }
```

## 控件类型

### slider — 数值滑块
```json
{ "name": "columns", "label": "列数", "type": "slider", "min": 1, "max": 6, "step": 1, "defaultValue": 3, "targetProp": "columns" }
```
适合：number 类型的 props（如 KpiDashboard 的 `columns`、图表的 `height`）

### select — 下拉选择
```json
{ "name": "theme", "label": "主题", "type": "select", "options": ["暗色","亮色"], "values": ["dark","light"], "defaultValue": "dark", "targetProp": "theme" }
```
`values` 可选，省略则用 `options` 的值。

### toggle — 开关
```json
{ "name": "stacked", "label": "堆叠", "type": "toggle", "defaultValue": false, "targetProp": "stacked" }
```

### color — 颜色选择器
```json
// 注意：大多数图表组件没有"颜色"prop，color 控件只在组件有对应颜色 prop 时才有用
// 可配合自定义级 LiveKit 使用（见 custom-level.md）
```

### text — 文本输入
```json
{ "name": "titleInput", "label": "标题", "type": "text", "defaultValue": "My Chart", "placeholder": "输入标题", "targetProp": "title" }
```

### number — 数字输入
```json
{ "name": "heightInput", "label": "高度", "type": "number", "min": 100, "max": 600, "step": 50, "defaultValue": 300, "targetProp": "height" }
```

### buttonGroup — 按钮组
```json
{ "name": "theme", "label": "主题模式", "type": "buttonGroup", "options": ["暗色","亮色"], "values": ["dark","light"], "defaultValue": "dark", "targetProp": "theme" }
```
适合：枚举类型，比 select 更直观的快速切换。

## 布局

- `layout: "side-by-side"`（默认）— 控件在右侧
- `layout: "stacked"` — 控件在下方，适合窄容器

## 完整示例：柱状图参数探索

```json
{
  "type": "InteractivePlayground",
  "props": {
    "type": "interactive_playground",
    "title": "柱状图参数探索",
    "description": "拖动控件查看不同参数效果",
    "component": {
      "type": "BarChart",
      "props": {
        "type": "bar",
        "title": "Monthly Revenue",
        "x": "month",
        "y": "revenue",
        "data": [
          {"month":"Jan","revenue":120},{"month":"Feb","revenue":200},
          {"month":"Mar","revenue":150},{"month":"Apr","revenue":280},
          {"month":"May","revenue":220},{"month":"Jun","revenue":310}
        ]
      }
    },
    "controls": [
      { "name": "stacked", "label": "堆叠模式", "type": "toggle", "defaultValue": false, "targetProp": "stacked" },
      { "name": "horizontal", "label": "水平方向", "type": "toggle", "defaultValue": false, "targetProp": "horizontal" },
      { "name": "titleInput", "label": "标题", "type": "text", "defaultValue": "Monthly Revenue", "placeholder": "图表标题", "targetProp": "title" },
      { "name": "theme", "label": "主题", "type": "select", "options": ["暗色","亮色"], "values": ["dark","light"], "defaultValue": "dark", "targetProp": "theme" }
    ],
    "layout": "side-by-side"
  }
}
```

## Limitations (不能做的事)

- **不能切换图表类型**：BarChart 的 `type` 是 `"bar"`（literal），不能通过 targetProp 改成 `"line"`。要对比不同图表类型，放多个 InteractivePlayground 并排。
- **不能动态调整数据量**：`data` 是数组类型，slider 返回 number，类型不匹配。提供完整数据即可。
- **不能动态改数据字段**：`x`、`y` 等字段绑定的是数据 key，运行时改字段名没有意义。
- **不能切换全局主题**：全局主题（Design.md）需要宿主应用调用 API，InteractivePlayground 只能控制组件级别的 `theme` prop。

## Tips

- 可以包裹**任何 Vizual 组件**：BarChart、PieChart、RadarChart、DataTable、Kanban、Timeline、KpiDashboard、GanttChart、OrgChart、AuditLog、FormBuilder、DocView
- 控制面板默认收起，点击齿轮按钮展开
- **写 controls 之前，先确认被包裹组件有哪些 props 可用**
- 需要切换图表类型？用多个 InteractivePlayground 并排，每个包裹不同类型的图表
- 需要动态数据？用自定义级 LiveKit（见 custom-level.md）自己写 JS 逻辑
