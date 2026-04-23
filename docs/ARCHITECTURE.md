# 架构设计 — Vizual

## 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                     宿主应用 (React)                       │
│                                                          │
│   <StateProvider>                                        │
│     <Renderer spec={aiJson} registry={registry} />       │
│   </StateProvider>                                       │
│                                                          │
│   ┌─── vizual ──────────────────────────────┐     │
│   │                                                 │     │
│   │  catalog.ts  ── defineCatalog(schema, 32组件)       │     │
│   │  registry.tsx ── defineRegistry(catalog, 组件)       │     │
│   │  index.ts    ── 统一导出                         │     │
│   │                                                 │     │
│   │  ┌── mviz-bridge/ (20 组件) ──────────────┐     │     │
│   │  │  Charts (19):  BarChart ~ RadarChart    │     │     │
│   │  │  UI (1):       DataTable                │     │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── components/ (10 组件) ───────────────┐      │     │
│   │  │  Timeline, Kanban, GanttChart,         │      │     │
│   │  │  GridLayout, SplitLayout, HeroLayout,  │      │     │
│   │  │  InteractivePlayground, ...            │      │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── inputs/ (1 组件) ────────────────────┐      │     │
│   │  │  FormBuilder                           │      │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── docview/ (1 组件) ───────────────────┐      │     │
│   │  │  DocView + annotation subsystem         │      │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── core/ ──────────────────────────────┐       │     │
│   │  │  echarts-wrapper.tsx  共享 ECharts 容器│       │     │
│   │  │  echarts-bridge-factory.tsx  通用工厂  │       │     │
│   │  │  export.ts  PNG 导出 API              │       │     │
│   │  │  pan-zoom.ts  SVG 拖拽平移+缩放       │       │     │
│   │  │  fallback.ts  降级容器                │       │     │
│   │  │  errors.ts   自定义错误类型           │       │     │
│   │  └────────────────────────────────────────┘       │     │
│   │                                                 │     │
│   └─────────────────────────────────────────────────┘     │
│                                                          │
│   ┌── 外部依赖 ──────────────────────────────────┐       │
│   │  @json-render/core  ── defineCatalog          │       │
│   │  @json-render/react ── defineRegistry, Renderer│       │
│   │  echarts            ── 图表引擎               │       │
│   │  mviz               ── chart option builder   │       │
│   │  zod                ── Schema 校验            │       │
│   └───────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

## 数据流

### 1. AI Skill 触发

```
用户（在 Claude Code 中）: "用柱状图展示季度销售"
         │
         ▼
vizual Skill 自动触发:
  1. 读取 SKILL.md → 了解输出格式、组件选择指南
  2. 按需读取 references/component-catalog.md → 获取 BarChart 完整 Schema
  3. 生成符合规范的 JSON spec
```

### 2. AI 输出 → 渲染

```
AI Skill 输出 JSON:
{
  "root": "main",
  "elements": {
    "main": {
      "type": "BarChart",
      "props": { "type":"bar", "x":"quarter", "y":"revenue", "data":[...] },
      "children": []
    }
  }
}
         │
         ▼
开发者将 JSON 传入代码:
         │
         ▼
json-render Renderer:
  1. 解析 spec.root → "main"
  2. 查找 elements.main.type → "BarChart"
  3. 从 registry 查找 BarChart → React 组件函数
  4. 用 elements.main.props 调用组件
         │
         ▼
BarChart 组件:
  1. 调用 mviz buildBarOptions(props) → ECharts option
  2. mviz 不可用 → fallback 到手动 option builder
  3. echarts.init(dom) → setOption(option)
  4. ResizeObserver 监听容器变化 → chart.resize()
         │
         ▼
DOM: <div> 里的 ECharts 图表
```

## 源码结构

