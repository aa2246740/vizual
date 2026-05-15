# Vizual × A2UI × AG-UI 完整交接文档

> **交接日期**: 2026-05-15
> **Codex 接手任务**: Review + Computer Use 真实浏览器测试 + Bug 修复
> **项目根目录**: `/Users/wu/Documents/vizual-research/vizual-compare`
> **分支**: `feature/a2ui-protocol`
> **稳定 checkpoint**: `094a932` — `git checkout 094a932` 可随时回滚
> **文档 checkpoint**: `d63308e` — 含本交接文档的最新 commit

---

## 一、产品愿景与背景

### 1.1 终极目标

**AI Agent 能输出无限的 UI 和交互式内容。**

用户对 Agent 说"帮我做一个 kanban"、"我要一个每日个人主页 dashboard"、"给我看这季度的销售报告"——Agent 应该能渲染出**设计感合格、交互可用、安全可靠**的 UI，而不是只能回复纯文本 Markdown。

用户明确说过：

> "我的要求就一个，用户无论要什么 widget, kanban，都能渲染出没问题的结果。"
> "Agent 要能输出无限的 UI 和交互式内容。只要用户需要，他都做得到。"
> "不能因为我们的组件导致 AI 没法自主设计，导致整个页面很死、很僵硬、很丑。"
> "我不需要保代码，整个 vizual 推倒重来我都愿意。"

### 1.2 技术路线：三合一融合

为了达成"无限 UI"的目标，我们整合了三个协议/系统：

```
┌─────────────────────────────────────────────────────┐
│                    Agent (LLM)                       │
│    输出 A2UI 消息 / FreeformHtml / Vizual spec       │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   传输层: AG-UI          │
          │   SSE 流式传输            │
          │   生命周期管理            │
          │   工具调用路由            │
          │   状态同步               │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  内容协议层: A2UI (Google) │
          │  createSurface           │
          │  updateComponents        │
          │  updateDataModel         │
          │  action 回传             │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  渲染引擎层: Vizual       │
          │  50 个组件               │
          │  FreeformHtml 逃生舱      │
          │  Artifact 持久化          │
          │  DocView 批注审阅         │
          │  主题系统 + 导出          │
          └─────────────────────────┘
```

**为什么要融合而不是自建？**

- A2UI 只有 18 个基础 UI 组件（Text/Button/Image/Row/Column...），没有图表、没有业务组件、没有 artifact 管理
- Vizual 有 50 个专业组件 + 完整 runtime，但 spec 格式是自有的，没有跨框架/跨设备能力
- AG-UI 已经被 15+ 主流 Agent 框架支持（LangGraph, CrewAI, Claude Agent SDK, Google ADK...）
- **融合方向：AG-UI 做传输 + A2UI 做协议 + Vizual 做 catalog 扩展和 runtime**

### 1.3 关键设计决策：不限制设计自由度

这是最核心的产品原则。为了不被有限组件限死：

1. **FreeformHtml 逃生舱**：Agent 可以直接输出任意 HTML/CSS，DOMPurify 做安全清理。Agent 甚至可以做个人主页 widget。
2. **50 个标准化组件**：覆盖常见场景（图表、表单、列表、卡片、媒体...），保证开箱即用。
3. **A2UI 标准原语**：Row、Column、Card、Text 等基础组件让 Agent 像搭积木一样组合复杂 UI。
4. **三层自由度**：简单需求用标准组件 → 复杂需求用组件组合 → 超出组件能力用 FreeformHtml。

---

## 二、三个参考仓库的详细调研结论

### 2.1 A2UI（Google 出品，v0.10 draft）

**仓库位置**: `/Users/wu/Documents/vizual-research/a2ui/`

A2UI 是一个声明式 JSON 协议，让 AI Agent 通过标准格式创建和管理 UI surface。

#### 核心概念

| 概念 | 说明 |
|------|------|
| Surface | 一个 UI 渲染区域，有唯一 `surfaceId` |
| Catalog | 组件目录，定义了可用的组件类型。官方 `basic_catalog` 有 18 个基础组件 |
| Component | Surface 中的 UI 组件，用 `id` + `component` 类型 + `props` 定义 |
| DataModel | Surface 级别的数据存储，组件通过 `{ path: "..." }` 引用 |
| Action | 用户交互事件（Button click、Form submit），从客户端回传给 Agent |

#### A2UI 消息类型（v0.10）

```typescript
// 1. 创建 Surface
{ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual', theme?: {...}, sendDataModel?: boolean } }

// 2. 更新组件（增量合并）
{ version: 'v0.10', updateComponents: { surfaceId: 's1', components: A2UIComponentDef[] } }

// 3. 更新数据模型
{ version: 'v0.10', updateDataModel: { surfaceId: 's1', path: '/chartData', value: [...] } }

// 4. 删除 Surface
{ version: 'v0.10', deleteSurface: { surfaceId: 's1' } }

// 5. 更新主题
{ version: 'v0.10', updateTheme: { surfaceId: 's1', theme: { primaryColor: '#6366f1' } } }

// 6. 错误恢复
{ version: 'v0.10', errorRecovery: { surfaceId: 's1', action: 'retry' | 'fallback' | 'reset', payload?: ... } }
```

#### 组件模型：扁平数组 + ID 引用

A2UI 使用**扁平数组**表示组件树，而非嵌套：

