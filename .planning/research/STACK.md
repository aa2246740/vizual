# Stack Research: AI RenderKit

**Researched:** 2026-04-15
**Confidence:** High (direct source code analysis + API verification)

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
```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "zod": "^4.0.0",
  "echarts": "^5.5.0",
  "mviz": "^1.6.4"
}
```

### Peer Dependencies
```json
{
  "json-render": ">=0.16.0",
  "@json-render/core": ">=0.16.0",
  "@json-render/react": ">=0.16.0"
}
```

### Remove These
```json
{
  "chart.js": "REMOVED — replaced by ECharts",
  "chartjs-chart-funnel": "REMOVED",
  "chartjs-plugin-datalabels": "REMOVED"
}
```

## ECharts Bundle Size Strategy

- **Full bundle**: ~800KB (unacceptable)
- **Minimal bundle** (bar, line, pie, scatter): ~250KB
- **Strategy**: Use ECharts CDN in browser (like mviz does) or tree-shake with `echarts/charts` imports
- **mviz approach**: Loads ECharts from CDN (`cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js`) in generated HTML
- **Our approach**: Same CDN strategy for browser; for npm package, re-export ECharts as peer dependency

## json-render Integration Pattern

```typescript
// catalog.ts
import { defineCatalog } from "@json-render/core"
import { schema } from "@json-render/react/schema"
import { z } from "zod"

export const renderKitCatalog = defineCatalog(schema, {
  components: {
    BarChart: {
      props: z.object({ title: z.string().nullable(), x: z.string(), y: z.union([z.string(), z.array(z.string())]), data: z.array(z.record(z.any())) }),
      description: "Bar chart visualization"
    },
    Kanban: {
      props: z.object({ columns: z.array(/* ... */) }),
      description: "Draggable kanban board"
    },
    // ... 33 more
  },
  actions: {}
})

// registry.tsx
import { defineRegistry } from "@json-render/react"
export const { registry } = defineRegistry(renderKitCatalog, {
  components: {
    BarChart: BarChartComponent,
    Kanban: KanbanComponent,
    // ...
  }
})
```

## Confidence Levels

| Decision | Confidence | Risk |
|----------|-----------|------|
| React 18+ | 95% | json-render requires it |
| Zod v4 | 90% | json-render 0.16 confirmed using v4 |
| ECharts 5.5+ | 95% | mviz uses it; industry standard |
| mviz as dependency | 80% | Internal API not officially documented; may break on major update |
| json-render 0.16 | 70% | Pre-1.0; API may change; need version pinning |