```
src/
├── index.ts              # 统一导出入口
├── catalog.ts            # defineCatalog — 注册 32 个组件的 Schema + 3 个 action handler
├── registry.tsx          # defineRegistry — Schema → React 组件映射 + action 实现
│
├── mviz-bridge/          # 20 个 mviz 桥接组件 (19 图表 + 1 UI)
│   ├── bar-chart/        # 唯一手写的 bridge（参考实现）
│   │   ├── schema.ts     # Zod Schema + 类型导出
│   │   ├── component.tsx # React 组件（ECharts + mviz fallback）
│   │   ├── index.ts      # 重导出
│   │   └── component.test.tsx
│   │
│   ├── area/             # 生成 bridge
│   ├── line/             # 生成 bridge
│   ├── pie/              # ... 共 19 个图表 bridge:
│   ├── scatter/          #   area, bar-chart, boxplot, bubble,
│   ├── bubble/           #   calendar, combo, dumbbell, funnel,
│   ├── boxplot/          #   heatmap, histogram, line, mermaid,
│   ├── histogram/        #   pie, radar, sankey, scatter,
│   ├── waterfall/        #   sparkline, waterfall, xmr
│   ├── xmr/
│   ├── sankey/
│   ├── funnel/
│   ├── heatmap/
│   ├── calendar/
│   ├── sparkline/
│   ├── combo/
│   ├── dumbbell/
│   ├── radar/
│   └── mermaid/          # Mermaid 流程图（动态 import mermaid.js）
│
│   └── table/            # DataTable 数据表格
│
│   └── __tests__/        # 共享测试工具
│
├── components/           # 10 个自定义业务组件
│   ├── timeline/         # 时间线
│   ├── kanban/           # 看板
│   ├── gantt/            # 甘特图
│   ├── org-chart/        # 组织架构图
│   ├── kpi-dashboard/    # KPI 仪表盘
│   ├── audit-log/        # 操作日志
│   ├── grid-layout/      # CSS Grid 布局容器
│   ├── split-layout/     # 双栏分割布局
│   ├── hero-layout/      # 大幅 Hero 区块
│   ├── interactive-playground/  # 交互式参数探索组件
│   └── __tests__/        # 共享测试工具
│
├── inputs/               # 交互输入组件 (1)
│   ├── form-builder/     # FormBuilder — 动态表单构建器
│   └── __tests__/        # 共享测试工具
│
├── docview/              # 文档批注子系统
│   ├── schema.ts         # DocView Zod Schema
│   ├── container.tsx     # DocView 主容器组件
│   ├── section-renderer.tsx    # Section 渲染器（支持 text/heading/chart/kpi/table/callout/component/markdown/freeform）
│   ├── annotatable-wrapper.tsx # 批注包装器（简单组件批注化）
│   ├── annotation-overlay.tsx  # 批注高亮叠层
│   ├── annotation-input.tsx    # 批注输入组件
│   ├── annotation-panel.tsx    # 批注侧边面板
│   ├── annotation-context.ts   # 批注上下文桥接
│   ├── section-context.ts      # Section 语义上下文（aiContext enrichment）
│   ├── layout-wrappers.tsx     # Section 布局变体（hero/split/grid/banner/card/compact）
│   ├── freeform-renderer.tsx   # 自由 HTML 渲染
│   ├── markdown-renderer.tsx   # Markdown 渲染
│   ├── use-annotations.ts      # 批注状态管理 hook
│   ├── use-text-selection.ts   # 文本选区 hook
│   ├── use-revision-loop.ts    # AI 修订循环 hook
│   ├── use-version-history.ts  # 版本历史 hook
│   ├── types.ts                # 类型定义 + 批注颜色常量
│   ├── index.ts                # 统一导出
│   └── __tests__/              # 测试
│
├── core/                 # 共享工具
│   ├── echarts-wrapper.tsx        # ECharts React 容器
│   ├── echarts-bridge-factory.tsx # 通用 ECharts bridge 工厂函数
│   ├── export.ts                  # PNG 导出 API（exportToPNG, downloadPNG）
│   ├── pan-zoom.ts                # SVG 拖拽平移 + 滚轮/pinch 缩放
│   ├── fallback.ts                # 降级容器（createFallbackContainer）
│   ├── errors.ts                  # SchemaNotFoundError 自定义错误
│   ├── theme-colors.ts            # tc() / tcss() 颜色访问器 + chartColors() 调色板
│   ├── types.ts                   # 共享类型
│   ├── router.ts                  # 路由工具
│   └── index.ts                   # core 统一导出
│
└── themes/               # 主题系统
    ├── index.ts                  # 主题注册表 + loadDesignMd() + setGlobalTheme() + toggleMode()
    ├── design-md-parser.ts       # DESIGN.md 解析器（支持多种格式）
    ├── design-md-mapper.ts       # DesignTokens → --rk-* 映射
    ├── default-dark.ts           # 默认暗色主题
    ├── default-light.ts          # 默认亮色主题
    ├── claude-dark.ts            # Claude 风格暗色主题
    ├── claude-light.ts           # Claude 风格亮色主题
    ├── linear.ts                 # Linear.app 风格主题
    └── vercel.ts                 # Vercel 风格主题
```

