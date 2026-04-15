# Requirements: AI RenderKit

**Defined:** 2026-04-15
**Core Value:** AI outputs structured JSON → automatically renders as interactive visualization component

## v1 Requirements

### Phase 0: Technical Validation

- [ ] **VAL-01**: mviz programmatic API callable — buildBarOptions(spec) returns valid ECharts option
- [ ] **VAL-02**: json-render catalog registration works — defineCatalog + defineRegistry produces working catalog
- [ ] **VAL-03**: End-to-end proof: 1 mviz chart + 1 custom component render through json-render
- [ ] **VAL-04**: Zod v4 schemas validate AI-generated JSON correctly

### Phase 1: Core Infrastructure + mviz Bridge

- [ ] **INFRA-01**: React project setup with TypeScript, esbuild, Vitest
- [ ] **INFRA-02**: ECharts wrapper component (useRef, init, dispose, resize via ResizeObserver)
- [ ] **INFRA-03**: Theme system (CSS Variables, 3 themes, theme adapter for mviz)
- [ ] **INFRA-04**: Shared types and utilities

- [ ] **MVIZ-01**: Bar chart bridge (grouped, stacked, horizontal)
- [ ] **MVIZ-02**: Line chart bridge (multi-series, smooth)
- [ ] **MVIZ-03**: Area chart bridge (stacked area)
- [ ] **MVIZ-04**: Pie/Donut chart bridge
- [ ] **MVIZ-05**: Scatter chart bridge
- [ ] **MVIZ-06**: Bubble chart bridge
- [ ] **MVIZ-07**: Boxplot bridge
- [ ] **MVIZ-08**: Histogram bridge
- [ ] **MVIZ-09**: Waterfall chart bridge
- [ ] **MVIZ-10**: XMR control chart bridge
- [ ] **MVIZ-11**: Sankey diagram bridge
- [ ] **MVIZ-12**: Funnel chart bridge
- [ ] **MVIZ-13**: Heatmap bridge
- [ ] **MVIZ-14**: Calendar heatmap bridge
- [ ] **MVIZ-15**: Sparkline bridge
- [ ] **MVIZ-16**: Combo chart bridge
- [ ] **MVIZ-17**: Dumbbell chart bridge
- [ ] **MVIZ-18**: Mermaid diagram bridge
- [ ] **MVIZ-19**: Big Value UI component bridge
- [ ] **MVIZ-20**: Delta UI component bridge
- [ ] **MVIZ-21**: Alert UI component bridge
- [ ] **MVIZ-22**: Note UI component bridge
- [ ] **MVIZ-23**: Text UI component bridge
- [ ] **MVIZ-24**: Table UI component bridge

- [ ] **REG-01**: Full catalog registration (defineCatalog with 35 Zod schemas)
- [ ] **REG-02**: Full registry registration (defineRegistry with 35 React components)

### Phase 2: Business Components

- [ ] **BIZ-01**: Kanban board — multi-column swim lanes, drag-and-drop cards, card tags/assignee
- [ ] **BIZ-02**: Gantt chart — task bars, date axis, dependencies, pan/zoom
- [ ] **BIZ-03**: Org chart — tree layout, expand/collapse nodes, connecting lines
- [ ] **BIZ-04**: Timeline — vertical event flow with date markers
- [ ] **BIZ-05**: KPI dashboard — multi-metric cards with sparklines
- [ ] **BIZ-06**: Budget report — budget/actual/variance table with color coding
- [ ] **BIZ-07**: Feature table — product comparison matrix with checkmarks
- [ ] **BIZ-08**: Audit log — operation record with timestamp, user, action
- [ ] **BIZ-09**: JSON viewer — syntax-highlighted collapsible JSON
- [ ] **BIZ-10**: Code block — multi-language syntax highlighting
- [ ] **BIZ-11**: Form view — structured key-value data display

### Phase 3: Publishing

- [ ] **PUB-01**: SKILL.md for Claude Code Skill (35 component types documented)
- [ ] **PUB-02**: npm package publish (ai-render-kit)
- [ ] **PUB-03**: Demo page showing all 35 components
- [ ] **PUB-04**: Documentation (README with usage examples)

## v2 Requirements

- **Dashboard Layout**: Multi-component grid composition
- **Geo Map**: Geographic data visualization
- **Vue/Svelte components**: Framework-agnostic output
- **MCP Server**: MCP tool for visualization

## Out of Scope

| Feature | Reason |
|---------|--------|
| Chart.js rendering | Replaced by ECharts via mviz |
| BI/database connectivity | Not a BI platform |
| Generic UI components | json-render/shadcn covers this |
| Real-time streaming | json-render has built-in support |
| PDF/image export | Separate json-render packages handle this |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VAL-01 | Phase 0 | Pending |
| VAL-02 | Phase 0 | Pending |
| VAL-03 | Phase 0 | Pending |
| VAL-04 | Phase 0 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| MVIZ-01 ~ MVIZ-24 | Phase 1 | Pending |
| REG-01 | Phase 1 | Pending |
| REG-02 | Phase 1 | Pending |
| BIZ-01 ~ BIZ-11 | Phase 2 | Pending |
| PUB-01 ~ PUB-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after initial definition*
