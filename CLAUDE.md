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

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
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