## 组件四种实现模式

### 模式一：ECharts Bridge（19 个图表）

```tsx
// 每个 Chart 组件的内部逻辑:
// 1. 尝试 mviz buildXxxOptions(props)
// 2. 失败则 fallback 到手动 option builder
// 3. echarts.init() + setOption()
// 4. ResizeObserver 自动响应

// 或用工厂函数生成:
import { createEChartsBridge } from '../core/echarts-bridge-factory'

const AreaChart = createEChartsBridge('area', (props) => ({
  // 手动 fallback option
  xAxis: { type: 'category', data: props.data.map(d => d[props.x]) },
  yAxis: { type: 'value' },
  series: [{ type: 'line', areaStyle: {}, data: ... }],
}))
```

### 模式二：React 重实现（1 个 UI 组件）

```tsx
// DataTable — 用 React 重写表格组件
export function DataTable(props: DataTableProps) {
  return (
    <table style={{ ... }}>
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
  )
}
```

### 模式三：自定义业务组件（10 个）

```tsx
// 完全自定义，不依赖 mviz
export function Timeline(props: TimelineProps) {
  return (
    <div style={{ paddingLeft: 24 }}>
      <div style={{ position: 'absolute', width: 2, ... }} />
      {props.events.map(event => (
        <div key={i}>
          <div style={dotStyle} />
          <div>{event.date}</div>
          <div>{event.title}</div>
        </div>
      ))}
    </div>
  )
}
```

### 模式四：布局容器组件（3 个）

```tsx
// GridLayout — CSS Grid 容器，子组件按列排列
// SplitLayout — 双栏分割，可配置方向和比例
// HeroLayout — 大幅 Hero 区块，支持渐变/纯色/透明背景
// 均通过 json-render children 机制组合子组件
```

## 布局组件

Vizual 提供 3 种布局容器，通过 json-render 的 `children` 机制组合子组件：

### GridLayout

CSS Grid 布局容器。将子组件按指定列数排列。

```json
{
  "type": "GridLayout",
  "props": { "columns": 3, "gap": 12, "columnWidths": ["1fr", "2fr", "1fr"] },
  "children": ["kpi1", "kpi2", "kpi3"]
}
```

**Schema**：`columns`（1-12，默认 2）、`gap`（默认 12px）、`columnWidths`（可选，CSS grid-template-columns 值数组）

### SplitLayout

双栏分割布局，支持水平/垂直方向和自定义比例。

```json
{
  "type": "SplitLayout",
  "props": { "direction": "horizontal", "ratio": 60, "gap": 16 },
  "children": ["leftPanel", "rightPanel"]
}
```

**Schema**：`direction`（horizontal/vertical，默认 horizontal）、`ratio`（10-90，默认 50）、`gap`（默认 0）

### HeroLayout

大幅 Hero 区块，适合报告封面或突出展示。

```json
{
  "type": "HeroLayout",
  "props": { "height": 240, "background": "gradient", "align": "center" },
  "children": ["heroContent"]
}
```

**Schema**：`height`（默认 200px）、`background`（gradient/solid/transparent，默认 gradient）、`align`（top/center/bottom，默认 center）

## InteractivePlayground

InteractivePlayground 是一个元组件（meta-component），将任意 Vizual 组件包裹为可交互的参数探索器。AI 定义控件（slider、select、toggle、color、text、number、buttonGroup），用户调整参数后实时重渲染。

### 7 种控件类型

