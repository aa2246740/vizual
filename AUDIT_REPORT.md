# Vizual 代码审计报告

**审计对象**: github.com/aa2246740/vizual v1.0.0  
**审计日期**: 2026-04-16  
**审计人**: Claude (辅助工具审查)  
**修复分支**: `fix/render-spec-3bugs` → PR #2  
**修复文件数**: 34 个  
**发现 Bug 数**: 32 个 (CRITICAL ×4, MEDIUM ×19, LOW ×9)

---

## 一、审计方法

### 1.1 审计策略

我采用**自底向上 + 分层扫描**的方式审查整个代码库。具体分三步：

**第一步：架构理解**  
先读核心文件理解项目架构：
- `package.json` — 了解依赖关系、构建配置
- `src/index.ts` — 了解导出结构
- `src/core/echarts-bridge-factory.tsx` — 理解 16 个图表组件的工厂模式
- `src/catalog.ts` — 理解组件注册机制

**第二步：批量模式匹配**  
发现所有 14 个图表 fallback builder 使用了**完全相同的模板代码**（复制粘贴），只是 `type` 字段不同：

```typescript
// 每个 fallback builder 都是同一个模板：
function buildXxxFallback(props: XxxChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const y = props.y ?? (Array.isArray(props.y) ? props.y[0] : 'value')
  const yFields = Array.isArray(y) ? y : [y]
  return {
    xAxis: { type: 'category', ... },
    yAxis: { type: 'value' },
    series: yFields.map(f => ({
      type: 'xxx',  // <-- 只有这里不同
      name: f, data: props.data.map(d => Number(d[f]) || 0),
    })),
  }
}
```

这个模板本质上是**柱状图**的配置。但 scatter 需要 `[x,y]` 元组，pie 不能有 xAxis/yAxis，sankey 需要 `nodes/links`，heatmap 需要 `[xIndex, yIndex, value]` — 全都不对。

**第三步：逐文件审查**  
对每个组件文件检查：
- 函数签名是否与 `defineRegistry` 的 props 包装一致
- Schema 定义的 prop 是否在组件中被使用
- 边界条件处理（空数组、NaN、undefined）
- ECharts option 结构是否符合该图表类型的规范

### 1.2 关键发现路径

#### 发现「组件签名 Bug」的过程

这个 bug 是最难定位的。现象是：所有组件渲染后都是空白。

**排查过程：**

1. 先检查 HTML → 发现 `#app` 容器是空的
2. 在浏览器控制台手动调用 `Vizual.renderSpec()` → 报错
3. 追踪 `@json-render/react` 的源码（`dist/index.mjs` 第 920-968 行）
4. 发现 `defineRegistry()` 包装组件时传入的是：
   ```typescript
   componentFn({ props: element.props, children, emit, on, bindings, loading })
   ```
5. 但 vizual 的组件签名是 `function BarChart(props: BarChartProps)`
6. 这意味着组件收到的是 `{ props: {x, y, data} }` 而不是 `{ x, y, data }`
7. 所以 `props.x` 是 `undefined`，图表自然无法渲染

**修复：** 所有 37 个组件的签名改为 `function BarChart({ props }: { props: BarChartProps })`

#### 发现「Fallback Builder 模板错误」的过程

heatmap 先暴露了问题。用户反馈 "heatmap 展示不出来热力图"。

**排查过程：**

1. 在浏览器获取 ECharts 实例的 option → 发现 xAxis 是 category，yAxis 是 value
2. 但 ECharts heatmap 需要**双 category 轴** + `[xIndex, yIndex, value]` 元组格式
3. 查看 `heatmap/component.tsx` 的 fallback builder → 发现它和 bar chart 用了同样的模板
4. 扩大检查范围 → 发现**所有 14 个非 bar 图表**都是同一个错误模板
5. 只有 bar chart 的模板凑巧是正确的

#### 发现「主题系统完全不可用」的过程

1. 读 `src/themes/` 目录 → 发现有 3 个预定义主题文件
2. 读 `src/themes/index.ts` → 有 `registerTheme()` 函数，有 `getTheme()`、`applyTheme()`
3. 但搜索整个代码库 → **没有任何地方调用 `registerTheme()` 注册这 3 个主题**
4. 所以 `getThemeNames()` 永远返回 `[]`，`applyTheme('default-dark')` 永远返回 false

