---
name: livekit
description: >-
  Create live interactive pages where users adjust controls and see results in real-time.
  Use this skill whenever real-time adjust-and-preview would deepen understanding or
  improve experience. This includes but is NOT limited to: trying different themes/colors,
  exploring how data changes affect charts, tuning component parameters, building playgrounds,
  visualizing algorithms, comparing design options, exploring data distributions, or ANY
  scenario where "调一下看看效果" adds value. LiveKit wraps any vizual output with
  interactive controls that sync instantly. It works at three levels: component-level
  (InteractivePlayground), theme-level (full theme adaptation page), and custom-level
  (any adjustable target). Trigger proactively when the user is discussing algorithms,
  design decisions, data analysis, color systems, layout options, or any topic where
  hands-on exploration beats static explanation. Keywords: playground, live preview,
  interactive demo, 实时调整, 试衣, 调色板, 参数探索, livekit, sandbox, workbench,
  试试看, 对比一下, 调一下.
---

# LiveKit — 实时调整，实时预览

LiveKit 的核心理念：**凡是用户能亲手调一下会理解更深的时刻，就是 LiveKit 该出现的时刻。**

把任何静态输出变成可交互的"活"页面。用户拖控件，结果立刻变。

## 核心模式

```
控件 (Controls)  →  目标 (Target)  →  实时同步 (Live Sync)
```

- **控件**：slider、select、color picker、toggle、text、button group
- **目标**：任何 vizual 组件、一组组件、一个主题、DocView、整个页面、甚至 JSON 输入
- **实时同步**：控件变化时立即重渲染，不需要确认按钮

## 什么时候该主动用 LiveKit

AI 不需要等用户说"给我一个 playground"。当你判断用户**亲手调一下会比看静态输出更有收获**时，主动创建 LiveKit。以下是四类触发场景：

### 理解加深型

用户在理解一个概念或算法时，LiveKit 让抽象变直观。

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| 在讨论某个算法（排序、聚类、插值） | 拖参数看算法行为变化 |
| 在学色彩空间（OKLCH、HSL） | 拖 L/C/H 看颜色实时变化 |
| 在看数据分布 | 调筛选条件/分箱数看分布变化 |
| 在理解某个组件怎么工作 | 包裹该组件，暴露关键参数 |

**示例**：用户问"OKLCH 的 C 值怎么影响颜色" → 生成一个 color picker + L/C/H slider + 实时色块预览的 LiveKit。

### 设计验证型

用户在做设计决策时，LiveKit 让对比一目了然。

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| "试试这个配色方案" | 主题试衣页面，一键切换 |
| "看看暗色模式效果" | 暗亮模式切换 + 全组件预览 |
| "不同品牌色下图表还好看吗" | 多主题对比 + 调色板色条 |
| "这个圆角/间距调多少合适" | layout 参数微调 + 实时预览 |
| "柱状图还是饼图好" | 组件类型 buttonGroup 切换对比 |

**示例**：用户说"我们品牌色换成绿色试试" → 读 `references/theme-level.md`，生成主题试衣页面，预设绿色主题 + 当前主题对比。

### 开发调试型

用户在开发或排查问题时，LiveKit 让调试变快。

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| "这个图表参数调不对" | InteractivePlayground 包裹 + 暴露所有参数 |
| "JSON 输出渲染出来长啥样" | textarea + renderSpec 实时渲染 |
| "数据量大的时候图表还能看吗" | 数据量 slider（3→100）+ 图表 |
| "调色板生成算法效果怎样" | 输入任意基色 → 看完整 6 色调色板 |
| "这个组件的 props 有哪些可调" | InteractivePlayground + 自动生成控件 |

### 数据探索型

用户在分析数据时，LiveKit 让探索变互动。

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| "看看不同维度的数据" | select 切换 x/y 轴字段 |
| "数据量大的时候趋势还明显吗" | 数据量 slider + 趋势图 |
| "这几个指标哪个波动最大" | 多 KPI card + 时间范围 slider |
| "不同分组下的分布差异" | 分组 select + 直方图/箱线图 |

## 三种用法

### 1. 组件级 — InteractivePlayground

用 `InteractivePlayground` 组件包裹单个 vizual 组件。输出 JSON spec，无需 HTML。

读 `references/component-level.md` 获取完整 API（控件类型、布局、targetProp 映射）。

