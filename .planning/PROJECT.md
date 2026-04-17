# Vizual

## What This Is

AI 和用户之间的交互渲染层。AI 输出 JSON spec → Vizual 渲染为可交互的可视化组件（42 种图表/表单/输入组件）或图文并茂的可批注文档（DocView），用户通过批注和表单交互后数据可回传给 AI，形成闭环。面向 AI Agent 开发者，通过 json-render 平台实现一键接入。

当前版本：42 个组件（19 种 ECharts 图表 + 8 种 UI 组件 + 11 种业务组件 + 4 种交互输入组件）+ DocView 文档批注组件，4 种构建格式（ESM/CJS/CDN/Standalone），已开源至 GitHub。

## Core Value

AI 说出结构化 JSON → 自动渲染为可交互的可视化组件或可批注文档，直接嵌入对话流或应用中。用户可以通过批注和交互组件回传数据给 AI，实现双向交互闭环。

## Current Milestone: v2.0 DocView Native Integration

**Goal:** 将 DocView 从独立包（@vizual/docview）合并到 vizual 核心，成为原生组件。AI 可输出 DocView JSON spec → 渲染为图文并茂的可批注文档 → 用户批注 → 回传 AI → AI 修订 → 文档更新。

**Target features:**
- DocView 合并进 vizual（src/docview/），不再是独立 npm 包
- DocView 注册到 catalog/registry，AI 可像输出 BarChart 一样输出 DocView
- 多粒度批注：文本选中、图表数据点、KPI 卡片、表格单元格
- 批注生命周期：draft → active → resolved / orphaned
- AI 修订循环：批量提交批注 → AI 返回新 spec → 文档自动刷新
- 4 个 hooks 导出（useAnnotations、useTextSelection、useRevisionLoop、useVersionHistory）
- 修复 docview-pkg 中的技术债务
- 构建产物 + AI prompt/skill 更新

## Requirements

### Validated

- ✓ 42 个组件注册在 json-render catalog — v1.0~v1.1
- ✓ 19 种 ECharts 图表通过 mviz bridge 渲染（含 RadarChart）— v1.0~v1.1
- ✓ 8 种 UI 组件（BigValue/Delta/Alert/Note/TextBlock/TextArea/DataTable/EmptySpace）— v1.0
- ✓ 11 种业务组件（Kanban/GanttChart/OrgChart/Timeline/KpiDashboard/BudgetReport/FeatureTable/AuditLog/JsonViewer/CodeBlock/FormView）— v1.0
- ✓ 4 种交互输入组件（InputText/InputSelect/InputFile/FormBuilder，18 种字段类型）— v1.1
- ✓ catalog.prompt() 生成 AI 系统提示词 — v1.0
- ✓ 4 种构建格式（ESM 760KB + CJS 766KB + CDN 444KB + Standalone 1.6MB）— v1.0
- ✓ GitHub 开源 + MIT 许可证 — v1.0
- ✓ DocView 容器组件合并进 vizual 核心包 — Phase 5 (v2.0)
- ✓ DocView 注册到 catalog/registry — Phase 5 (v2.0)
- ✓ SectionRenderer 支持 7 种 section 类型（text/heading/chart/kpi/table/callout/component）— Phase 6 (v2.0)
- ✓ AnnotationOverlay 文字选中高亮 + TargetHighlighter 组件级批注 — Phase 6 (v2.0)
- ✓ 多粒度批注：文本选中 + 图表数据点 + KPI 卡片 + 表格单元格 — Phase 6 (v2.0)
- ✓ AnnotationPanel 侧边面板 + 状态管理 + 批量提交 — Phase 6 (v2.0)
- ✓ AnnotationInput 弹窗式批注输入（笔记 + 6 色选择）— Phase 6 (v2.0)
- ✓ 4 个 hooks 导出（useAnnotations, useTextSelection, useRevisionLoop, useVersionHistory）— Phase 6 (v2.0)
- ✓ 修复 docview-pkg 技术债务 — Phase 5 (v2.0)
- ✓ AI 修订循环 — 批注提交 -> AI 修订 -> 文档刷新 -> 孤儿检测 — Phase 7 (v2.0)
- ✓ 构建产物更新（CDN + Standalone 包含 DocView）— Phase 7 (v2.0)
- ✓ AI prompt/skill 更新包含 DocView — Phase 7 (v2.0)
- ✓ validation/demo-docview.html 测试页面 — Phase 7 (v2.0)