| 类型 | 用途 | 关键属性 |
|------|------|----------|
| `slider` | 数值范围 | min, max, step, defaultValue |
| `select` | 选项选择 | options, values, defaultValue |
| `toggle` | 开关切换 | defaultValue (boolean) |
| `color` | 颜色选择 | defaultValue (hex) |
| `text` | 文本输入 | defaultValue, placeholder |
| `number` | 数值输入 | min, max, step, defaultValue |
| `buttonGroup` | 按钮组选择 | options, values, defaultValue |

### 使用方式

```json
{
  "type": "InteractivePlayground",
  "props": {
    "type": "interactive_playground",
    "title": "柱状图参数探索",
    "component": {
      "type": "BarChart",
      "props": { "x": "month", "y": "revenue", "data": [...] }
    },
    "controls": [
      { "name": "stacked", "label": "堆叠模式", "type": "toggle", "targetProp": "stacked", "defaultValue": false },
      { "name": "title", "label": "标题", "type": "text", "targetProp": "title", "defaultValue": "月度销售" },
      { "name": "chartType", "label": "图表类型", "type": "buttonGroup", "targetProp": "type", "options": ["bar", "column"], "values": ["bar", "column"] }
    ],
    "layout": "side-by-side"
  }
}
```

**布局**：`side-by-side`（控件在左，渲染在右）或 `stacked`（控件在上，渲染在下）

## Action Handlers

Vizual 注册了 3 个 action handler，允许宿主应用响应组件交互：

### submitForm

```typescript
submitForm({ formId?: string, data: Record<string, unknown> })
```

FormBuilder 表单提交时触发。宿主应用通过 `handlers()` 接收提交数据，可用于服务端校验、触发 AI 工作流等。

### requestRevision

```typescript
requestRevision({ annotationId: string, text: string, note: string })
```

DocView 中单个批注请求 AI 修订。宿主应用将其连接到 AI API，传入批注上下文。

### batchSubmit

```typescript
batchSubmit({ annotations: Array<{ id: string, text: string, note: string, color: string }> })
```

批量提交多个批注的 AI 修订请求。用于 DocView 修订循环中一次性发送所有草稿批注。

### 宿主应用接入

```tsx
import { registry, handlers } from 'vizual'
import { Renderer, StateProvider, JSONUIProvider } from '@json-render/react'

function App() {
  return (
    <StateProvider>
      <JSONUIProvider handlers={handlers}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>
    </StateProvider>
  )
}
```

或通过命令式 API：

```typescript
import { executeAction } from 'vizual'
executeAction('submitForm', { formId: 'my-form', data: { name: 'Alice' } })
```

## DocView 架构

DocView 是一个文档批注组件，支持结构化文档渲染 + AI 辅助批注修订。

### Section 类型

| 类型 | 说明 | 关键属性 |
|------|------|----------|
| `text` | 纯文本段落 | content |
| `heading` | 标题 | content, level (1-6) |
| `chart` | 图表 | data, componentType |
| `kpi` | KPI 指标 | data |
| `table` | 数据表格 | data |
| `callout` | 提示块 | content, variant (info/warning/success/error/neutral) |
| `component` | 嵌入 vizual 组件 | data, componentType |
| `markdown` | Markdown 内容 | content |
| `freeform` | 自由 HTML | content |

### 批注系统

```
DocView
├── SectionRenderer — 逐 section 渲染内容
│   └── AnnotatableWrapper — 包裹每个可批注区域
│       ├── AnnotationOverlay — 高亮 + 选区
│       └── AnnotationInput — 批注输入框
├── AnnotationPanel — 侧边批注列表
├── useAnnotations — 批注 CRUD 状态管理
├── useTextSelection — 文本选区追踪
├── useRevisionLoop — AI 修订循环（draft → submitted → revised）
└── useVersionHistory — 版本快照和回退
```

### AI 上下文增强

每个 section 可声明 `aiContext` 字段——AI 编写的语义描述（如 "Q3 revenue KPI showing $2.4M with 12.3% YoY growth"）。该字段包含在批注 payload 中，使 AI 在修订时理解用户正在评论的具体内容。

### Section 布局变体

每个 section 可指定 `layout` 属性改变视觉呈现：`default`、`hero`、`split`、`grid`、`banner`、`card`、`compact`。

