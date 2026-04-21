---
name: design-md-creator
description: >
  Create, extend, or reverse-engineer DESIGN.md files — with a live interactive preview page
  so users see and tweak their design system in real-time before exporting. Use this skill
  whenever the user wants to define or refine a visual design system: "create our brand design
  system", "make a DESIGN.md for our startup", "I like how Linear looks, create a design spec",
  "turn our Figma tokens into DESIGN.md", "we have brand colors but no design system",
  "reverse-engineer this screenshot into a design spec", or any request involving design tokens,
  style guides, brand guidelines, or design system creation. Also trigger when the user pastes
  a screenshot, brand guide PDF content, or says "make it look like [company/product]."
  This skill outputs an interactive preview HTML page (powered by Vizual + LiveKit) where users
  adjust colors, typography, and spacing in real-time, then export the final DESIGN.md with
  one click. No CLI dependency — the preview page works in any browser, offline.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# DESIGN.md Creator — 交互式设计系统创建器

这个 skill 做一件事：**帮用户从任何输入创建 DESIGN.md，但不是给一坨文字，而是给一个可以实时调整的预览页面。**

用户看到的是真实渲染的色卡、排版、按钮、卡片——不是抽象的 hex 值。调到满意了一键导出。

## 核心流程

```
用户描述需求 → AI 生成预览 HTML → 用户在浏览器调整 → 一键导出 DESIGN.md
```

1. 根据用户输入（从零/参考/截图/已有规范），推断初始设计系统
2. 生成一个独立的 HTML 预览页面，包含：
   - 左侧：可调参数面板（品牌色、背景色、字体、间距、圆角）
   - 右侧：实时渲染的设计系统预览（色卡、排版、组件样例）
   - 底部：实时生成的 DESIGN.md 文本 + "下载 DESIGN.md" 按钮
3. 告诉用户打开页面，调到满意后点导出
4. 用户保存 DESIGN.md 到项目根目录
5. AI 读取确认

## 第一步：判断输入模式

用户可能从任何起点开始，判断属于哪种：

| 模式 | 用户说的话 | 你需要做的 |
|------|-----------|-----------|
| 从零开始 | "我们是做医疗SaaS的" | 推断风格 → 向用户确认2-3个方向 → 生成预览页 |
| 参考风格 | "做成Linear那种感觉" | 提取参考特征 → 生成预览页 |
| 截图反推 | [贴了张截图] | 分析视觉特征 → 生成预览页 |
| 已有规范 | "我们有Figma tokens" | 提取token → 补全缺失部分 → 生成预览页 |
| 部分补全 | "品牌色#FF6B35, 其他没定" | 围绕锚点推导 → 生成预览页 |
| 修改扩展 | "把现有DESIGN.md的强调色换绿" | 读取文件 → 调整 → 重新生成预览页 |

**重要**：不要在对话里写完整个 DESIGN.md 文本让用户看。直接生成预览 HTML，让用户在浏览器里看效果。

## 第二步：推断初始设计系统

根据输入模式，推断以下设计参数作为预览页的初始值：

### 必须推断的参数

```js
{
  brandName: '品牌名',
  // 颜色
  accentColor: '#hex',        // 品牌强调色
  bgColor: '#hex',            // 页面背景
  cardBg: '#hex',             // 卡片背景
  textColor: '#hex',          // 主文字
  textSecondary: '#hex',      // 次文字
  borderColor: '#hex',        // 边框
  successColor: '#10b981',    // 成功色（通常不需要改）
  warningColor: '#f59e0b',    // 警告色
  errorColor: '#ef4444',      // 错误色
  // 排版
  headingFont: 'Font Name',
  bodyFont: 'Font Name',
  monoFont: 'Font Name',
  baseFontSize: 16,           // px
  headingWeight: 600,
  // 间距（内外分离）
  padY: 8,                    // 垂直内间距 (padding)
  padX: 12,                   // 水平内间距 (padding)
  gapY: 20,                   // 垂直外间距 (gap/margin)
  gapX: 16,                   // 水平外间距 (gap/margin)
  // 圆角
  radiusSmall: 4,             // px
  radiusMedium: 8,
  radiusLarge: 12,
  // 深度方式
  depthMode: 'border|shadow|flat',
  // 模式
  isDark: true/false
}
```