```json
{
  "components": [
    { "id": "root", "component": "Column", "gap": 16, "children": ["title", "chart"] },
    { "id": "title", "component": "Text", "content": "Sales Report" },
    { "id": "chart", "component": "BarChart", "x": "month", "y": "revenue", "data": { "path": "/chartData" } }
  ]
}
```

`children` 是字符串 ID 数组，不是嵌套对象。Agent 可以增量更新：新 ID 添加组件，已有 ID 更新组件。

#### A2UI 关键源码文件

| 绝对路径 | 内容 |
|----------|------|
| `/Users/wu/Documents/vizual-research/a2ui/specification/v0_10/json/server_to_client.json` | 服务端→客户端消息 JSON Schema |
| `/Users/wu/Documents/vizual-research/a2ui/specification/v0_10/json/basic_catalog.json` | 18 个基础组件定义 |
| `/Users/wu/Documents/vizual-research/a2ui/specification/v0_10/json/common_types.json` | DynamicString/ChildList/ComponentId 核心类型 |
| `/Users/wu/Documents/vizual-research/a2ui/specification/v0_10/json/client_to_server.json` | 客户端→服务端 action 事件 |
| `/Users/wu/Documents/vizual-research/a2ui/specification/v0_10/docs/a2ui_protocol.md` | 协议完整文档 |
| `/Users/wu/Documents/vizual-research/a2ui/specification/v0_10/docs/a2ui_extension_specification.md` | Catalog 扩展机制 + A2A 集成 |
| `/Users/wu/Documents/vizual-research/a2ui/renderers/react/src/` | 官方 React renderer 源码 |
| `/Users/wu/Documents/vizual-research/a2ui/renderers/web_core/src/` | 框架无关核心库 |
| `/Users/wu/Documents/vizual-research/a2ui/docs/` | 完整文档树（concepts/guides/reference/specification） |

#### 调研结论

- A2UI 的 **catalog 可扩展机制**天然支持自定义组件——我们在 `createSurface` 时指定 `catalogId: 'vizual'`
- A2UI 的 `updateComponents` 是**增量合并**（不是全量替换），适合持续对话场景
- A2UI 的 `DynamicString { path: "..." }` 数据绑定和 Vizual 的 `$bindState` 概念一致
- A2UI 的 18 个基础组件（Text, Button, Image, Row, Column...）我们已经全部在 Vizual 中实现

---

### 2.2 AG-UI（CopilotKit 出品）

**仓库位置**: `/Users/wu/Documents/vizual-research/ag-ui/`

AG-UI 是一个事件驱动的 Agent↔前端通信协议，解决"消息怎么从 Agent 送到前端"。

#### 核心机制

| 事件类型 | 用途 | 对 Vizual 的价值 |
|----------|------|-----------------|
| `RUN_STARTED` / `RUN_FINISHED` | Run 生命周期 | 对应 Vizual 的 artifact 创建/完成 |
| `TEXT_MESSAGE_START/CONTENT/END` | 流式文本 | Agent 文本回复 |
| `TOOL_CALL_START/ARGS/END` | 流式工具调用 | Agent 调用渲染工具时使用 |
| `STATE_SNAPSHOT` / `STATE_DELTA` | JSON Patch 增量状态同步 | Vizual 的 artifact patch 系统可参考 |
| `ACTIVITY_SNAPSHOT` / `ACTIVITY_DELTA` | Generative UI 载体 | A2UI JSON 通过这个通道传递 |
| `STEP_STARTED` / `STEP_FINISHED` | Agent 步骤 | |

#### AG-UI 的 A2UI Middleware

**关键文件**: `/Users/wu/Documents/vizual-research/ag-ui/middlewares/a2ui-middleware/src/index.ts`

AG-UI 已经内置了 A2UI middleware，把 A2UI JSON 包装成 `ACTIVITY_SNAPSHOT` 事件推给前端：

```typescript
// Agent 的 tool call 参数中包含 A2UI JSON
// AG-UI middleware 流式解析，边生成边渲染
render_a2ui: {
  a2ui_json: { createSurface: {...} }
}
```

**关键文件**:
| 绝对路径 | 内容 |
|----------|------|
| `/Users/wu/Documents/vizual-research/ag-ui/middlewares/a2ui-middleware/src/index.ts` | A2UI middleware 主入口 |
| `/Users/wu/Documents/vizual-research/ag-ui/middlewares/a2ui-middleware/src/tools.ts` | render_a2ui tool 定义 |
| `/Users/wu/Documents/vizual-research/ag-ui/middlewares/a2ui-middleware/src/schema.ts` | A2UI JSON 流式解析 |
| `/Users/wu/Documents/vizual-research/ag-ui/sdks/typescript/packages/core/src/events.ts` | 16 种事件类型定义 |
| `/Users/wu/Documents/vizual-research/ag-ui/sdks/typescript/packages/core/src/types.ts` | 消息、工具、输入等核心类型 |

#### 调研结论

- AG-UI 的 A2UI middleware 已经解决了"A2UI JSON 怎么通过事件流传递"的问题
- 已被 15+ Agent 框架集成（LangGraph, CrewAI, Google ADK, AWS Strands, Claude Agent SDK...）
- Vizual 作为 A2UI 的 renderer，天然可以接入 AG-UI 生态
- **AG-UI 在本项目中的角色是"传输层参考"，实际代码未集成到 vizual-compare 中**