## 依赖关系图

```
                    ┌──────────┐
                    │ vizual │
                    └─────┬────┘
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
    │@json-render│  │  echarts   │  │   mviz    │
    │ core+react │  │   5.6.0   │  │  1.6.4    │
    │  0.17.0    │  │ Apache-2  │  │   MIT     │
    │ Apache-2   │  └─────┬─────┘  └─────┬─────┘
    └─────┬─────┘        │               │
          │               │         buildXxxOptions()
          │         init + setOption    │
          │               │               │
    defineCatalog    ┌─────┴───────────────┘
    defineRegistry   │
    Renderer         │  Charts (19): mviz → ECharts option → 渲染
                     │  UI (1): React inline styles
                     │  Business (10): React inline styles
                     │  Layout (3): React inline styles + children
                     │  Inputs (1): React inline styles
                     │  DocView (1): React + annotation subsystem
                     │
    ┌────────────────┴────────────────┐
    │            zod ^3.25 (MIT)       │
    │      Schema 定义 + 校验          │
    └─────────────────────────────────┘

    [peer] react >=18  ── 宿主应用提供
    [peer] react-dom >=18
```

## 主题系统

### 设计目标

所有 32 个组件的颜色统一由主题系统管理。用户提供一份 DESIGN.md 或选择预设主题，`loadDesignMd()` 解析后注入 CSS 变量，组件通过 `tc()` / `tcss()` 自动换肤。

### 数据流

```
DESIGN.md (markdown)
    │
    ▼ parseDesignMd()        — 启发式解析（颜色/字体/间距/圆角）
DesignTokens
    │
    ▼ mapDesignTokensToTheme() — 语义匹配 → --rk-* CSS 变量
Theme { name, mode, cssVariables }
    │
    ▼ registerTheme() + applyTheme()
CSS 变量注入 DOM
    │
    ▼ tc('--rk-bg-primary') → '#0f1117'（具体色值）
    ▼ tcss('--rk-bg-primary') → 'var(--rk-bg-primary)'（CSS 引用）
所有组件通过 tc()/tcss() 读取主题色
```

### tcss() vs tc() 区别

| 函数 | 返回值 | 适用场景 | 原因 |
|------|--------|----------|------|
| `tcss(varName)` | `var(--rk-xxx)` | React inline style | CSS 引擎在 paint 时解析，主题切换自动生效 |
| `tc(varName)` | `#0f1117` | ECharts option / JS 数值计算 | ECharts 不理解 CSS 变量，需要具体色值 |

```tsx
// React inline style → 用 tcss()
<div style={{ background: tcss('--rk-bg-primary'), color: tcss('--rk-text-primary') }}>

// ECharts option → 用 tc()
const option = { color: chartColors(6), textStyle: { color: tc('--rk-text-primary') } }
```

### 预设主题（6 个）

| 主题 | 文件 | 说明 |
|------|------|------|
| `default-dark` | `src/themes/default-dark.ts` | 默认暗色主题 |
| `default-light` | `src/themes/default-light.ts` | 默认亮色主题 |
| `claude-dark` | `src/themes/claude-dark.ts` | Claude 风格暗色主题（全局默认） |
| `claude-light` | `src/themes/claude-light.ts` | Claude 风格亮色主题 |
| `linear` | `src/themes/linear.ts` | Linear.app 风格主题 |
| `vercel` | `src/themes/vercel.ts` | Vercel 风格主题 |

### 关键文件

| 文件 | 职责 |
|------|------|
| `src/themes/design-md-parser.ts` | DESIGN.md 解析器，支持多种格式（有/无 ## 标题、表格、列表） |
| `src/themes/design-md-mapper.ts` | DesignTokens → --rk-* 映射，自动衍生 muted/hover 版本 |
| `src/themes/index.ts` | 主题注册表 + `loadDesignMd()` 公共 API + `toggleMode()` 暗亮切换 |
| `src/themes/default-dark.ts` | 默认暗色主题（30 个 CSS 变量） |
| `src/themes/linear.ts` | Linear.app 风格主题 |
| `src/themes/vercel.ts` | Vercel 风格主题 |
| `src/core/theme-colors.ts` | `tc()` 颜色访问器（解析值）+ `tcss()` CSS 引用 + `chartColors()` 调色板 |