---

## 二、Bug 清单与修复详情

### CRITICAL (4个)

#### Bug #1: Kanban 缺少类型导入 — 编译失败

| 项目 | 详情 |
|------|------|
| **文件** | `src/components/kanban/component.tsx` |
| **问题** | 使用了 `KanbanProps` 类型但没有 `import type { KanbanProps } from './schema'` |
| **影响** | TypeScript 编译失败 |
| **发现方式** | 逐文件对比其他组件（如 Timeline、AuditLog 都有 import） |
| **修复** | 添加 `import type { KanbanProps } from './schema'` |

```diff
+ import type { KanbanProps } from './schema'
+
  export function Kanban({ props }: { props: KanbanProps }) {
```

#### Bug #2: EChartsWrapper 每次渲染都销毁重建图表

| 项目 | 详情 |
|------|------|
| **文件** | `src/core/echarts-wrapper.tsx` |
| **问题** | `useEffect` 依赖 `[option, theme]`，option 每次都是新对象引用，导致 effect 每次渲染都执行 → `echarts.init()` + `dispose()` 反复执行 |
| **影响** | 图表闪烁、内存抖动 |
| **发现方式** | React useEffect 最佳实践审查 — init/dispose 应该和 setOption 分离 |
| **修复** | 拆成两个 effect：一个管生命周期（空依赖），一个管 option 更新 |

```diff
- useEffect(() => {
-   // init + setOption + observer 全混在一起
-   return () => { observer.disconnect(); chart.dispose(); }
- }, [option, theme])  // option 每次都是新引用！

+ useEffect(() => {
+   // 只管 init/dispose — 空依赖，只执行一次
+   const chart = echarts.init(containerRef.current, theme)
+   const observer = new ResizeObserver(() => chart.resize())
+   return () => { observer.disconnect(); chart.dispose() }
+ }, [theme])

+ useEffect(() => {
+   // 只管更新 option — 不重建图表
+   if (chartRef.current && option) chartRef.current.setOption(option, true)
+ }, [option])
```

#### Bug #3: BudgetReport 空数组导致 NaN

| 项目 | 详情 |
|------|------|
| **文件** | `src/components/budget-report/component.tsx` |
| **问题** | `Math.max(...[])` 返回 `-Infinity`，除以后产生 `NaN%` 宽度 |
| **影响** | 整个组件渲染出 NaN 宽度的进度条 |
| **发现方式** | 边界条件审查 — `props.categories` 可能为空数组 |
| **修复** | 添加空数组检查 + fallback 到 1 |

```diff
+ if (!props.categories || props.categories.length === 0) {
+   return <div>No budget data</div>
+ }
- const maxVal = Math.max(...props.categories.map(c => Math.max(c.budget, c.actual)))
+ const maxVal = Math.max(...props.categories.map(c => Math.max(c.budget, c.actual))) || 1
```

#### Bug #4: GanttChart 无效日期静默失败

| 项目 | 详情 |
|------|------|
| **文件** | `src/components/gantt/component.tsx` |
| **问题** | `new Date(undefined).getTime()` 返回 `NaN`，`Math.min(...[NaN])` = `NaN`，所有条形宽度变成 NaN |
| **影响** | 整个甘特图消失 |
| **发现方式** | 边界条件审查 — 日期字符串可能格式错误 |
| **修复** | 过滤无效日期的任务 + 空结果提示 |

```typescript
const validTasks = props.tasks.filter(t => {
  const start = new Date(t.start)
  const end = new Date(t.end)
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start
})
if (validTasks.length === 0) return <div>No valid tasks (check date format)</div>
```

---

### MEDIUM — 14 个图表 Fallback Builder

这些全部是同一个根本原因：**复制粘贴了柱状图模板给所有图表类型**。

#### 发现方法

读 `scatter/component.tsx` → 发现 `xAxis: { type: 'category' }`，但散点图两个轴都应该是 `type: 'value'`。然后批量检查所有 14 个文件 → 全部一样。

#### 修复策略

每个图表类型根据 ECharts 官方文档写正确的 option 结构：