---

### 2.3 Vizual（本项目）

**仓库位置**: `/Users/wu/Documents/vizual-research/vizual-compare/`

Vizual 是面向 AI Agent 产品的视觉运行时。Agent 输出 JSON spec → Vizual 渲染为可交互、可追问、可导出、可批注的视觉结果。

#### 项目历史

| 阶段 | 时间 | 内容 |
|------|------|------|
| v1.0 MVP | 2026-04-15 | 42 个组件（19 图表 + 8 UI + 11 业务 + 4 交互输入），json-render 集成，4 种构建格式，GitHub 开源 |
| v2.0 DocView | 2026-04-17 | DocView 合并进核心，批注系统，AI 修订循环，4 hooks 导出 |
| v3.0 A2UI 融合 | 2026-05-15（当前） | A2UI Bridge 实现，18 个 A2UI 原语组件 + FreeformHtml，50 个组件总量 |

#### 核心能力

| 能力 | 说明 |
|------|------|
| 50 个组件 | 19 图表 + 1 DataTable + 6 业务 + 1 DocView + 1 FormBuilder + 3 旧布局 + 1 FreeformHtml + 18 A2UI 原语 |
| Artifact 持久化 | VizualArtifact 含 spec、targetMap、versions、exports、state、theme |
| Patch 系统 | changeChartType, filterData, limitData, updateElementProps, replaceSpec, mergeState 等 |
| DocView 批注审阅 | annotation → thread → revision proposal → accept/reject/apply 循环 |
| 主题系统 | CSS 变量 + Design.md 解析 + 运行时切换（亮/暗） |
| 导出 | PNG, PDF, CSV, XLSX |
| Standalone bundle | 13MB IIFE，浏览器直接 `<script>` 加载 |

#### 渲染架构

```
VizualSpec { root: 'chart1', elements: { chart1: { type: 'BarChart', props: {...} } } }
    │
    ▼
VizualRenderer (React Component)
    │ 1. assertNoCyclicChildren(spec) — 检查循环引用
    │ 2. withDefaultElementProps(spec) — 填充默认 props
    │ 3. 创建 ObservableStateStore — 状态管理
    │ 4. 合并内置 + 自定义 handlers
    ▼
JSONUIProvider + Renderer (from @json-render/react)
    │ 5. 从 registry 查找组件 React 实现
    │ 6. 解析 children 字符串 ID → 递归渲染
    │ 7. 非布局组件自动包裹 background wrap (NO_WRAP 机制)
    ▼
React Component Tree → DOM
```

#### 主题系统

两套颜色 API：

| 函数 | 返回值 | 使用场景 |
|------|--------|----------|
| `tc('--rk-bg-primary')` | `'#0f1117'`（解析后的具体值） | ECharts option（ECharts 不理解 CSS var） |
| `tcss('--rk-bg-primary')` | `'var(--rk-bg-primary)'` | React inline style（浏览器运行时解析） |
| `chartColors(8)` | `['#6366f1', '#22c55e', ...]` | 图表调色板 |

---

## 三、协议对齐研究成果

### 3.1 领域 A：Vizual spec ↔ A2UI 映射（已完成，结论：完全可行）

**详细报告**: `/Users/wu/Documents/vizual-research/research/domain-a-mapping-report.md`

我们手动将 3 个典型 Vizual spec 转写为 A2UI JSON：

| 测试场景 | 结果 | 备注 |
|---------|------|------|
| BarChart → A2UI JSON | ✅ 通过 | 需自定义 catalog，结构映射自然 |
| GridLayout + 子组件 → A2UI JSON | ✅ 通过 | 树→扁平列表，ID 引用关系清晰 |
| DocView → A2UI JSON | ✅ 通过（基本渲染） | 渲染可行，但批注/审阅需 Runtime 层 |

#### 核心结构差异

| Vizual | A2UI | 转换方式 |
|--------|------|---------|
| 嵌套树 `{ elements: { id: { type, children: [嵌套] } } }` | 扁平数组 `[{ id, component, children: ["id1"] }]` | DFS 遍历展平 |
| `data` 内嵌在 props | `updateDataModel` + `{ path: "..." }` 引用 | 数据提取到 dataModel |
| `type: "bar"` | `component: "BarChart"` | type → component 映射表 |
| `state` 内嵌在 spec | 独立 `dataModel` | state 拆分为 dataModel |

#### 无法在 A2UI 协议层表达的功能（由 Vizual Runtime 管理）

| Vizual 功能 | 原因 |
|-------------|------|
| Artifact 持久化 | A2UI 是无状态流协议 |
| Patch 系统 | A2UI 只有 updateComponents（组件级） |
| 版本管理 | A2UI 无版本概念 |
| DocView 批注/审阅循环 | A2UI action 只支持简单事件 |
| 导出（PNG/PDF/CSV） | A2UI 无导出概念 |
| targetMap | A2UI 无引用映射概念 |

### 3.2 领域 B~E：尚未执行

详见 `/Users/wu/Documents/vizual-research/RESEARCH_PLAN.md`，后续研究计划：
- 领域 B: Runtime 融合 — Vizual artifact 系统架在 A2UI surface 上
- 领域 C: 交互闭环 — A2UI action 承载 Vizual 的交互回传
- 领域 D: AG-UI 事件流参考
- 领域 E: 生态贡献 — 向 A2UI 社区贡献 Vizual catalog