### 推断逻辑

**从零开始**：根据行业和描述选择方向
- 医疗/金融 → 冷色、专业、较大圆角
- 教育/儿童 → 暖色、友好、大圆角
- 开发者工具 → 暗色、紧凑、小圆角、mono 字体
- 消费品/电商 → 品牌色驱动、中性背景

**参考风格**：提取已知产品特征
- Linear: 暗色(#000)、紧凑、border 代替 shadow、Inter 字体、tight letter-spacing
- Vercel: 极简黑白、大标题、mono 点缀
- Stripe: 冷灰白(#F6F9FC)、紫色强调、精致渐变
- Apple: 大留白、产品图驱动、SF Pro
- Notion: 温暖米色、serif 混排
- Figma: 活力紫、圆角卡片

**部分补全**：围绕已有锚点推导
- 给了品牌色 → 用 OKLCH 色轮推导互补/邻近色
- 给了暗/亮 → 推导对应的背景/文字/边框色阶
- 给了字体 → 推导合适的字重和行高

## 第三步：生成预览 HTML

基于 **Vizual + LiveKit** 生成一个交互式预览页面。页面使用 `vizual.standalone.js` 渲染真正的 Vizual 组件（KPI 仪表盘、柱状图、饼图、数据表格等），通过 Vizual 主题系统实时响应用户的控件调整。

### 核心流程

```
用户调控件 → deriveDesignTokens() → Vizual.mapDesignTokensToTheme() → Vizual.setGlobalTheme()
                                                              ↓
                                              所有 Vizual 组件自动重渲染
                                                              ↓
                                              generateDesignMd() 更新导出文本
```

### 页面结构

**左侧控件栏**（基于 DESIGN.md 的关键设计决策，所有控件变化立即触发重渲染）：
1. 明暗模式：toggle（通过 `Vizual.toggleMode()` 切换）
2. 品牌色：color picker
3. 色温暖度：slider（-20 到 +20，正值偏暖黄，负值偏冷蓝）
4. 亮度：slider（0-100，控制背景明暗）
5. 标题字体 / 正文字体：select（16 个 Google Fonts）
6. 内间距（padding）：垂直 / 水平 两个独立 slider
7. 外间距（gap）：垂直 / 水平 两个独立 slider
8. 圆角：slider
9. 深度方式：三选一按钮组（边框 / 阴影 / 扁平）

**调色板条**：通过 `Vizual.chartColors(6)` 自动展示当前主题的 6 色调色板

**Vizual 组件网格**（grid 布局，自适应列数）：
- KpiDashboard：3 个 KPI 指标
- BarChart：6 个月销售数据
- PieChart：市场份额
- DataTable：数据表格 + 状态列
- LineChart：趋势折线图
- Alert：语义色在真实提示中的效果

**底部导出区**：
- 实时 DESIGN.md 文本预览（只读 textarea，随控件变化更新）
- "下载 DESIGN.md" / "复制到剪贴板" 按钮

### 依赖

预览页面**依赖 `vizual.standalone.js`**（已包含 React + ECharts + 所有 43 个组件）。生成 HTML 时，`<script src>` 路径根据用户项目中 vizual 的实际位置填写。

### HTML 模板

读完整模板：[references/preview-template.html](references/preview-template.html)

模板的关键架构：

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
  <style>/* 控件栏 + 组件网格 + 底部导出 */</style>
</head>
<body>
  <div id="controls"><!-- 明暗、品牌色、暖度、亮度、字体、内间距(Y/X)、外间距(Y/X)、圆角、深度方式 --></div>
  <div id="palette-bar"><!-- Vizual.chartColors() 调色板 --></div>
  <div id="theme-grid"><!-- Vizual 组件网格 --></div>
  <div id="export"><!-- DESIGN.md textarea + 下载/复制 --></div>

  <script src="${VIZUAL_PATH}"></script>
  <script>
    // deriveTokens() → Vizual.mapDesignTokensToTheme() → registerTheme + setGlobalTheme
    // renderGrid() 用 Vizual.renderSpec() 渲染真实组件
    // toggleDarkMode() 用 Vizual.toggleMode()
  </script>
</body>
</html>
```

## 第四步：引导用户

生成 HTML 后，告诉用户：

1. "我生成了一个交互式预览页面：`design-preview.html`"
2. "用浏览器打开它，你可以实时调整颜色、字体、间距"
3. "调到满意后，点页面底部的'下载 DESIGN.md'按钮"
4. "把下载的 DESIGN.md 放到项目根目录"

对于 Claude Code 用户，追加：
"保存后告诉我，我会读取文件确认。"

## DESIGN.md 的 9 个标准章节

预览页面底部的"下载 DESIGN.md"按钮生成的文本，必须包含以下 9 个章节：

| # | 章节 | 内容 |
|---|------|------|
| 1 | Visual Theme & Atmosphere | 2-3 段文字描述设计哲学。回答"为什么长这样" |
| 2 | Color Palette & Roles | 每个颜色：语义名 + hex值 + 用途描述 |
| 3 | Typography Rules | 字体族 + 层级表格（Size/Weight/LineHeight/LetterSpacing） |
| 4 | Component Styles | 按钮、卡片、输入框的样式规则 |
| 5 | Layout Principles | 间距系统、网格、圆角层级 |
| 6 | Depth & Elevation | 阴影层级表 |
| 7 | Do's and Don'ts | 推荐和禁止的做法 |
| 8 | Responsive Behavior | 断点表格 |
| 9 | Agent Prompt Guide | 快速色卡参考 + 组件提示词 |

### 写作原则

**原因 > 规则**：每个规则附带 rationale。
- 差：`Border radius: 8px`
- 好：`Border radius: 8px — 足够圆润感觉友好但不显得轻浮，符合专业定位`

**颜色命名**：语义名 + hex + 用途。
- 差：`Primary: #3366FF`
- 好：`**Trust Blue** (#3366FF): 主品牌色，用于CTA按钮和关键交互 — 传达可信感`

**内部一致性**：
- 中性色统一色温（全暖或全冷）
- Spacing 基于 base unit
- Border radius 有合理层级

## 特殊场景

### 用户想看暗色和亮色两个版本
预览页面的暗亮 toggle 会自动切换。下载时，DESIGN.md 里同时包含 light 和 dark 变体的颜色定义。

### 混合中英文项目
Typography 部分覆盖中文排版字体（PingFang SC / Noto Sans SC）和英文/数字字体的混排行高。

### 用户说"我也不太懂设计，你帮我定"
选择一个成熟预设方向，给 3 个快速选项让用户在预览页里切换比较。生成后附简短使用说明。

### 用户已有 DESIGN.md 想修改
读取现有文件，提取参数填充到预览页控件中。用户在页面上改完重新导出。

## 与其他 Skill 的配合

- **design-md-parser**：用户导出 DESIGN.md 后，可以用 parser skill 把它应用到 Vizual 的 43 个组件上实现自动换肤。
- **livekit**：如果用户还想在 Vizual 组件上实时预览主题效果，可以引导到 livekit skill 的主题试衣页面。
- **vizual**：最终 DESIGN.md 会被 AI Agent 用来指导 Vizual 组件的渲染风格。

## Reference

完整的预览页面 HTML 模板：[references/preview-template.html](references/preview-template.html)

DESIGN.md 示例（Claude/Anthropic 风格）：[references/example-claude.md](references/example-claude.md)