| 图表类型 | 关键修改 |
|---------|---------|
| **PieChart** | 去掉 xAxis/yAxis，数据格式改为 `{name, value}[]`，tooltip 改为 `trigger: 'item'` |
| **ScatterChart** | 双 value 轴，数据改为 `[x, y][]` 元组 |
| **BubbleChart** | 双 value 轴，数据改为 `[x, y, size][]`，添加 `symbolSize` 函数 |
| **SankeyChart** | 去掉 xAxis/yAxis，使用 `nodes` + `links` 数据结构 |
| **FunnelChart** | 去掉 xAxis/yAxis，数据格式改为 `{name, value}[]` |
| **CalendarChart** | 使用 `calendar` 坐标系 + `type: 'heatmap'`，添加 `visualMap` |
| **ComboChart** | 使用 `props.series` 创建混合类型（bar + line） |
| **DumbbellChart** | scatter + bar 组合展示范围对比 |
| **XmrChart** | 折线图 + `markLine` 显示 CL/UCL/LCL 控制线，自动计算均值和标准差 |
| **BoxplotChart** | 按 group 分组计算 `[min, Q1, median, Q3, max]`，添加 outlier 散点 |
| **HistogramChart** | 自动计算 bins，数据转换为频率分布柱状图 |
| **WaterfallChart** | 透明底柱 + 正负增量柱的堆叠组合 |
| **SparklineChart** | 隐藏所有轴和 tooltip 的极简图表 |
| **Line/AreaChart** | 修复尾逗号，添加 `smooth`/`stacked` 支持 |

**示例 — PieChart 修复前后对比：**

```typescript
// 修复前（错误 — pie 不需要坐标轴）
return {
  xAxis: { type: 'category', data: props.data.map(d => String(d[x])) },
  yAxis: { type: 'value' },
  series: [{ type: 'pie', data: props.data.map(d => Number(d[f])) }],
}

// 修复后（正确 — pie 只需 series + legend）
return {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    type: 'pie',
    radius: props.donut ? ['40%', '70%'] : '70%',
    data: props.data.map(d => ({ name: String(d[labelField]), value: Number(d[valueField]) })),
  }],
}
```

**示例 — BoxplotChart（最复杂的修复）：**

```typescript
// 修复前（完全错误 — boxplot 不接受单个数值）
series: [{ type: 'boxplot', data: props.data.map(d => Number(d[f])) }]

// 修复后（正确 — 需要按组计算五数概括）
const groups = new Map<string, number[]>()
props.data.forEach(d => {
  const g = String(d[groupField])
  groups.set(g, [...(groups.get(g) || []), Number(d[valueField])])
})
const boxplotData = [...groups.keys()].map(g => {
  const vals = groups.get(g).sort((a, b) => a - b)
  return [vals[0], vals[Math.floor(n*0.25)], vals[Math.floor(n*0.5)],
          vals[Math.floor(n*0.75)], vals[n-1]]  // [min, Q1, median, Q3, max]
})
```

---

### MEDIUM — 其他修复

#### Bug: 主题系统完全不可用

**发现过程：**
1. 读 `src/themes/` → 有 3 个主题文件（default-dark, linear, vercel）
2. 读 `src/themes/index.ts` → 有完整的 register/get/apply API
3. 搜索 `registerTheme` 的调用 → **零结果**
4. 结论：主题代码写好了但从来没注册过，`getThemeNames()` 永远返回 `[]`

**修复：** 在 `themes/index.ts` 底部自动注册 3 个内置主题：

```typescript
import { defaultDarkTheme } from './default-dark'
import { linearTheme } from './linear'
import { vercelTheme } from './vercel'

registerTheme(defaultDarkTheme.name, defaultDarkTheme)
registerTheme(linearTheme.name, linearTheme)
registerTheme(vercelTheme.name, vercelTheme)
```

#### Bug: CSS `*` 选择器性能问题

`applyTheme()` 生成的 CSS 同时作用于 `.rk-theme-x` 和 `.rk-theme-x *`。`*` 选择器匹配所有后代元素，在复杂页面上有显著性能开销。但 CSS 自定义属性本身会继承，不需要 `*` 选择器。