---

## 四、当前代码实现详解

### 4.1 A2UI Bridge（核心桥接器）

**文件**: `/Users/wu/Documents/vizual-research/vizual-compare/src/a2ui/bridge.ts`
**类型**: `/Users/wu/Documents/vizual-research/vizual-compare/src/a2ui/types.ts`

`A2UIBridge` 类维护 `Map<surfaceId, A2UISurfaceState>`，将 A2UI 消息转换为 VizualSpec。

#### 消息处理流程

```
processMessage(A2UIMessage)
  ├── createSurface    → 初始化 surface，返回空 VizualSpec
  ├── updateComponents → 合并组件（同 ID=更新，新 ID=添加），调用 buildSpec()
  ├── updateDataModel  → 设置 dataModel 路径值
  ├── deleteSurface    → 删除 surface
  ├── updateTheme      → 合并主题
  └── errorRecovery    → reset(清空) / fallback(用 payload) / retry(清 error 重建)
```

#### buildSpec() 核心转换

1. 查找 `root` 组件
2. 遍历所有组件，调用 `resolveProps()` 解析动态值
3. 将 A2UI 的 `{ id, component, children: ["id1"] }` 转换为 Vizual 的 `{ type: component, props, children: ["id1"] }`
4. 返回 `{ root: 'root', elements: {...}, state: dataModel }`

#### 动态值解析

```typescript
resolveDynamicValue(value):
  字面量 → 直接返回
  { path: "/chartData" } → 从 dataModel 查找 getValueAtPath()
  { call: "...", args } → 透传（暂不支持执行）
  数组/对象 → 递归解析
```

### 4.2 FreeformHtml（XSS 安全逃生舱）

**文件**: `/Users/wu/Documents/vizual-research/vizual-compare/src/components/freeform-html/component.tsx`

这是让 Agent 拥有"无限 UI"能力的核心组件：

1. Agent 输出任意 HTML/CSS 字符串
2. DOMPurify 清理 XSS（`<script>`、`onclick`、`onerror` 等全部移除）
3. `replaceThemeColors()` 将 HTML 中的硬编码颜色替换为 CSS 变量引用
4. `dangerouslySetInnerHTML` 渲染
5. 支持 `minHeight`、`width`、`applyTheme` 选项

**安全策略**：当前 DOMPurify 配置允许 `<style>` 和 `<iframe>` 标签。如果需要更严格，需调整配置。

### 4.3 18 个 A2UI 原语组件

每个组件都在 `/Users/wu/Documents/vizual-research/vizual-compare/src/components/a2ui-<name>/` 下，包含三个文件：

| 文件 | 作用 |
|------|------|
| `schema.ts` | Zod schema 定义 props 类型 |
| `component.tsx` | React 组件实现 |
| `index.ts` | 导出 component + schema + type |

| 组件 | 目录 | 功能 |
|------|------|------|
| Row | `a2ui-row/` | `display: flex; flex-direction: row` |
| Column | `a2ui-column/` | `display: flex; flex-direction: column` |
| Card | `a2ui-card/` | 背景容器，支持 padding/radius/shadow(0-3) |
| Text | `a2ui-text/` | 文字展示，支持 heading/body/caption/label/code 变体 |
| Image | `a2ui-image/` | 图片展示 |
| Icon | `a2ui-icon/` | emoji/unicode 图标 |
| List | `a2ui-list/` | 有序/无序列表 |
| Divider | `a2ui-divider/` | 水平/垂直分隔线 |
| Button | `a2ui-button/` | 按钮，primary/secondary/ghost 三种变体 |
| CheckBox | `a2ui-checkbox/` | 复选框，支持 checked/disabled |
| TextField | `a2ui-textfield/` | 文本输入，支持 text/email/password/number/url |
| ChoicePicker | `a2ui-choicepicker/` | 下拉选择或 radio 模式 |
| Slider | `a2ui-slider/` | 范围滑块 |
| DateTimeInput | `a2ui-datetime/` | 日期/时间选择器 |
| Tabs | `a2ui-tabs/` | 选项卡导航（布局组件，接受 children） |
| Modal | `a2ui-modal/` | 弹窗覆盖层（布局组件，接受 children） |
| Video | `a2ui-video/` | 视频播放器 |
| AudioPlayer | `a2ui-audio/` | 音频播放器 |

### 4.4 组件注册机制

所有组件需要在三个地方注册：

| 文件 | 作用 |
|------|------|
| `/Users/wu/Documents/vizual-research/vizual-compare/src/catalog.ts` | `defineCatalog({ ComponentName: ComponentSchema })` — Zod schema 注册 |
| `/Users/wu/Documents/vizual-research/vizual-compare/src/registry.tsx` | `defineRegistry({ ComponentName: ReactComponent })` — React 组件注册 |
| `/Users/wu/Documents/vizual-research/vizual-compare/src/index.ts` | `export { Component, ComponentSchema, ComponentProps }` — 公共导出 |

### 4.5 NO_WRAP 机制（背景包裹）

在 `/Users/wu/Documents/vizual-research/vizual-compare/src/registry.tsx` 中：

