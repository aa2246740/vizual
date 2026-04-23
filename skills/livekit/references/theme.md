# Theme System (主题系统)

Vizual 所有组件的颜色通过 CSS 变量（`--rk-*`）统一管理。切换主题时所有组件自动换肤，无需逐个修改。

## 组件级别的 theme prop

大多数图表组件支持 `theme` prop 快速切换明暗：

```json
{ "type": "BarChart", "props": { "type": "bar", "theme": "dark", ... } }
{ "type": "BarChart", "props": { "type": "bar", "theme": "light", ... } }
```

这是**组件级别**的外观切换，只影响单个图表。适用于对比暗色/亮色效果。

## 全局主题系统

Vizual 内置以下全局主题，所有组件共享：

| 主题名 | 风格 |
|-------|------|
| `claude-dark` | Claude 暗色（默认） |
| `claude-light` | Claude 亮色 |
| `default-dark` | 通用暗色 |
| `default-light` | 通用亮色 |
| `linear` | Linear 风格暗色 |
| `linear-light` | Linear 风格亮色 |
| `vercel` | Vercel 风格暗色 |
| `vercel-light` | Vercel 风格亮色 |

宿主应用通过 API 切换全局主题：

```js
import { setGlobalTheme, toggleMode } from 'vizual'

setGlobalTheme('claude-light')  // 切换为亮色
toggleMode()                    // dark ↔ light 一键切换
```

**AI 生成的 JSON spec 不包含全局主题设置** — 主题由宿主应用控制。如果用户要求切换主题，告诉他们使用上述 API。

## DESIGN.md 自定义品牌主题

用户可以提供 DESIGN.md 风格的设计文件，自动生成自定义主题：

```js
import { loadDesignMd } from 'vizual'

const theme = loadDesignMd(markdownContent, { apply: true })
// 1. 解析 markdown → 提取颜色/字体 token
// 2. 语义匹配 → 映射到 --rk-* CSS 变量
// 3. 注册到主题表 + 自动生成反转变体（dark↔light）
// 4. apply: true → 立即注入 DOM，所有组件自动换肤
```

### DESIGN.md 支持的格式（启发式匹配，无需严格格式）

```markdown
## Colors
Primary: #FF6B35
Background: #1a1a2e
Surface: #252836
Text: #eaeaea
Border: #2d2d44
Accent: #667eea
Error: #ef4444
Success: #10b981
Warning: #f59e0b

## Typography
Font Family: Inter, system-ui
Font Size: 14px
```

解析器会自动将语义名（Primary、Background 等）匹配到对应的 `--rk-*` 变量。

### DESIGN.md 工作流程

```
用户 DESIGN.md → loadDesignMd(markdown, { apply: true })
                    ↓
              parseDesignMd()  → DesignTokens
                    ↓
              mapDesignTokensToTheme() → Theme { cssVariables: {...} }
                    ↓
              registerTheme() + invertTheme()
                    ↓
              applyTheme() → CSS variables 注入 DOM
                    ↓
              所有组件通过 tc() 自动获取新颜色
```

## AI 生成时的注意事项

### 能做的
- 用 `theme: "light"` 或 `theme: "dark"` prop 控制单个图表的明暗
- 放两个相同图表（一个 dark、一个 light）做对比展示
- 告诉用户：提供 DESIGN.md 可以自定义品牌色

### 不能通过 JSON spec 做的
- **全局主题切换** — 这是宿主应用 API（`setGlobalTheme` / `toggleMode`），不在 JSON spec 里
- **InteractivePlayground 控制全局主题** — `targetProp` 只能设置组件级别的 `theme` prop（`"light"` / `"dark"`），不能调用全局 API
- **品牌色注入** — 需要宿主应用调用 `loadDesignMd()`，AI spec 无法触发

### 当用户说"用我们的品牌色"时

1. 如果用户提供了 DESIGN.md 内容 → 告诉宿主应用调用 `loadDesignMd(markdown, { apply: true })`
2. 如果用户只提供了几个颜色值 → 告诉宿主应用构造简单的 DESIGN.md 字符串，然后调用 `loadDesignMd()`
3. 在 JSON spec 中，图表会自动使用注入的主题色，无需额外设置

### 可用的 CSS 变量列表

| 变量 | 语义 |
|------|------|
| `--rk-bg-primary` | 主背景 |
| `--rk-bg-secondary` | 卡片/次背景 |
| `--rk-bg-tertiary` | 输入框/悬停背景 |
| `--rk-text-primary` | 主文字 |
| `--rk-text-secondary` | 次要文字 |
| `--rk-text-tertiary` | 提示/禁用文字 |
| `--rk-border` | 边框 |
| `--rk-border-subtle` | 微弱边框 |
| `--rk-accent` | 强调色/品牌色 |
| `--rk-accent-hover` | 强调色悬停 |
| `--rk-accent-muted` | 强调色背景 |
| `--rk-success` / `--rk-error` / `--rk-warning` | 状态色 |
| `--rk-chart-1` ~ `--rk-chart-6` | 图表调色板 |
| `--rk-font-sans` / `--rk-font-mono` | 字体 |
| `--rk-radius-sm` / `--rk-radius-md` / `--rk-radius-lg` | 圆角 |
| `--rk-shadow` | 阴影 |
