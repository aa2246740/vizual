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
      { "name": "id", "label": "显示名", "type": "<类型>", ... }
    ],
    "layout": "side-by-side"
  }
}
```

## 控件类型

### slider
```json
{ "name": "points", "label": "数据点", "type": "slider", "min": 3, "max": 20, "step": 1, "defaultValue": 8, "targetProp": "dataCount" }
```

### select
```json
{ "name": "palette", "label": "配色", "type": "select", "options": ["默认","暖色"], "values": ["default","warm"], "defaultValue": "default", "targetProp": "palette" }
```
`values` 可选，省略则用 `options` 的值。

### toggle
```json
{ "name": "stacked", "label": "堆叠", "type": "toggle", "defaultValue": false, "targetProp": "stacked" }
```

### color
```json
{ "name": "baseColor", "label": "基色", "type": "color", "defaultValue": "#667eea", "targetProp": "baseColor" }
```

### text
```json
{ "name": "title", "label": "标题", "type": "text", "defaultValue": "My Chart", "targetProp": "title" }
```

### number
```json
{ "name": "height", "label": "高度", "type": "number", "min": 100, "max": 600, "step": 50, "defaultValue": 300, "targetProp": "height" }
```

### buttonGroup
```json
{ "name": "chartType", "label": "类型", "type": "buttonGroup", "options": ["柱状","折线"], "values": ["bar","line"], "defaultValue": "bar", "targetProp": "chartType" }
```

## 布局

- `layout: "side-by-side"`（默认）— 控件在右侧
- `layout: "stacked"` — 控件在下方，适合窄容器

## 机制

- `targetProp` 将控件输出映射到包裹组件的 prop 名
- 控件值变化时，组件自动用新 props 重渲染
- 不在组件 schema 里的 targetProp 会被忽略

## 示例

### 柱状图参数探索
```json
{
  "type": "InteractivePlayground",
  "props": {
    "type": "interactive_playground",
    "title": "柱状图参数探索",
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
      { "name": "stacked", "label": "堆叠", "type": "toggle", "defaultValue": false, "targetProp": "stacked" },
      { "name": "horizontal", "label": "水平", "type": "toggle", "defaultValue": false, "targetProp": "horizontal" },
      { "name": "title", "label": "标题", "type": "text", "defaultValue": "Monthly Revenue", "targetProp": "title" }
    ]
  }
}
```

### 饼图配色探索
```json
{
  "type": "InteractivePlayground",
  "props": {
    "type": "interactive_playground",
    "title": "饼图配色探索",
    "component": {
      "type": "PieChart",
      "props": {
        "type": "pie",
        "title": "市场份额",
        "category": "name",
        "value": "share",
        "data": [
          {"name":"产品A","share":35},{"name":"产品B","share":28},
          {"name":"产品C","share":20},{"name":"产品D","share":17}
        ]
      }
    },
    "controls": [
      { "name": "title", "label": "标题", "type": "text", "defaultValue": "市场份额", "targetProp": "title" }
    ]
  }
}
```