### Active

None -- v2.0 milestone complete.

### Out of Scope

- 独立 Chart.js 图表渲染 — 被 mviz/ECharts 替代
- 通用 UI 框架（按钮/对话框）— json-render/shadcn 已覆盖
- BI 平台（数据库连接）— 不是数据分析工具
- Vue/Svelte 组件输出 — v2+ 再考虑
- 长图文/截图/超分输出 — 属于内容生产流水线，不是渲染库的职责
- 多人实时协作 — MVP 只做单人批注
- 权限系统 — MVP 不涉及
- PPTView — 已记录想法，未来 milestone

## Context

### v1.0~v1.1 已完成
- 42 个组件全部注册在 registry（42/42 PASS 验证）
- json-render 的 Renderer + StateProvider 渲染管线已验证
- 交互输入组件利用 useBoundProp + useState fallback 实现双向数据绑定
- FormBuilder 支持 18 种字段类型
- catalog.prompt() 和 catalog.validate() 可用
- 4 种构建格式，GitHub 开源

### DocView 原型已完成（docview-pkg）
- 12 个文件，1174 行代码
- 4 个 React hooks（useAnnotations、useTextSelection、useRevisionLoop、useVersionHistory）
- 4 个组件（DocView、AnnotationOverlay、AnnotationPanel、AnnotationInput）
- 唯一外部依赖：react-highlight-words（~5KB gzip）
- 已有 demo-docview.html 演示页面（含 ECharts 图表、KPI、表格批注）
- 已知技术债务：require() 代替 import、extractText 过于简化、vitest 错放在 dependencies

### json-render 交互能力
```typescript
interface UIElement {
  type: string
  props: Record<string, unknown>
  children?: string[]
  state?: Record<string, unknown>
  on?: Record<string, ActionBinding>
  watch?: Record<string, ActionBinding>
  repeat?: { statePath: string; key?: string }
}
```

### 技术决策
- DocView 合并进 vizual 核心（不再独立包）
- DocView 作为容器组件包裹 children（Renderer 输出），同时注册到 catalog
- 复用 json-render 的 state/on 事件系统实现批注回传
- react-highlight-words 作为唯一新增依赖

## Constraints

- **依赖**: React 18+, Zod v4, ECharts 5.x, mviz 1.6.4+, json-render 0.17+
- **新增依赖**: react-highlight-words ^0.20.0
- **包体积**: 核心包增量 < 30KB（DocView 代码 + react-highlight-words）
- **浏览器**: Chrome 90+, Firefox 90+, Safari 15+
- **向后兼容**: 不得破坏现有 42 个组件的使用方式

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 不重写 mviz 图表，直接封装 | mviz 已有成熟 ECharts 编译器 | ✓ Good |
| Chart.js → ECharts 切换 | mviz 使用 ECharts，统一引擎 | ✓ Good |
| 交互组件放核心包 | 表单/输入是 AI 对话的基础交互能力 | ✓ Good |
| **DocView 合并进 vizual 核心** | 用户装一个包就够了；DocView 复用 vizual 全部组件；AI 统一输出 | Good |
| 复用 json-render state/on | 不另建数据流，保持与平台一致 | Good |
| react-highlight-words 作为依赖 | 成熟方案，体积小（5KB gzip），避免自研高亮 | Good |

---
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-17 after Phase 6 (Annotation System) completion*
