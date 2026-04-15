# Research Summary: AI RenderKit

**Synthesized:** 2026-04-15

## Stack (Key Decisions)

| Decision | Choice | Why |
|----------|--------|-----|
| UI Framework | React 18+ | json-render requires it |
| Schema | Zod v4 | json-render 0.16 uses v4, not v3 |
| Charts | ECharts 5.5+ via mviz | mviz provides buildXxxOptions(); don't rewrite |
| Platform | json-render 0.16.0 | defineCatalog + defineRegistry pattern |
| Build | esbuild | Already working |
| Remove | Chart.js | Replaced by ECharts |

**Critical**: Pin exact versions for json-render (0.16.0) and mviz (1.6.4) — both are unstable APIs.

## Table Stakes Features

**Must have (35 components):**
- 24 mviz components: 17 charts + 1 mermaid + 6 UI (bar, line, area, pie, scatter, bubble, boxplot, histogram, waterfall, xmr, sankey, funnel, heatmap, calendar, sparkline, combo, dumbbell, mermaid, big_value, delta, alert, note, text, table)
- 11 business components: kanban, gantt, org-chart, timeline, kpi-dashboard, budget-report, feature-table, audit-log, json-viewer, code-block, form-view
- 3 themes (Default Dark, Linear, Vercel)
- json-render catalog registration (defineCatalog + defineRegistry)

**Highest complexity**: Kanban (drag-and-drop), Gantt chart (SVG + pan/zoom)

## Architecture Summary

```
AI JSON → json-render Renderer → registry lookup → React component
  ├── mviz bridge: props → buildXxxOptions() → ECharts
  └── business: props → React (SVG/DOM)
```

**Build order**: Core infra → 1 mviz bridge POC → 1 business POC → validate E2E → scale up both batches → polish

## Watch Out For

| Risk | Severity | Mitigation |
|------|----------|------------|
| json-render API changes | HIGH | Pin 0.16.0 exact, abstract behind wrapper |
| mviz internal API breaks | HIGH | Pin 1.6.4 exact, adapter layer |
| ECharts memory leaks | MEDIUM | Proper dispose in useEffect cleanup |
| Zod v3/v4 mismatch | MEDIUM | Use v4 only, test validation |
| Theme conflict | MEDIUM | Map our CSS vars → mviz theme colors |
| Bundle size | MEDIUM | ECharts/mviz as peer deps, CDN for browser |
