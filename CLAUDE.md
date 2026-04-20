<!-- GSD:project-start source:PROJECT.md -->
## Project

**AI RenderKit**

json-render 生态中最全的 AI 数据可视化 Catalog。将 mviz 的 24 种图表/UI 组件与 RenderKit 自研的 11 种业务组件（看板、甘特图、组织架构等）统一封装为 React 组件 + Zod Schema，接入 json-render 平台。AI 输出 JSON → json-render 自动渲染为交互式可视化组件。

面向三类用户：AI 用户（Claude/ChatGPT 对话中看到图表）、开发者（调用 render(json) 获得组件）、AI Agent（输出符合 Schema 的 JSON 自动渲染）。

**Core Value:** AI 说出结构化 JSON → 自动渲染为可交互的可视化组件，直接嵌入对话流或应用中。

### Constraints

- **依赖**: React 18+, Zod v4, ECharts 5.x, mviz 1.6.4+, json-render 0.16+
- **包体积**: ECharts 按需加载，目标 gzip 后 < 300KB（不含 ECharts CDN）
- **浏览器**: Chrome 90+, Firefox 90+, Safari 15+
- **json-render 稳定性**: v0.16.0 API 可能变化，需要版本锁定
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Core Stack
| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| UI Framework | React | 18+ | json-render requires React; most widely adopted |
| Schema Validation | Zod | v4 (not v3) | json-render 0.16 uses Zod v4; breaking change from v3 |
| Chart Engine | ECharts | 5.5+ | mviz uses ECharts; 50+ chart types; rich interaction |
| Chart Bridge | mviz | 1.6.4 | Provides buildBarOptions() etc.; don't rewrite |
| Platform | json-render | 0.16.0 | defineCatalog + defineRegistry + Renderer pattern |
| Build Tool | esbuild | 0.28+ | Already in use; fast bundling |
| Testing | Vitest | 4.x | Already in use; 469 tests passing |
| Language | TypeScript | 6.x | Already in use |
## What NOT to Use
| Technology | Why Not |
|-----------|---------|
| Chart.js | Replaced by ECharts via mviz; no reason to keep dual chart engines |
| Rollup | esbuild already working; rollup config was broken |
| Zod v3 | json-render requires v4; incompatible API changes |
| AntV G2 | CDN unstable; would add second chart engine for no benefit |
| Vega-Lite | Overkill for our use case; ECharts already covers everything |
## Dependency Strategy
### Required Dependencies
### Peer Dependencies
### Remove These
## ECharts Bundle Size Strategy
- **Full bundle**: ~800KB (unacceptable)
- **Minimal bundle** (bar, line, pie, scatter): ~250KB
- **Strategy**: Use ECharts CDN in browser (like mviz does) or tree-shake with `echarts/charts` imports
- **mviz approach**: Loads ECharts from CDN (`cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js`) in generated HTML
- **Our approach**: Same CDN strategy for browser; for npm package, re-export ECharts as peer dependency
## json-render Integration Pattern
## Confidence Levels
| Decision | Confidence | Risk |
|----------|-----------|------|
| React 18+ | 95% | json-render requires it |
| Zod v4 | 90% | json-render 0.16 confirmed using v4 |
| ECharts 5.5+ | 95% | mviz uses it; industry standard |
| mviz as dependency | 80% | Internal API not officially documented; may break on major update |
| json-render 0.16 | 70% | Pre-1.0; API may change; need version pinning |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### 组件开发规范（必须遵守）

所有 vizual 组件，无论是现有还是未来新增的，**必须**遵守以下规则：

#### 1. 颜色：使用 tc()，禁止硬编码

```tsx
// ❌ 错误 — 硬编码颜色
<div style={{ background: '#111', color: '#e5e5e5', border: '1px solid #2a2a2a' }}>

// ✅ 正确 — 使用 tc() 从主题获取
import { tc } from '../../core/theme-colors'
<div style={{ background: tc('--rk-bg-primary'), color: tc('--rk-text-primary'), border: `1px solid ${tc('--rk-border-subtle')}` }}>
```

**tc() 导入路径**：
- `src/components/xxx/component.tsx` → `import { tc } from '../../core/theme-colors'`
- `src/mviz-bridge/xxx/component.tsx` → `import { tc } from '../../core/theme-colors'`
- `src/inputs/xxx/component.tsx` → `import { tc } from '../../core/theme-colors'`
- `src/docview/xxx.tsx` → `import { tc } from '../core/theme-colors'`

#### 2. 可用主题变量完整列表

