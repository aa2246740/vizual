---
name: livekit
description: >-
  Create live interactive pages where users adjust controls and see results in real-time.
  This is your real-time adjustment engine — equivalent to the "Tweaks" panel in closed
  design tools, but without the sandbox limitation. Use this skill whenever hands-on
  exploration beats static output: trying themes/colors, tuning chart parameters, comparing
  design options, exploring data distributions, building playgrounds, visualizing algorithms,
  or ANY scenario where "调一下看看" adds value. LiveKit works at three levels:
  component-level (InteractivePlayground), theme-level (full theme adaptation page), and
  custom-level (any adjustable target — you build the HTML, Vizual handles the rendering).
  Because you can write arbitrary code AND use Vizual components, you can create interactive
  experiences that closed design tools cannot match. Trigger proactively when the user
  discusses algorithms, design decisions, data analysis, color systems, layout options, or
  any topic where hands-on > static. Keywords: playground, live preview, interactive demo,
  实时调整, 试衣, 调色板, 参数探索, livekit, sandbox, workbench, 试试看, 对比一下, 调一下,
  tweaks, adjust, slider.
---

# LiveKit — 你的实时交互引擎

LiveKit 解决一个问题：**用户想亲手调一下，而不是看你说完就算了。**

封闭设计工具有"Tweaks"面板让用户拖控件改参数。你有 LiveKit — 同样的能力，但不限在沙盒里。你可以造任何 adjust-preview 体验，嵌入 Vizual 组件，连 API，装 npm 包，做任何事。

## 核心模式

```
控件 (Controls)  →  目标 (Target)  →  实时同步 (Live Sync)
```

- **控件**：slider、select、color picker、toggle、text、button group
- **目标**：Vizual 组件、一组组件、主题、DocView、整个页面、你自己写的任何东西
- **实时同步**：控件变化 → 立刻重渲染，不需要确认按钮

## 什么时候该主动用 LiveKit

不用等用户说"给我一个 playground"。当你判断**亲手调一下会比看静态输出更有收获**时，主动创建。四类触发场景：

### 理解加深型

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| 讨论某个算法（排序、聚类、插值） | 拖参数看算法行为变化 |
| 学色彩空间（OKLCH、HSL） | 拖 L/C/H 看颜色实时变化 |
| 看数据分布 | 调筛选条件/分箱数看分布变化 |
| 理解某个组件怎么工作 | 包裹该组件，暴露关键参数 |

### 设计验证型

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| "试试这个配色方案" | 主题试衣页面，一键切换 |
| "看看暗色模式效果" | 暗亮模式切换 + 全组件预览 |
| "不同品牌色下图表还好看吗" | 多主题对比 + 调色板色条 |
| "柱状图还是饼图好" | 组件类型 buttonGroup 切换对比 |

### 开发调试型

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| "这个图表参数调不对" | InteractivePlayground + 暴露参数 |
| "JSON 输出渲染出来长啥样" | textarea + renderSpec 实时渲染 |
| "数据量大的时候图表还能看吗" | 数据量 slider（3→100）+ 图表 |

### 数据探索型

| 用户可能在说 | LiveKit 怎么帮 |
|-------------|---------------|
| "看看不同维度的数据" | select 切换 x/y 轴字段 |
| "数据量大的时候趋势还明显吗" | 数据量 slider + 趋势图 |
| "不同分组下的分布差异" | 分组 select + 直方图/箱线图 |

## 三种用法

### 1. 组件级 — InteractivePlayground

用 `InteractivePlayground` 组件包裹单个 Vizual 组件。输出 JSON spec，无需 HTML。

读 `references/component-level.md` 获取完整 API。

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

可以包裹**任何 Vizual 组件**：BarChart、PieChart、RadarChart、DataTable、Kanban、Timeline、KpiDashboard、FeatureTable、BudgetReport、FormBuilder、DocView。

### 2. 主题级 — 主题试衣页面

生成独立 HTML 页面，用户可切换主题、调数据量、切暗亮模式，所有组件实时响应。

读 `references/theme-level.md` 获取完整 HTML 模板。

页面包含：
- 预设主题按钮 + 自定义 accent 色输入
- 数据量选择（3/6/12）
- 暗亮模式切换
- 调色板色条 + hex 值
- 9 个代表性组件同时预览

