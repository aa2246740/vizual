# Contributing to Vizual

感谢你对 Vizual 的贡献！本指南帮助你正确开发新组件和修改现有组件。

## 快速开始

```bash
git clone https://github.com/aa2246740/vizual.git
cd vizual
npm install
npm test
npm run build
```

构建产物在 `dist/` 目录：`index.mjs` (ESM) + `index.js` (CJS)。

## 项目结构

```
src/
├── index.ts              # 统一导出入口
├── catalog.ts            # defineCatalog — 注册所有组件的 Schema
├── registry.tsx          # defineRegistry — type → React 组件映射
│
├── mviz-bridge/          # ECharts 图表 + UI 组件（通过 mviz 桥接）
│   └── bar-chart/        # 每个组件一个目录
│       ├── schema.ts     # Zod Schema
│       ├── component.tsx # React 组件
│       └── index.ts      # 重导出
│
├── components/           # 自定义业务组件（纯 React）
│   └── timeline/         # 同上结构
│
├── inputs/               # 交互输入组件
│   └── input-text/       # 同上结构
│
├── docview/              # DocView 可批注文档组件
│
├── themes/               # 主题系统
│   ├── index.ts          # 主题注册表 + loadDesignMd() API
│   ├── design-md-parser.ts   # DESIGN.md 解析器
│   ├── design-md-mapper.ts   # token → CSS 变量映射
│   ├── default-dark.ts   # 默认暗色主题
│   ├── linear.ts         # Linear 风格主题
│   └── vercel.ts         # Vercel 风格主题
│
└── core/                 # 共享工具
    ├── theme-colors.ts   # tc() 颜色访问器（核心！）
    ├── echarts-wrapper.tsx
    └── echarts-bridge-factory.tsx
```

## 新增组件步骤

### 1. 创建组件目录

```
src/components/my-widget/
├── schema.ts          # Zod Schema + 类型
├── component.tsx      # React 组件
└── index.ts           # 重导出
```

### 2. 编写 Schema (`schema.ts`)

```ts
import { z } from 'zod'

export const MyWidgetSchema = z.object({
  type: z.literal('my_widget'),
  title: z.string().optional(),
  data: z.array(z.object({
    label: z.string(),
    value: z.number(),
  })),
})

export type MyWidgetProps = z.infer<typeof MyWidgetSchema>
```

### 3. 编写组件 (`component.tsx`)

```tsx
import { tc } from '../../core/theme-colors'   // 必须！
import type { MyWidgetProps } from './schema'

export function MyWidget({ props }: { props: MyWidgetProps }) {
  return (
    <div style={{
      background: tc('--rk-bg-secondary'),      // 从主题取色
      color: tc('--rk-text-primary'),
      border: `1px solid ${tc('--rk-border-subtle')}`,
      borderRadius: tc('--rk-radius-md'),
      padding: 16,
    }}>
      {props.title && <h3 style={{ color: tc('--rk-text-primary') }}>{props.title}</h3>}
      {/* ... */}
    </div>
  )
}
```

### 4. 导出 (`index.ts`)

```ts
export { MyWidget } from './component'
export { MyWidgetSchema } from './schema'
export type { MyWidgetProps } from './schema'
```

### 5. 注册到 Catalog (`catalog.ts`)

在 import 区域添加 Schema 导入，在 `defineCatalog()` 调用中添加条目。

### 6. 注册到 Registry (`registry.tsx`)

添加组件导入和 type → 组件映射。

### 7. 公共导出 (`index.ts`)

```ts
export { MyWidget, MyWidgetSchema } from './components/my-widget'
export type { MyWidgetProps } from './components/my-widget'
```

## 颜色规则（最重要）

### 必须遵守

**所有组件颜色必须通过 `tc()` 从主题系统获取。禁止硬编码 hex/rgb 值。**

```tsx
// ❌ 错误
<div style={{ background: '#111', color: '#e5e5e5', border: '1px solid #2a2a2a' }}>

// ✅ 正确
import { tc } from '../../core/theme-colors'
<div style={{
  background: tc('--rk-bg-primary'),
  color: tc('--rk-text-primary'),
  border: `1px solid ${tc('--rk-border-subtle')}`,
}}>
```

### 为什么

Vizual 支持 DESIGN.md 主题系统。用户提供一份 DESIGN.md，`loadDesignMd()` 解析后注入 CSS 变量，所有组件通过 `tc()` 自动换肤。硬编码颜色会导致主题切换失效。

### tc() 导入路径

| 组件位置 | 导入路径 |
|----------|----------|
| `src/components/xxx/` | `import { tc } from '../../core/theme-colors'` |
| `src/mviz-bridge/xxx/` | `import { tc } from '../../core/theme-colors'` |
| `src/inputs/xxx/` | `import { tc } from '../../core/theme-colors'` |
| `src/docview/` | `import { tc } from '../core/theme-colors'` |

### 完整主题变量表