| 变量 | 语义 | 默认值 |
|------|------|--------|
| `--rk-bg-primary` | 主背景 | #0f1117 |
| `--rk-bg-secondary` | 卡片/次背景 | #1e293b |
| `--rk-bg-tertiary` | 输入框/悬停背景 | #252836 |
| `--rk-text-primary` | 主文字 | #e2e8f0 |
| `--rk-text-secondary` | 次要文字 | #94a3b8 |
| `--rk-text-tertiary` | 提示/禁用文字 | #64748b |
| `--rk-border` | 边框 | #1e293b |
| `--rk-border-subtle` | 微弱边框 | #2d3148 |
| `--rk-accent` | 强调色/品牌色 | #667eea |
| `--rk-accent-hover` | 强调色悬停 | #7c8ff5 |
| `--rk-accent-muted` | 强调色背景 | rgba(102,126,234,0.15) |
| `--rk-success` | 成功色 | #10b981 |
| `--rk-success-muted` | 成功色背景 | rgba(16,185,129,0.15) |
| `--rk-warning` | 警告色 | #f59e0b |
| `--rk-warning-muted` | 警告色背景 | rgba(245,158,11,0.15) |
| `--rk-error` | 错误色 | #ef4444 |
| `--rk-error-muted` | 错误色背景 | rgba(239,68,68,0.15) |
| `--rk-font-sans` | 正文字体 | -apple-system, ... |
| `--rk-font-mono` | 等宽字体 | SF Mono, ... |
| `--rk-radius-sm` | 小圆角 | 4px |
| `--rk-radius-md` | 中圆角 | 8px |
| `--rk-radius-lg` | 大圆角 | 10px |
| `--rk-shadow` | 阴影 | 0 4px 12px rgba(0,0,0,0.3) |
| `--rk-chart-1` ~ `--rk-chart-6` | 图表调色板 | 6色 |

#### 3. 哪些颜色可以不使用 tc()

- **数据驱动颜色**：图表 series 颜色（由 ECharts/mviz 生成的 option）、表格中按数据值变化的颜色
- **用户可选择颜色**：批注高亮色 (#fbbf24 等)、颜色选择器的默认值
- **白/黑对比色**：在主题色背景上的白/黑文字（如深色按钮上的 `#fff`）可以用 `tc('--rk-text-primary')`

#### 4. 新增组件的文件结构

```
src/components/new-widget/
├── schema.ts          # Zod Schema + 类型导出
├── component.tsx      # React 组件（必须 import { tc }）
└── index.ts           # 重导出
```

#### 5. 组件注册三步

1. **catalog.ts** — 注册 Schema：`BarChartSchema,`
2. **registry.tsx** — 映射 type → 组件：`BarChart,`
3. **index.ts** — 导出：`export { BarChart, BarChartSchema } from './mviz-bridge/bar-chart'`

#### 6. DESIGN.md 主题系统

用户通过 `loadDesignMd(markdown)` 加载主题后，所有用 `tc()` 的组件自动换肤，无需组件感知主题存在。

```ts
import { loadDesignMd } from 'vizual'
loadDesignMd(designMdContent, { apply: true })
```

**新增组件时**：只要用 `tc()` 取色，就自动支持 DESIGN.md 主题。不需要做任何额外工作。
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

```
DESIGN.md (markdown)
    │ parseDesignMd()
    ▼
DesignTokens { colors, typography, spacing, radius }
    │ mapDesignTokensToTheme()
    ▼
Theme { name, cssVariables: { '--rk-*': '...' } }
    │ registerTheme() + applyTheme()
    ▼
CSS variables injected → tc('--rk-bg-primary') → '#0b0b0b'
    │
    ▼  所有组件通过 tc() 读取主题色，自动换肤
```

**关键文件：**
- `src/themes/design-md-parser.ts` — DESIGN.md 解析器
- `src/themes/design-md-mapper.ts` — token → --rk-* 映射
- `src/themes/index.ts` — 主题注册表 + loadDesignMd() API
- `src/themes/default-dark.ts` — 默认暗色主题
- `src/core/theme-colors.ts` — tc() 颜色访问器 + chartColors()

**数据流：**
1. 用户调用 `loadDesignMd(markdown, { apply: true })`
2. 解析 markdown → 提取颜色/字体/间距 token
3. 语义匹配 → 映射到 --rk-* CSS 变量（缺失的回退 default-dark）
4. 注入 CSS 变量到 DOM
5. 所有组件的 `tc()` 调用自动获取新颜色
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