**和 DESIGN.md Parser 的闭环**：用户粘贴设计文档 → design-md-parser 提取 token → LiveKit 展示实时预览。两个 Skill 配合完成"设计文档 → 即时视觉验证"的闭环。

### 3. 自定义级 — 万能骨架

当目标不是 Vizual 组件也不是主题时，用通用 HTML 骨架自己造。这是你的"超越封闭工具"模式 — 你写任意 HTML/CSS/JS，调用任何 API，装任何包。

读 `references/custom-level.md` 获取通用骨架、控件速查表和场景灵感。

最小可用的自定义骨架：

```html
<script src="../dist/vizual.standalone.js"></script>
<style>
  .lk-root { display: flex; gap: 24px; padding: 24px; font-family: system-ui; }
  .lk-controls { width: 280px; flex-shrink: 0; }
  .lk-controls label { display: block; margin-bottom: 12px; font-size: 14px; }
  .lk-controls input[type="range"] { width: 100%; }
  .lk-target { flex: 1; }
</style>
<div class="lk-root">
  <div class="lk-controls">
    <label>参数1 <input type="range" id="param1" min="0" max="100" value="50"></label>
    <label>参数2 <input type="range" id="param2" min="1" max="20" value="10"></label>
  </div>
  <div class="lk-target" id="target"></div>
</div>
<script>
  function render() {
    const p1 = +document.getElementById('param1').value
    const p2 = +document.getElementById('param2').value
    // 用 Vizual 渲染，或者自己写渲染逻辑
    Vizual.renderSpec(buildSpec(p1, p2), document.getElementById('target'))
  }
  document.querySelectorAll('input').forEach(el => el.addEventListener('input', render))
  function buildSpec(p1, p2) { /* 根据参数构建 JSON spec */ }
  render()
</script>
```

适用场景：JSON 编辑器 + 实时渲染、算法参数 + 可视化、任意控件 + 任意目标。

## 判断用哪种

| 场景 | 用哪种 | 输出 |
|------|--------|------|
| 在对话流中给一个可调组件 | 组件级 | JSON spec |
| 需要对比多个主题/配色 | 主题级 | HTML 文件 |
| 需要对比暗亮模式 | 主题级 | HTML 文件 |
| 需要调的东西不在 Vizual 体系内 | 自定义 | HTML 文件 |
| 用户说"试试""调一下""看看效果" | 判断场景选一种 | - |

## 和 Vizual 的深度集成

LiveKit 不是独立功能 — 它和 Vizual 全部 43 个组件 + 主题系统 + DocView 深度集成：

**组件级控件映射**（常用的控件-组件搭配）：

| 组件 | 适合暴露的控件 |
|------|--------------|
| BarChart / LineChart / AreaChart | stacked, horizontal, title |
| PieChart / FunnelChart | title, 数据量 |
| RadarChart | title, series 数量 |
| DataTable | 行数, 排序字段 |
| KpiDashboard | metrics 数量, 趋势显示 |
| Kanban | cards 数量, 列数 |
| FormBuilder | 各字段默认值 |

**主题级控件**（自动作用于所有组件）：
- accent 色 → 图表调色板、按钮、链接、高亮
- 暗/亮模式 → 背景、文字、边框自动反色
- radius → 所有卡片的圆角
- font → 所有字号/字重

## 通用原则

1. **控件即文档**：控件本身告诉用户能调什么
2. **默认值即最佳实践**：defaultValue 用最合理的初始值
3. **响应要即时**：控件变化后立即重渲染
4. **3-8 个控件**：多了分组，少了没意义
5. **保存上下文**：切换主题/数据时，已选的控件状态尽量保留

## 依赖

LiveKit 生成的页面依赖 `vizual.standalone.js`。路径按实际项目调整：
- 通常：`../dist/vizual.standalone.js`

关键 API（通过全局 `Vizual` 对象）：
- `Vizual.renderSpec(spec, container)` — 渲染组件
- `Vizual.setGlobalTheme(name)` — 切换主题
- `Vizual.registerTheme(name, theme)` — 注册主题
- `Vizual.mapDesignTokensToTheme(tokens, name)` — token → 主题
- `Vizual.invertTheme(theme)` — 生成反色版本
- `Vizual.chartColors(count)` — 获取当前调色板
- `Vizual.tc(varName)` — 获取具体色值
- `Vizual.toggleMode()` — 暗亮切换