- **图表组件**（19 个）：自动包裹 `padding: 0` 的背景容器
- **普通组件**（Button, Text, CheckBox...）：自动包裹 `padding: 12px` 的背景容器
- **NO_WRAP 组件**（Row, Column, Card, Tabs, Modal, FreeformHtml, GridLayout, SplitLayout, HeroLayout, DocView）：不包裹背景，自己管理布局

### 4.6 Standalone Bundle API

**文件**: `/Users/wu/Documents/vizual-research/vizual-compare/src/cdn-entry.ts`
**构建产物**: `/Users/wu/Documents/vizual-research/vizual-compare/dist/vizual.standalone.js`

加载后暴露 `window.Vizual` 对象，核心 API：

```javascript
// 渲染
Vizual.renderSpec(spec, containerElement, options?)  // 核心渲染函数
Vizual.renderArtifact(artifactOrSpec, container, options?)
Vizual.unmountSpec(container)

// 主题
Vizual.setGlobalTheme(themeName)
Vizual.applyTheme(theme, container?)
Vizual.loadDesignMd(designMdContent)

// Artifact
Vizual.createArtifact(input)
Vizual.normalizeArtifact(input)
Vizual.applyArtifactPatch(artifact, patches)

// A2UI
Vizual.A2UIBridge  // 桥接类
Vizual.a2uiToVizualSpec(messages)  // 一次性转换

// 导出
Vizual.exportToPNG(element, options)
Vizual.exportToPDF(element, options)
Vizual.exportData(data, format)
```

### 4.7 50 个完整组件列表

#### ECharts 图表（19 个）
BarChart, LineChart, AreaChart, PieChart, ScatterChart, BubbleChart, BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart, FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart, DumbbellChart, RadarChart, MermaidDiagram

#### 数据展示（1 个）
DataTable

#### 业务组件（6 个）
KpiDashboard, Kanban, GanttChart, OrgChart, Timeline, AuditLog

#### 文档（1 个）
DocView（含批注、审阅、修订循环）

#### 表单（1 个）
FormBuilder（18 种字段类型）

#### 旧布局（3 个）
GridLayout, SplitLayout, HeroLayout

#### A2UI 逃生舱（1 个）
FreeformHtml（DOMPurify XSS 清理）

#### A2UI 布局原语（5 个）
Row, Column, Card, Tabs, Modal

#### A2UI 展示原语（5 个）
Text, Image, Icon, List, Divider

#### A2UI 输入原语（6 个）
Button, CheckBox, TextField, ChoicePicker, Slider, DateTimeInput

#### A2UI 媒体原语（2 个）
Video, AudioPlayer

---

## 五、测试要求（Codex 核心任务）

### 5.1 自动化测试

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare
npm test          # 32 files, 219 tests — 应全部通过
npx tsc --noEmit  # 5 个 pre-existing 类型错误，不影响功能
```

### 5.2 构建验证

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare
node build.js --standalone
# 输出: dist/vizual.standalone.js (~13MB)
```

### 5.3 浏览器视觉测试（Computer Use 核心）

#### 启动测试服务器

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare
python3 -m http.server 8899
```

#### 主验收页面

**URL**: `http://localhost:8899/validation/a2ui-primitives-visual.html`
**文件**: `/Users/wu/Documents/vizual-research/vizual-compare/validation/a2ui-primitives-visual.html`

这个页面包含 24 个测试用例，覆盖全部 19 个新组件 + XSS + 边缘 case。

**逐项验证清单**：

| # | Section | 测试项 | 预期结果 |
|---|---------|--------|----------|
| 1 | FreeformHtml | Grid Layout | 两列卡片（Card A / Card B），CSS Grid 正常渲染 |
| 2 | FreeformHtml | Personal Homepage | 紫色渐变背景，"Good morning" 白色文字 |
| 3 | Layout | Row + Card + Text | 三张卡片水平排列，间距 12px |
| 4 | Layout | Column + Text | 垂直排列，间距 8px |
| 5 | Layout | Card with shadow | 卡片有 shadow level 2（box-shadow 可见） |
| 6 | Display | Text variants | heading 大号粗体 / body 默认 / caption 小号灰色 / label 半粗 |
| 7 | Display | Icons | 三个 emoji（🏠📊🔔）大小 32px |
| 8 | Display | Unordered List | 四项圆点列表 |
| 9 | Display | Divider | 水平分隔线 + "Below divider" 文字 |
| 10 | Inputs | Button variants | primary（紫色） / secondary（灰色） / ghost（透明） |
| 11 | Inputs | CheckBox | "Accept terms" 已勾选 / "Disabled" 灰色不可点击 |
| 12 | Inputs | TextField | Name 输入框有 placeholder / Email 输入框有预填值 |
| 13 | Inputs | ChoicePicker + Slider + DateTime | 下拉选 Medium / 滑块 65 / 日期 2026-05-20 |
| 14 | Complex | Tabs | 三个 tab header（Overview/Details/Settings）+ 内容区 |
| 15 | Complex | AudioPlayer | 播放器控件（src 无效正常显示"无法播放"） |
| 16 | Composition | Full Agent Dashboard | 📊 图标 + 标题 + 三张 metric card (128/96/32) + Activity list + Quick Action form |
| 17 | Edge | XSS: script injection | `<script>` 被清除，只显示 "Script stripped, this text is safe" |
| 18 | Edge | XSS: event handlers | onclick/onerror 被移除，只显示 "Event handlers stripped" |
| 19 | Edge | Empty HTML | 空内容不崩溃，显示空白容器 |
| 20 | Edge | Empty Text | 空文本不崩溃 |
| 21 | Edge | Empty List | 空列表不崩溃，无列表项 |
| 22 | Edge | Empty Row | 空行不崩溃 |
| 23 | Edge | Long text truncated | 500 个 A 截断为 2 行（maxLines: 2 生效） |
| 24 | Edge | Theme color injection | 自定义颜色正常显示 |

