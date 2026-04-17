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
│   │  catalog.ts  ── defineCatalog(schema, 42组件)       │     │
│   │  registry.tsx ── defineRegistry(catalog, 组件)       │     │
│   │  index.ts    ── 统一导出                         │     │
│   │                                                 │     │
│   │  ┌── mviz-bridge/ (27 组件) ──────────────┐     │     │
│   │  │  Charts (19):  BarChart ~ RadarChart    │     │     │
│   │  │  UI (8):       BigValue ~ EmptySpace    │     │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── components/ (11 组件) ───────────────┐      │     │
│   │  │  Timeline, Kanban, GanttChart, ...     │      │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── inputs/ (4 组件) ────────────────────┐      │     │
│   │  │  InputText, InputSelect,               │      │     │
│   │  │  InputFile, FormBuilder                │      │     │
│   │  └─────────────────────────────────────────┘     │     │
│   │                                                 │     │
│   │  ┌── core/ ──────────────────────────────┐       │     │
│   │  │  echarts-wrapper.tsx  共享 ECharts 容器│       │     │
│   │  │  echarts-bridge-factory.tsx  通用工厂  │       │     │
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
├── catalog.ts            # defineCatalog — 注册 42 个组件的 Schema
├── registry.tsx          # defineRegistry — Schema → React 组件映射
│
├── mviz-bridge/          # 27 个 mviz 桥接组件
│   ├── bar-chart/        # 唯一手写的 bridge（参考实现）
│   │   ├── schema.ts     # Zod Schema + 类型导出
│   │   ├── component.tsx # React 组件（ECharts + mviz fallback）
│   │   ├── index.ts      # 重导出
│   │   └── component.test.tsx
│   │
│   ├── area/             # 生成 bridge
│   ├── line/             # 生成 bridge
│   ├── pie/              # ... 共 19 个图表 bridge
│   └── ...
│
│   ├── big-value/        # UI 组件 bridge (React 重实现)
│   ├── delta/
│   ├── alert/
│   ├── note/
│   ├── text/
│   ├── textarea/
│   ├── table/
│   └── empty-space/
│
│   └── mermaid/          # Mermaid 流程图（动态 import mermaid.js）
│
├── components/           # 11 个自定义业务组件
│   ├── timeline/
│   │   ├── schema.ts     # Zod Schema
│   │   ├── component.tsx # 纯 React + inline styles
│   │   └── index.ts
│   ├── kanban/
│   ├── gantt/
│   ├── org-chart/
│   ├── kpi-dashboard/
│   ├── budget-report/
│   ├── feature-table/
│   ├── audit-log/
│   ├── json-viewer/
│   ├── code-block/
│   └── form-view/
│
├── inputs/               # 交互输入组件 (4)
│   ├── input-text/       # InputText — 文本输入框
│   ├── input-select/     # InputSelect — 下拉选择框
│   ├── input-file/       # InputFile — 文件上传
│   └── form-builder/     # FormBuilder — 动态表单构建器
│
└── core/                 # 共享工具
    ├── echarts-wrapper.tsx        # ECharts React 容器
    ├── echarts-bridge-factory.tsx # 通用 ECharts bridge 工厂函数
    ├── types.ts
    └── ...
```

## 组件三种实现模式

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

### 模式二：React 重实现（8 个 UI 组件）

```tsx
// mviz 原本输出 HTML 字符串，我们用 React 重写
export function BigValue(props: BigValueProps) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ fontSize: 32, fontWeight: 700 }}>{props.value}</div>
      {props.trend && <span>↑ {props.trendValue}</span>}
    </div>
  )
}
```

### 模式三：自定义业务组件（11 个）

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
    │  0.16.0    │  │ Apache-2  │  │   MIT     │
    │ Apache-2   │  └─────┬─────┘  └─────┬─────┘
    └─────┬─────┘        │               │
          │               │         buildXxxOptions()
          │         init + setOption    │
          │               │               │
    defineCatalog    ┌─────┴───────────────┘
    defineRegistry   │
    Renderer         │  Charts (19): mviz → ECharts option → 渲染
                     │  UI (8): React inline styles
                     │  Business (11): React inline styles
                     │  Inputs (4): React inline styles
                     │
    ┌────────────────┴────────────────┐
    │            zod ^3.25 (MIT)       │
    │      Schema 定义 + 校验          │
    └─────────────────────────────────┘

    [peer] react >=18  ── 宿主应用提供
    [peer] react-dom >=18
```

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
```

为什么 ECharts 是 external？
- ECharts 完整包 ~3MB，打包进 bundle 太大
- 作为 regular dependency，`npm install` 时自动安装
- 运行时从 node_modules 解析，和宿主应用共享实例

为什么 mviz 不是 external？
- mviz 的 package exports 有兼容性问题
- 直接打包进 bundle 避免运行时 import 路径问题
- mviz 本身很小，不影响包体积
