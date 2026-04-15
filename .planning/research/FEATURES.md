# Features Research: AI RenderKit

**Researched:** 2026-04-15

## Table Stakes (Must Have)

### json-render Catalog Integration
- **CATALOG-01**: defineCatalog registration with Zod schemas for all 35 components
- **CATALOG-02**: defineRegistry with React component implementations
- **CATALOG-03**: AI prompt generation (catalog.prompt()) produces correct system prompts
- **CATALOG-04**: Runtime validation (catalog.validate()) works for all schemas

### mviz Chart Bridge (24 components)
- **CHART-01**: Bar chart (grouped, stacked, horizontal) via mviz buildBarOptions
- **CHART-02**: Line chart (multi-series, smooth) via mviz buildLineOptions
- **CHART-03**: Area chart (stacked area) via mviz buildAreaOptions
- **CHART-04**: Pie/Donut chart via mviz buildPieOptions
- **CHART-05**: Scatter chart via mviz buildScatterOptions
- **CHART-06**: Bubble chart via mviz buildBubbleOptions
- **CHART-07**: Boxplot via mviz buildBoxplotOptions
- **CHART-08**: Histogram via mviz buildHistogramOptions
- **CHART-09**: Waterfall chart via mviz buildWaterfallOptions
- **CHART-10**: XMR control chart via mviz buildXmrOptions
- **CHART-11**: Sankey diagram via mviz buildSankeyOptions
- **CHART-12**: Funnel chart via mviz buildFunnelOptions
- **CHART-13**: Heatmap via mviz buildHeatmapOptions
- **CHART-14**: Calendar heatmap via mviz buildCalendarOptions
- **CHART-15**: Sparkline via mviz buildSparklineOptions
- **CHART-16**: Combo chart via mviz buildComboOptions
- **CHART-17**: Dumbbell chart via mviz buildDumbbellOptions
- **CHART-18**: Mermaid diagram via mviz buildMermaidOptions
- **UI-01**: Big Value component via mviz
- **UI-02**: Delta component via mviz
- **UI-03**: Alert component via mviz
- **UI-04**: Note component via mviz
- **UI-05**: Text component via mviz
- **UI-06**: Table component via mviz

### Business Components (11 custom)
- **BIZ-01**: Kanban board — multi-column swim lanes with drag-and-drop cards
- **BIZ-02**: Gantt chart — task timeline with dependencies, pan/zoom
- **BIZ-03**: Org chart — tree hierarchy with expand/collapse
- **BIZ-04**: Timeline — vertical/horizontal event flow
- **BIZ-05**: KPI dashboard — multi-metric card layout
- **BIZ-06**: Budget report — budget/actual/variance with color coding
- **BIZ-07**: Feature table — product comparison matrix
- **BIZ-08**: Audit log — operation record timeline
- **BIZ-09**: JSON viewer — syntax-highlighted JSON display
- **BIZ-10**: Code block — multi-language code highlighting
- **BIZ-11**: Form view — structured data form display

### Theme System
- **THEME-01**: 3 built-in themes (Default Dark, Linear, Vercel)
- **THEME-02**: Custom theme via CSS Variables
- **THEME-03**: All components respond to theme changes

## Differentiators (Competitive Advantage)

- **DIFF-01**: Largest json-render visualization catalog (35 components vs 0 in any existing catalog)
- **DIFF-02**: Only catalog with business components (kanban, gantt, org-chart)
- **DIFF-03**: Claude Code Skill integration (SKILL.md for AI-driven visualization)
- **DIFF-04**: ECharts via mviz gives 17 chart types no other catalog has
- **DIFF-05**: Dual output: standalone React components + json-render catalog

## Anti-Features (Deliberately NOT Building)

| Feature | Reason |
|---------|--------|
| Chart.js rendering | Replaced by ECharts; no reason for dual engines |
| BI/database connectivity | Not a BI platform; AI provides the data |
| Generic UI components | json-render/shadcn already has 36 components |
| Vue/Svelte renderers | json-render handles framework switching; we focus on React |
| Real-time data streaming | json-render has built-in streaming; not our concern |
| PDF/image export | json-render/react-pdf exists separately |
| Geographic maps | High complexity; defer to v2 |
| Dashboard layout | Complex composition; defer to v2 |

## Complexity Estimates

| Component | Complexity | Dependencies |
|-----------|-----------|--------------|
| mviz bridge (per chart) | Low | mviz API, ECharts, React useRef |
| Kanban | High | Drag-and-drop, multi-column state |
| Gantt chart | High | SVG rendering, pan/zoom, date math |
| Org chart | Medium | Tree layout, expand/collapse, SVG |
| Timeline | Low | CSS layout, data mapping |
| KPI dashboard | Low | Card grid, number formatting |
| Budget report | Medium | Table rendering, variance coloring |
| Feature table | Low | Matrix grid, icons |
| Audit log | Low | Timeline + table hybrid |
| JSON viewer | Low | Syntax highlighting |
| Code block | Low | Prism.js or similar |
| Form view | Medium | Dynamic form rendering |
