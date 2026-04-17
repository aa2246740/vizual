# Vizual (formerly AI RenderKit)

## What This Is

AI 和用户之间的交互渲染层。AI 输出 JSON spec → Vizual 渲染为可交互的可视化组件（图表、表单、输入框、文档等），用户交互后数据可回传给 AI，形成闭环。面向 AI Agent 开发者，通过 json-render 平台实现一键接入。

当前版本：37 个组件（18 种 ECharts 图表 + 8 种 UI 组件 + 11 种业务组件），4 种构建格式（ESM/CJS/CDN/Standalone），已开源至 GitHub。

## Core Value

AI 说出结构化 JSON → 自动渲染为可交互的可视化组件，直接嵌入对话流或应用中。用户可以通过组件回传数据给 AI，实现双向交互。

## Current Milestone: v1.1 Interactive Vizual

**Goal:** 将 Vizual 从"展示型渲染库"升级为"交互型渲染库"，支持用户输入和数据回传，并新增 DocView 批注协作文档组件。

**Target features:**
- 4 个交互输入组件（InputText、InputSelect、InputFile、FormBuilder）加入 vizual 核心包
- DocView 批注协作组件作为独立 @vizual/docview 扩展包
- 利用 json-render 的 state + on 事件系统实现数据回传
- 更新 AI prompt 和 Skill 包含新组件
- 用户测试确认后再决定是否开源发布

## Requirements

### Validated

- ✓ 37 个组件注册在 json-render catalog — v1.0
- ✓ 18 种 ECharts 图表通过 mviz bridge 渲染 — v1.0
- ✓ 8 种 UI 组件（BigValue/Delta/Alert/Note/TextBlock/TextArea/DataTable/EmptySpace）— v1.0
- ✓ 11 种业务组件（Kanban/GanttChart/OrgChart/Timeline/KpiDashboard/BudgetReport/FeatureTable/AuditLog/JsonViewer/CodeBlock/FormView）— v1.0
- ✓ catalog.prompt() 生成 22KB AI 系统提示词 — v1.0
- ✓ 4 种构建格式（ESM 760KB + CJS 766KB + CDN 444KB + Standalone 1.6MB）— v1.0
- ✓ GitHub 开源 + MIT 许可证 — v1.0

### Active

- [ ] 4 个交互输入组件加入 vizual 核心包（37 → 41 组件）
- [ ] 交互组件利用 json-render state/on/watch 实现数据回传
- [ ] DocView 容器组件（独立 @vizual/docview 包）
- [ ] 批注层（AnnotationOverlay）— 文字选中、高亮、offset 定位
- [ ] 批注面板（AnnotationPanel）— 右侧面板、批量提交
- [ ] AI 修订循环 — 批注 + spec 提交 AI → 新 spec → 文档刷新
- [ ] 版本快照与回滚
- [ ] 更新 catalog.prompt() 和 AI Skill 包含新组件
- [ ] 用户测试验证

### Out of Scope

- 独立 Chart.js 图表渲染 — 被 mviz/ECharts 替代
- 通用 UI 框架（按钮/对话框）— json-render/shadcn 已覆盖
- BI 平台（数据库连接）— 不是数据分析工具
- Vue/Svelte 组件输出 — v2 再考虑
- 长图文/截图/超分输出 — 属于内容生产流水线，不是渲染库的职责
- 多人协作 — DocView MVP 只做单人批注
- 权限系统 — DocView MVP 不涉及

## Context

### v1.0 已完成
- 37 个组件全部注册在 registry
- json-render 的 Renderer + StateProvider 渲染管线已验证
- catalog.prompt() 和 catalog.validate() 可用
- json-render 的 UIElement 接口支持 state/on/watch/repeat，交互基础设施就绪
- 4 种构建格式，GitHub 开源

### json-render 交互能力
```typescript
interface UIElement {
  type: string
  props: Record<string, unknown>
  children?: string[]
  state?: Record<string, unknown>      // 状态管理
  on?: Record<string, ActionBinding>   // 事件绑定（用户交互回传）
  watch?: Record<string, ActionBinding> // 状态监听
  repeat?: { statePath: string; key?: string } // 列表渲染
}
```

### 技术决策
- 交互组件放核心包（vizual），DocView 放扩展包（@vizual/docview）
- 复用 json-render 的 state/on 事件系统，不另建数据流
- DocView 的批注通过 on 事件回传，不需要独立的 AI adapter
- 最终是否开源取决于用户测试结果

## Constraints

- **依赖**: React 18+, Zod v4, ECharts 5.x, mviz 1.6.4+, json-render 0.17+
- **包体积**: ECharts 按需加载，核心包增量 < 50KB
- **浏览器**: Chrome 90+, Firefox 90+, Safari 15+
- **json-render 事件系统**: 需要验证 on/watch 在实际组件中的可用性
- **开源决策**: 用户测试通过后才决定是否开源发布

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 不重写 mviz 图表，直接封装 | mviz 已有成熟 ECharts 编译器 | ✓ Good |
| Chart.js → ECharts 切换 | mviz 使用 ECharts，统一引擎 | ✓ Good |
| 交互组件放核心包 | 表单/输入是 AI 对话的基础交互能力 | — Pending |
| DocView 放 @vizual/docview | 批注协作是高复杂度功能，不应膨胀核心包 | — Pending |
| 复用 json-render state/on | 不另建数据流，保持与平台一致 | — Pending |
| 先测试再决定开源 | 确保质量达标后再公开 | — Pending |

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
*Last updated: 2026-04-16 after v1.1 milestone start*