| 变量 | 语义 | 默认值 |
|------|------|--------|
| `--rk-bg-primary` | 主背景 | `#0f1117` |
| `--rk-bg-secondary` | 卡片/面板背景 | `#1e293b` |
| `--rk-bg-tertiary` | 输入框/悬停背景 | `#252836` |
| `--rk-text-primary` | 主文字 | `#e2e8f0` |
| `--rk-text-secondary` | 次要文字 | `#94a3b8` |
| `--rk-text-tertiary` | 提示/禁用文字 | `#64748b` |
| `--rk-border` | 边框 | `#1e293b` |
| `--rk-border-subtle` | 微弱边框 | `#2d3148` |
| `--rk-accent` | 强调色/品牌色 | `#667eea` |
| `--rk-accent-hover` | 强调色悬停 | `#7c8ff5` |
| `--rk-accent-muted` | 强调色背景 | `rgba(102,126,234,0.15)` |
| `--rk-success` | 成功/正向 | `#10b981` |
| `--rk-success-muted` | 成功背景 | `rgba(16,185,129,0.15)` |
| `--rk-warning` | 警告 | `#f59e0b` |
| `--rk-warning-muted` | 警告背景 | `rgba(245,158,11,0.15)` |
| `--rk-error` | 错误/危险 | `#ef4444` |
| `--rk-error-muted` | 错误背景 | `rgba(239,68,68,0.15)` |
| `--rk-font-sans` | 正文字体 | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| `--rk-font-mono` | 等宽字体 | `"SF Mono", "Fira Code", Consolas, monospace` |
| `--rk-radius-sm` | 小圆角 | `4px` |
| `--rk-radius-md` | 中圆角 | `8px` |
| `--rk-radius-lg` | 大圆角 | `10px` |
| `--rk-shadow` | 阴影 | `0 4px 12px rgba(0,0,0,0.3)` |
| `--rk-chart-1` ~ `--rk-chart-6` | 图表调色板 | 6 色系列 |

### 可以不用 tc() 的情况

- **数据驱动颜色**：图表 series 颜色（由 ECharts option 控制）、按数据值变化的颜色
- **用户可选择颜色**：批注高亮色、颜色选择器默认值
- **内容颜色**：用户通过 props 传入的自定义颜色

## 组件三种类型

### 类型一：ECharts Bridge（图表组件）

通过 `createEChartsBridge()` 工厂函数创建，复用 mviz 的 option builder：

```tsx
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

const MyChart = createEChartsBridge('my_chart', (props) => ({
  xAxis: { type: 'category', data: props.data.map(d => d[props.x]) },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: props.data.map(d => d[props.y]) }],
}))
```

### 类型二：React 组件（UI / 业务组件）

纯 React + inline styles，不依赖 mviz：

```tsx
export function MyWidget({ props }: { props: MyWidgetProps }) {
  return <div style={{ background: tc('--rk-bg-secondary') }}>...</div>
}
```

### 类型三：交互输入组件

需要支持 `useBoundProp` 双向绑定 + 本地 state fallback：

```tsx
import { useBoundProp } from '@json-render/react'
import { tc } from '../../core/theme-colors'

export function MyInput({ props, bindings }) {
  const bound = useBoundProp(props.value, bindings?.value)
  const [localValue, setLocalValue] = useState(props.value ?? '')
  const hasBinding = !!bindings?.value
  const value = hasBinding ? (bound[0] ?? '') : localValue
  const setValue = (v) => { bound[1](v); setLocalValue(v) }
  // ...
}
```

## 测试

```bash
# 运行单元测试
npm test

# 浏览器集成测试 — 打开 validation/ 页面
python3 -m http.server 8790
# 访问 http://localhost:8790/validation/test-all-42.html
```

新增组件时，请在 `validation/test-all-42.html` 中添加对应的测试 case。

## 提交 PR

1. Fork → Branch → 开发 → 测试通过
2. 确保所有颜色使用 `tc()`（`grep -r '#[0-9a-fA-F]\{3,8\}' src/` 应该只在数据颜色处有结果）
3. 确保构建通过（`npm run build`）
4. 确保测试通过（`npm test`）
5. 提交 PR，描述改动内容

## DESIGN.md 主题系统

用户通过 `loadDesignMd()` 加载主题，所有用 `tc()` 的组件自动换肤：

```ts
import { loadDesignMd, setGlobalTheme } from 'vizual'

// 方式一：从 DESIGN.md 加载
const theme = loadDesignMd(markdown, { apply: true })

// 方式二：使用预设主题
setGlobalTheme('linear')  // 'default-dark' | 'linear' | 'vercel'
```

### DESIGN.md 格式

支持多种格式，启发式解析：

```markdown
## Colors
Primary: #0052ef
Canvas: #0b0b0b
Text: #e8e8e8
Border: #2a2a2a

## Typography
Font Family: Inter, sans-serif

## Border Radius
sm: 4px
md: 8px
```

语义名自动映射到 `--rk-*` 变量（Primary → accent, Canvas → bg-primary, 等）。缺失的 token 自动回退到 default-dark 主题。

### 新增主题预设

如需新增预设主题，在 `src/themes/` 下创建文件：

```ts
// src/themes/my-theme.ts
export const myTheme = {
  name: 'my-theme' as const,
  displayName: 'My Theme',
  cssVariables: {
    '--rk-bg-primary': '#ffffff',
    '--rk-text-primary': '#1a1a1a',
    // ... 完整变量表见 default-dark.ts
  }
}
```

然后在 `src/themes/index.ts` 底部添加 `registerTheme('my-theme', myTheme)`。

## 代码风格

- TypeScript strict mode
- 组件用 function declaration（不用 arrow function）
- inline styles（不用 CSS 文件）
- 中文注释说明复杂逻辑
- 每个 schema.ts 导出 Zod Schema + TypeScript type