#### 其他验证页面

| 文件绝对路径 | URL | 用途 |
|-------------|-----|------|
| `/Users/wu/Documents/vizual-research/vizual-compare/validation/eval-full-31.html` | `http://localhost:8899/validation/eval-full-31.html` | 原有 31 个组件（图表+业务）视觉回归 |
| `/Users/wu/Documents/vizual-research/vizual-compare/validation/vizual-test.html` | `http://localhost:8899/validation/vizual-test.html` | 冷启动 Agent 完整流程测试 |
| `/Users/wu/Documents/vizual-research/vizual-compare/validation/a2ui-full-acceptance.html` | `http://localhost:8899/validation/a2ui-full-acceptance.html` | A2UI 消息 → 渲染全链路 |
| `/Users/wu/Documents/vizual-research/vizual-compare/validation/a2ui-test.html` | `http://localhost:8899/validation/a2ui-test.html` | Bridge 基础功能 |

### 5.4 对抗性测试（重点！）

以下场景需要**在浏览器 console 中手动构造 spec 测试**，或在现有测试页面中添加测试用例：

**快速测试模板**（在浏览器 console 中执行）：

```javascript
var V = window.Vizual;
var box = document.createElement('div');
box.style.minHeight = '60px';
box.style.marginBottom = '10px';
document.body.appendChild(box);

// --- 测试：不存在的 component type ---
V.renderSpec({ root:'r', elements:{ r:{ type:'NotARealComponent', props:{}}}}, box);
// 预期: 不崩溃，可能显示空白或 fallback

// --- 测试：SVG XSS ---
var box2 = document.createElement('div');
box2.style.minHeight = '60px';
box2.style.marginBottom = '10px';
document.body.appendChild(box2);
V.renderSpec({ root:'r', elements:{ r:{ type:'FreeformHtml', props:{ html:'<svg onload="alert(1)"><circle r="40"/></svg>'}}}}, box2);
// 预期: onload 被移除，SVG 渲染正常

// --- 测试：iframe 注入 ---
var box3 = document.createElement('div');
box3.style.minHeight = '60px';
box3.style.marginBottom = '10px';
document.body.appendChild(box3);
V.renderSpec({ root:'r', elements:{ r:{ type:'FreeformHtml', props:{ html:'<iframe src="https://evil.com"></iframe><p>iframe test</p>'}}}}, box3);
// 预期: 检查 iframe 是否被过滤（当前 DOMPurify 配置可能允许）

// --- 测试：style 标签泄漏 ---
var box4 = document.createElement('div');
box4.style.minHeight = '60px';
box4.style.marginBottom = '10px';
document.body.appendChild(box4);
V.renderSpec({ root:'r', elements:{ r:{ type:'FreeformHtml', props:{ html:'<style>body{background:red!important}</style><p>style leak test</p>'}}}}, box4);
// 预期: 检查整个页面背景是否变红（如果变红 = style 标签影响全局 = 安全问题）

// --- 测试：5 层嵌套 ---
var box5 = document.createElement('div');
box5.style.minHeight = '60px';
box5.style.marginBottom = '10px';
document.body.appendChild(box5);
V.renderSpec({ root:'r', elements:{
  r: { type:'Column', props:{ gap:8 }, children:['c1'] },
  c1: { type:'Row', props:{ gap:8 }, children:['c2'] },
  c2: { type:'Card', props:{ padding:8 }, children:['c3'] },
  c3: { type:'Column', props:{ gap:4 }, children:['c4'] },
  c4: { type:'Row', props:{ gap:4 }, children:['t1','t2'] },
  t1: { type:'Text', props:{ content:'Deep 1' }},
  t2: { type:'Text', props:{ content:'Deep 2' }}
}}, box5);
// 预期: 正常渲染，"Deep 1" 和 "Deep 2" 可见

// --- 测试：循环引用 ---
var box6 = document.createElement('div');
box6.style.minHeight = '60px';
box6.style.marginBottom = '10px';
document.body.appendChild(box6);
try {
  V.renderSpec({ root:'r', elements:{
    r: { type:'Column', props:{}, children:['a'] },
    a: { type:'Row', props:{}, children:['b'] },
    b: { type:'Card', props:{}, children:['a'] }  // 循环: b → a → b → ...
  }}, box6);
} catch(e) { box6.textContent = 'Caught: ' + e.message; }
// 预期: assertNoCyclicChildren 应该抛出错误

// --- 测试：props 类型错误 ---
var box7 = document.createElement('div');
box7.style.minHeight = '60px';
box7.style.marginBottom = '10px';
document.body.appendChild(box7);
V.renderSpec({ root:'r', elements:{ r:{ type:'Text', props:{ content: 12345 }}}}, box7);
// 预期: 不崩溃，可能显示空或 "12345"

// --- 测试：极端尺寸 ---
var box8 = document.createElement('div');
box8.style.minHeight = '60px';
box8.style.marginBottom = '10px';
document.body.appendChild(box8);
V.renderSpec({ root:'r', elements:{ r:{ type:'Card', props:{ padding:-10, radius:-5, shadow:-1 }, children:['t'] }, t:{ type:'Text', props:{ content:'Negative sizes' }}}}, box8);
// 预期: 不崩溃，负值被浏览器忽略

// --- 测试：100 个组件 ---
var box9 = document.createElement('div');
box9.style.minHeight = '100px';
box9.style.marginBottom = '10px';
document.body.appendChild(box9);
var els = { r: { type:'Column', props:{ gap:4 }, children:[] } };
for (var i = 0; i < 100; i++) {
  var id = 't' + i;
  els.r.children.push(id);
  els[id] = { type:'Text', props:{ content:'Item ' + i }};
}
V.renderSpec({ root:'r', elements:els }, box9);
// 预期: 正常渲染 100 个文本，无明显卡顿
```