### 组件集成规则

```tsx
// 每个组件必须：
import { tcss, tc } from '../../core/theme-colors'

// React inline style 用 tcss()，ECharts option 用 tc()
<div style={{
  background: tcss('--rk-bg-primary'),      // 不是 '#111'
  color: tcss('--rk-text-primary'),          // 不是 '#e5e5e5'
  border: `1px solid ${tcss('--rk-border-subtle')}`,  // 不是 '#2a2a2a'
}}>

// ECharts option
const option = {
  color: chartColors(6),
  textStyle: { color: tc('--rk-text-primary') }
}
```

### DESIGN.md 支持的语义名映射

| DESIGN.md 语义名 | 映射到 | 说明 |
|-----------------|--------|------|
| Primary, Brand, Accent | `--rk-accent` | 品牌强调色 |
| Canvas, Surface, Background | `--rk-bg-primary` | 主背景 |
| Surface Secondary, Card | `--rk-bg-secondary` | 卡片背景 |
| Text, Foreground | `--rk-text-primary` | 主文字 |
| Text Secondary, Muted | `--rk-text-secondary` | 次要文字 |
| Border, Divider | `--rk-border-subtle` | 边框 |
| Error, Danger | `--rk-error` | 错误色 |
| Success, Green | `--rk-success` | 成功色 |
| Warning, Amber | `--rk-warning` | 警告色 |

未匹配的颜色自动分配给图表调色板 `--rk-chart-1` ~ `--rk-chart-6`。

### 30 个 CSS 变量完整列表

见 [CONTRIBUTING.md](../CONTRIBUTING.md) 的「完整主题变量表」。

## PNG 导出

Vizual 提供 PNG 导出 API，支持将渲染后的组件导出为图片：

```typescript
import { exportToPNG, downloadPNG } from 'vizual'

// 导出为 Blob
const blob = await exportToPNG(elementRef.current, { scale: 2 })

// 直接触发下载
await downloadPNG(elementRef.current, { filename: 'chart-export', scale: 2 })
```

### 导出策略

- **ECharts 图表**：优先使用 ECharts 原生 `getDataURL()`，快速可靠
- **HTML 组件**：使用 html2canvas，准确还原 DOM 渲染效果
- **背景色**：从 DOM CSS 变量实时读取，与用户看到的一致

### ExportOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `scale` | number | 2 | 缩放倍率（Retina） |
| `backgroundColor` | string | 从主题读取 | 背景色 |
| `filename` | string | `'vizual-export'` | 文件名（不含扩展名） |

## 构建流程

```
esbuild
  src/index.ts
    │
    ├── --bundle (打包所有内部代码)
    ├── --external:react (不打包 React)
    ├── --external:react-dom
    ├── --external:echarts (不打包 ECharts, 由 npm dependency 安装)
    │
    ├── --format=esm → dist/index.mjs  (760KB)
    └── --format=cjs → dist/index.js   (766KB)

esbuild --standalone
  src/index.ts
    │
    ├── --bundle (打包所有代码，包括 React 和 ECharts)
    ├── --format=iife
    └── → dist/vizual.standalone.js    (~6.5MB)
         可直接通过 <script> 引入，暴露全局 Vizual 对象
```

为什么 ECharts 是 external？
- ECharts 完整包 ~3MB，打包进 bundle 太大
- 作为 regular dependency，`npm install` 时自动安装
- 运行时从 node_modules 解析，和宿主应用共享实例

为什么 mviz 不是 external？
- mviz 的 package exports 有兼容性问题
- 直接打包进 bundle 避免运行时 import 路径问题
- mviz 本身很小，不影响包体积

什么是 standalone 构建？
- 将 React、ECharts 等全部打包进一个 IIFE 文件
- 通过 `<script>` 标签直接引入，无需构建工具
- 暴露全局 `Vizual` 对象，包含 `renderSpec()`、`setGlobalTheme()` 等 API
- 适用于 LiveKit 生成的独立 HTML 页面