```diff
  .rk-theme-${theme.name} {
  ${cssRules}
  }
- .rk-theme-${theme.name} * {
- ${cssRules}
- }
```

#### Bug: echarts-bridge-factory capitalize 对连字符无效

`capitalize('bar-chart')` 返回 `'Bar-chart'`，但 mviz 导出的函数名是 `buildBarChartOptions`。

```diff
- function capitalize(s: string): string {
-   return s.charAt(0).toUpperCase() + s.slice(1)
- }
+ function capitalize(s: string): string {
+   return s.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
+ }
```

#### Bug: BarChart 没用工厂模式

BarChart 手动实现了完整的 echarts init/setOption/resize/dispose 逻辑（~90行），而其他 15 个图表都用 `createEChartsBridge()` 工厂（~5行）。这意味着工厂的 bug fix 不会应用到 BarChart。

**修复：** 重写为使用工厂，同时保留 `buildBarFallback` 函数：

```typescript
function buildBarFallback(props: BarChartProps): Record<string, unknown> {
  // ... 原有的 fallback 逻辑
}
export const BarChart = createEChartsBridge('bar', buildBarFallback)
```

#### Bug: MermaidChart fallback 有 XSS 风险

fallback 路径直接把 `props.code` 拼进 HTML：

```typescript
setHtml(`<pre>${props.code}</pre>`)  // 如果 code 包含 <script>...
```

**修复：** HTML 实体转义：

```typescript
const escaped = props.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
setHtml(`<pre>${escaped}</pre>`)
```

#### Bug: FeatureTable values 长度不匹配

如果 `feature.values` 比 `products` 短，后面的列会缺失；如果更长，会出现没有表头的多余列。

**修复：** 使用 `Array.from({ length: products.length })` 确保总是生成正确数量的单元格，缺失的显示 `—`。

#### Bug: JsonViewer 忽略 expanded/maxDepth

Schema 定义了 `expanded` 和 `maxDepth` prop 但组件完全没用。

**修复：** `expanded: false` 时单行显示，`maxDepth` 时按缩进层级截断深层嵌套。

#### Bug: 测试传参方式错误

测试直接传 props 到组件：`<BarChart type="bar" x="name" ... />`  
但组件签名是 `{ props }` 解构，所以应该：`<BarChart props={{ type: 'bar', x: 'name', ... }} />`

测试虽然通过了（因为只检查 div 宽度），但实际没有测试到图表数据渲染。

---

### LOW (9个)

简要列出：

| Bug | 文件 | 修复 |
|-----|------|------|
| catalog 注释说 26 实际 37 | `catalog.ts` | 改为 37 |
| StateProvider 未使用 | `cdn-entry.ts` | 删除 import |
| OrgChart renderNode 用 any 类型 | `org-chart/component.tsx` | 改用具体类型 |
| pan-zoom 释放 pointerId=-1 | `pan-zoom.ts` | 删除无效调用 |
| echarts 放在 dependencies 但构建时 external | `package.json` | 移到 peerDependencies |
| deps 和 devDeps 重复 | `package.json` | 去重 |
| core/index.ts 重复调用 applyTheme | `core/index.ts` | 删除重复调用 |
| BarChart schema 缺 height | `bar-chart/schema.ts` | 添加 `height: z.number().optional()` |
| echarts-bridge-factory ResizeObserver 竞态 | `echarts-bridge-factory.tsx` | observer 只创建一次，在 unmount 时统一清理 |

---

## 三、验证结果

- **构建**: `node build.js` 成功，输出 457.4KB CDN bundle
- **浏览器测试**: Dashboard 零控制台错误
- **已验证组件**: BarChart, PieChart, HeatmapChart, DataTable, BigValue（Dashboard 中使用的 5 个）
- **未逐一验证**: 其余 32 个组件（需单独测试页面）

## 四、给维护者的建议

1. **不要复制粘贴 fallback builder** — 考虑为不同图表类型创建一个 registry，每个类型注册自己的 option builder
2. **添加组件测试** — 当前测试只检查 div 尺寸，没有验证 ECharts option 是否正确
3. **echarts 应该放 peerDependencies** — 因为 CDN 构建是 external 的
4. **考虑用 `React.memo` + deep compare** 代替 `JSON.stringify(props)` 作为 useEffect 依赖
