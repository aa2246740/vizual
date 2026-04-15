# AI RenderKit

## What This Is

json-render 生态中最全的 AI 数据可视化 Catalog。将 mviz 的 24 种图表/UI 组件与 RenderKit 自研的 11 种业务组件（看板、甘特图、组织架构等）统一封装为 React 组件 + Zod Schema，接入 json-render 平台。AI 输出 JSON → json-render 自动渲染为交互式可视化组件。

面向三类用户：AI 用户（Claude/ChatGPT 对话中看到图表）、开发者（调用 render(json) 获得组件）、AI Agent（输出符合 Schema 的 JSON 自动渲染）。

## Core Value

AI 说出结构化 JSON → 自动渲染为可交互的可视化组件，直接嵌入对话流或应用中。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] mviz 全部 24 种组件封装为 json-render 兼容的 React 组件 + Zod Schema
- [ ] 11 种自研业务组件（Kanban/Gantt/OrgChart/Timeline/KPIDashboard/BudgetReport/FeatureTable/AuditLog/JSONViewer/CodeBlock/FormView）实现为 React 组件 + Zod Schema
- [ ] 统一主题系统（3 种内置主题 + 自定义 CSS Variables）
- [ ] 注册为 json-render catalog（defineCatalog + defineRegistry）
- [ ] 发布为 Claude Code Skill（SKILL.md）
- [ ] 发布为 npm 包
- [ ] ECharts 按需加载控制包体积

### Out of Scope

- 独立 Chart.js 图表渲染 — 被 mviz/ECharts 替代
- 通用 UI 框架（按钮/表单/对话框）— json-render/shadcn 已覆盖
- BI 平台（数据库连接）— 不是数据分析工具
- Vue/Svelte 组件输出 — v2 再考虑
- 流式渲染 — json-render 已内置支持，不需要单独做

## Context

### 已有能力（来自 v1.0 开发）
- 16 种 Schema 类型已有完整的 parser + renderer 实现（基于 Chart.js + SVG + DOM）
- 469 个单元测试全部通过
- 3 种内置主题（Default Dark / Linear / Vercel）
- 构建产物：IIFE (913KB) + ESM (860KB)

### 竞品分析结论
- **mviz** (matsonj/mviz): Claude Code Skill，17 种 ECharts 图表 + 7 种 UI 组件，输出独立 HTML。CLI 渲染引擎是自写的 TypeScript（charts/bar.js 等模块把 JSON spec 编译成 ECharts option），我们直接复用。
- **AntV mcp-server-chart**: 26+ 种图表，输出 PNG 图片（无交互），不适用。
- **json-render** (vercel-labs/json-render): 通用 Generative UI 框架，支持 React/Vue/Svelte/PDF/Email/3D。v0.16.0，核心 API 是 `defineCatalog` → `defineRegistry` → `<Renderer>`。使用 Zod v4 定义 Schema。

### 技术决策依据
- mviz 的图表编译逻辑（buildBarOptions 等）已验证可直接通过 npm 包的 dist/ 调用
- json-render 的 catalog 注册模式：defineCatalog(schema, { components: { Name: { props: zodSchema, description } } }) → defineRegistry(catalog, { components: { Name: ReactComponent } })
- ECharts 通过 CDN 按需加载，mviz 已有此模式

## Constraints

- **依赖**: React 18+, Zod v4, ECharts 5.x, mviz 1.6.4+, json-render 0.16+
- **包体积**: ECharts 按需加载，目标 gzip 后 < 300KB（不含 ECharts CDN）
- **浏览器**: Chrome 90+, Firefox 90+, Safari 15+
- **json-render 稳定性**: v0.16.0 API 可能变化，需要版本锁定

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 不重写 mviz 图表，直接封装 | mviz 已有成熟 ECharts 编译器，重写是造轮子 | — Pending |
| React 组件 + Zod Schema 输出 | json-render 要求此格式；也是最通用的组件化方式 | — Pending |
| Chart.js → ECharts 切换 | mviz 使用 ECharts，统一引擎减少依赖 | — Pending |
| 保留业务组件自研 | 看板/甘特/组织架构等是独家差异化，没有竞品提供 | — Pending |
| json-render catalog 模式 | 接入 json-render 生态获得流式渲染、跨框架等能力 | — Pending |

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
*Last updated: 2026-04-15 after initialization*