```json
{
  "type": "InteractivePlayground",
  "props": {
    "type": "interactive_playground",
    "title": "柱状图参数探索",
    "component": { "type": "BarChart", "props": { "x": "month", "y": "revenue", "data": [...] } },
    "controls": [
      { "name": "stacked", "label": "堆叠", "type": "toggle", "targetProp": "stacked" },
      { "name": "title", "label": "标题", "type": "text", "targetProp": "title" }
    ]
  }
}
```

可以包裹**任何 vizual 组件**：BarChart、PieChart、RadarChart、DataTable、Kanban、Timeline、KpiDashboard、FeatureTable、BudgetReport、FormBuilder、甚至 DocView。

### 2. 主题级 — 主题试衣页面

生成独立 HTML 页面，用户可切换主题、调数据量、切暗亮模式，所有组件实时响应。

读 `references/theme-level.md` 获取完整 HTML 模板。

页面包含：
- 预设主题按钮 + 自定义 accent 色输入
- 数据量选择（3/6/12）
- 暗亮模式切换
- 调色板色条 + hex 值
- 主题变量显示（accent、radius、spacing、font）
- 9 个代表性组件同时预览
- Mapping Report（显示哪些 token 被正确匹配）

### 3. 自定义级 — 万能骨架

当目标不是组件也不是主题时，用通用 HTML 骨架自己造。

读 `references/custom-level.md` 获取通用骨架、控件速查表和场景灵感。

适用场景举例：
- JSON 编辑器 + 实时 renderSpec
- 算法参数 + 可视化输出
- 任意 HTML 控件 + 任意渲染目标

## 和 vizual 组件的配合

LiveKit 不是独立功能——它和 vizual 的所有 43 个组件 + 主题系统 + DocView 深度集成：

**组件级控件映射**（常用的控件-组件搭配）：

| 组件 | 适合暴露的控件 |
|------|--------------|
| BarChart / LineChart / AreaChart | stacked, horizontal, title, dataCount |
| PieChart / FunnelChart | title, 数据量 |
| RadarChart | title, series 数量 |
| ScatterChart / BubbleChart | x/y 字段选择, bubble size |
| DataTable | 行数, 排序字段 |
| KpiDashboard | metrics 数量, 趋势显示 |
| Kanban | cards 数量, 列数 |
| Timeline | events 数量 |
| FeatureTable | features 数量 |
| FormBuilder | 各字段默认值 |

**主题级控件**（自动作用于所有组件）：
- accent 色 → 图表调色板、按钮、链接、高亮
- 暗/亮模式 → 背景、文字、边框自动反色，accent/chart 色保持
- radius → 所有卡片的圆角
- spacing → 所有间距
- font → 所有字号/字重

## 判断用哪种

| 场景 | 用哪种 | 输出 |
|------|--------|------|
| 在对话流中给一个可调组件 | 组件级 | JSON spec（InteractivePlayground） |
| 需要对比多个主题/配色 | 主题级 | HTML 文件 |
| 需要对比暗亮模式 | 主题级 | HTML 文件 |
| 需要调数据量看效果 | 主题级或自定义 | HTML 文件 |
| 需要调的东西不在 vizual 体系内 | 自定义 | HTML 文件 |
| 用户说"试试""调一下""看看效果" | 判断场景选一种 | - |
| 给 DocView 加交互 | 组件级包裹 DocView | JSON spec |

## 通用原则

1. **控件即文档**：控件本身告诉用户能调什么，不需要额外说明
2. **默认值即最佳实践**：defaultValue 用最合理的初始值
3. **响应要即时**：控件变化后立即重渲染，不要确认按钮
4. **3-8 个控件**：多了分组，少了没意义
5. **保存上下文**：切换主题/数据时，已选的控件状态尽量保留

## 依赖

LiveKit 生成的页面依赖 `vizual.standalone.js`。路径按实际项目调整：
- 通常：`../dist/vizual.standalone.js`
- 或根据用户项目结构确认

关键 API（通过全局 `Vizual` 对象）：
- `Vizual.renderSpec(spec, container)` — 渲染组件
- `Vizual.setGlobalTheme(name)` — 切换主题
- `Vizual.registerTheme(name, theme)` — 注册主题
- `Vizual.mapDesignTokensToTheme(tokens, name)` — token → 主题
- `Vizual.invertTheme(theme)` — 生成反色版本
- `Vizual.chartColors(count)` — 获取当前调色板
- `Vizual.tc(varName)` — 获取具体色值
- `Vizual.toggleMode()` — 暗亮切换