**额外对抗性场景清单**：

| 场景 | 测试方法 | 预期 |
|------|----------|------|
| FreeformHtml + `<form>` + `<input>` | HTML 中包含表单元素 | 检查 DOMPurify 是否允许 |
| FreeformHtml + `<base href>` | 修改 base URL | 应被过滤 |
| 重复 createSurface | 同一 surfaceId 创建两次 | 第二次覆盖还是报错？ |
| 乱序消息 | 先 updateComponents 再 createSurface | 不崩溃 |
| 同一容器多次 renderSpec | 同一 div 调用两次 renderSpec | 第二次替换第一次的内容 |
| Unicode / RTL 文本 | Text 组件 content 含阿拉伯文 | 正常渲染，不乱码 |
| Emoji 组合字符 | 👨‍👩‍👧‍👦 等组合 emoji | 正常显示 |
| 超长字符串（10000 字） | Text content 长文本 | 渲染但不卡顿 |
| props 全部缺失 | `{ type:'Text', props:{} }` | 不崩溃，可能空白 |
| children 指向不存在的 ID | `children: ['nonexistent']` | 不崩溃，子位置空白 |

### 5.5 交互测试

| 组件 | 测试操作 | 预期 |
|------|----------|------|
| Button | 点击 Primary 按钮 | 视觉反馈（hover/active 状态） |
| CheckBox | 点击 "Accept terms" | 勾选状态切换 |
| Slider | 拖动滑块 | 数值跟随变化 |
| Tabs | 点击 "Details" tab | tab header 高亮切换 |
| ChoicePicker | 点击下拉框 | 展示 Low/Medium/High 选项 |
| TextField | 点击输入框 | 可输入文字 |

---

## 六、已知问题和风险

### 6.1 已修复的问题

| 问题 | 修复 |
|------|------|
| CheckBox `disabled` 误写为 `readOnly` | 已改为 `disabled={disabled}` |
| ChoicePicker `<select>` 用 `readOnly`（HTML 不支持） | 已改为 `disabled` |
| 视觉测试页重复 ID 导致只渲染第一个 | 改用唯一递增 ID |
| 视觉测试页 render 函数不捕获异常 | 已加 try/catch |

### 6.2 已知限制（不需修复，但需知晓）

| 限制 | 说明 |
|------|------|
| AudioPlayer/Video 无效 src | 浏览器显示"无法播放"——预期行为 |
| jsdom 中 tcss 不解析 | 单元测试通过 mock 处理 |
| DOMPurify 允许 `<style>` 和 `<iframe>` | 如需更严格策略需调整配置 |
| 5 个 pre-existing TS 类型错误 | 在 agent-bridge.test.ts 和 review-sdk.test.ts，不影响功能 |
| 旧布局 + 新布局共存 | GridLayout/SplitLayout/HeroLayout 和 Row/Column/Card 不应混用 |

### 6.3 需要 Codex 重点关注的风险

| 风险 | 为什么重要 |
|------|-----------|
| FreeformHtml DOMPurify 配置 | 允许 `<style>` 可能导致全局样式污染；允许 `<iframe>` 可能有安全风险 |
| Zod schema 运行时验证 | 当前 schema 主要用于类型推断，props 类型错误可能不会在运行时被拦截 |
| Bridge 错误处理 | 所有异常路径是否都有 fallback |
| 大 spec 性能 | 100+ 组件是否卡顿 |
| 组件间样式隔离 | 多个 FreeformHtml 的 `<style>` 是否互相干扰 |

---

## 七、关键文件完整路径索引

### 项目根目录

```
/Users/wu/Documents/vizual-research/vizual-compare/
├── HANDOFF.md                          ← 本文档
├── CLAUDE.md                           ← 项目上下文和开发规范
├── README.md                           ← 项目说明
├── build.js                            ← esbuild 构建配置
├── package.json                        ← 依赖和 scripts
├── tsconfig.json                       ← TypeScript 配置
├── vitest.config.ts                    ← 测试配置
├── dist/
│   └── vizual.standalone.js            ← Standalone IIFE bundle (13MB)
```

### 核心架构文件

```
/Users/wu/Documents/vizual-research/vizual-compare/src/
├── index.ts                            ← npm 包入口，所有公共 API 导出
├── catalog.ts                          ← 50 个组件 Zod schema 注册
├── registry.tsx                        ← 50 个 React 组件注册 + NO_WRAP + 背景包裹
├── cdn-entry.ts                        ← Standalone bundle 入口，window.Vizual 定义
├── a2ui/
│   ├── bridge.ts                       ← A2UI → Vizual 桥接核心
│   ├── types.ts                        ← A2UI v0.10 类型定义
│   ├── index.ts                        ← A2UI 公共导出
│   └── __tests__/
│       └── bridge-a2ui-primitives.test.ts  ← 9 个桥接集成测试
├── core/
│   ├── artifact.ts                     ← VizualSpec + VizualArtifact + Patch + targetMap
│   ├── react-renderer.tsx              ← VizualRenderer + VizualArtifactView React 组件
│   ├── theme-colors.ts                ← tc/tcss/chartColors 颜色系统
│   ├── host-runtime.ts                ← VizualHostRuntime
│   ├── agent-bridge.ts                ← Agent Bridge
│   └── review.ts                      ← Review thread + Revision proposal
```

### 新增 A2UI 组件

```
/Users/wu/Documents/vizual-research/vizual-compare/src/components/
├── freeform-html/
│   ├── schema.ts
│   ├── component.tsx
│   └── index.ts
├── a2ui-row/
├── a2ui-column/
├── a2ui-card/
├── a2ui-text/
├── a2ui-image/
├── a2ui-icon/
├── a2ui-list/
├── a2ui-divider/
├── a2ui-button/
├── a2ui-checkbox/
├── a2ui-textfield/
├── a2ui-choicepicker/
├── a2ui-slider/
├── a2ui-datetime/
├── a2ui-tabs/
├── a2ui-modal/
├── a2ui-video/
├── a2ui-audio/
└── __tests__/
    └── a2ui-primitives.test.tsx        ← 25 个组件单元测试
```

### 验证页面

```
/Users/wu/Documents/vizual-research/vizual-compare/validation/
├── a2ui-primitives-visual.html         ← ★ 主验收页（19 新组件 + XSS + 边缘 case）
├── eval-full-31.html                   ← 31 原有组件视觉回归
├── vizual-test.html                    ← 冷启动 Agent 主链路
├── a2ui-full-acceptance.html           ← A2UI 消息 → 渲染全链路
├── a2ui-test.html                      ← Bridge 基础功能
└── design-md-load.html                 ← Design.md 主题加载测试
```

### 参考仓库

```
/Users/wu/Documents/vizual-research/
├── a2ui/                               ← A2UI 协议源码（Google）
│   ├── specification/v0_10/            ← v0.10 协议规范
│   ├── renderers/react/src/            ← 官方 React renderer
│   ├── renderers/web_core/src/         ← 框架无关核心库
│   └── docs/                           ← 完整文档
├── ag-ui/                              ← AG-UI 协议源码（CopilotKit）
│   ├── middlewares/a2ui-middleware/    ← A2UI middleware（关键参考）
│   └── sdks/typescript/packages/core/  ← 16 种事件类型定义
├── research/
│   └── domain-a-mapping-report.md      ← 协议对齐映射差异报告
├── HANDOFF.md                          ← 工作区级交接文档
├── RESEARCH_PLAN.md                    ← 5 领域研究计划
└── README-WORKSPACE.md                 ← 工作区目录说明
```

---

## 八、Codex 工作流程建议

### Step 1: 环境准备

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare
npm install
npm test  # 确认 219 tests 全通过
node build.js --standalone  # 确认构建成功
python3 -m http.server 8899  # 启动测试服务器
```

### Step 2: 视觉验收（Computer Use）

1. 浏览器打开 `http://localhost:8899/validation/a2ui-primitives-visual.html`
2. 截图验证所有 24 个测试用例
3. 逐个检查渲染结果（参照 5.3 节清单）
4. 交互测试（点击按钮、切换 tab、拖动滑块）

### Step 3: 对抗性测试

1. 在浏览器 console 中执行 5.4 节的测试脚本
2. 记录每个场景的实际结果
3. 发现 bug 则修复并重新测试

### Step 4: 原有组件回归

1. 打开 `http://localhost:8899/validation/eval-full-31.html`
2. 确认图表和业务组件没有因为新增 A2UI 组件而回归

### Step 5: Bug 修复

- 修复过程中持续运行 `npm test` 确保不引入回归
- 每个 fix 独立 commit
- 如果改出问题：`git checkout 094a932` 回滚

---

## 九、Git 回滚指南

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare

# 查看当前 commit
git log --oneline -10

# 回滚到稳定 checkpoint
git checkout 094a932

# 或创建修复分支
git checkout -b fix/xxx 094a932

# 完整 commit 历史
# 094a932 fix(validation): repair visual acceptance page — unique render IDs fix blank sections
# 74f7624 experiment: add FreeformHtml + 18 A2UI basic catalog primitives for unlimited agent UI
# 2e03a86 fix(validation): repair acceptance test page — sizing, hints, error panels, AI interaction
# 86bf085 feat(a2ui): extend bridge with action callbacks, theme, error recovery + 27-test acceptance suite
# 5ba5b94 feat: add A2UI protocol bridge — A2UI messages → Vizual rendering
```

---

*文档版本: 2026-05-15 v2 — 完整版，包含全部研究结论、架构细节、测试要求*
