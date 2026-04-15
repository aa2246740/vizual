# Phase 1: Technical Validation — Execution Plan

**Phase:** 01-technical-validation
**Created:** 2026-04-15
**Status:** Ready to execute

## Goal

Prove the architecture works end-to-end: mviz API callable → json-render catalog registers → components render.

## Success Criteria

1. `buildBarOptions()` from mviz returns valid ECharts option
2. `defineCatalog` + `defineRegistry` produces working json-render catalog
3. Demo shows: BarChart + Timeline rendered through json-render
4. Zod v4 schema validates AI JSON (accepts valid, rejects invalid)

---

## Plan 1: Environment Setup & mviz API Validation

### Tasks

- **T1.1**: Create new project structure
  ```
  mkdir -p src/{mviz-bridge/bar-chart,components/timeline,core}
  mkdir -p validation
  ```
  New clean structure, not touching existing `src/schemas/`.

- **T1.2**: Install dependencies
  ```bash
  npm install react@18 react-dom@18 zod@next echarts@5 mviz@1.6.4
  npm install -D @types/react @types/react-dom vitest jsdom @testing-library/react
  ```
  Note: `zod@next` for v4 (json-render requirement). Pin mviz exact.

- **T1.3**: Update tsconfig.json for React JSX
  Add `"jsx": "react-jsx"`, `"lib": ["ES2020", "DOM"]`

- **T1.4**: Create `src/core/echarts-wrapper.tsx`
  - useRef for container div
  - useEffect: init ECharts, setOption, return cleanup (dispose)
  - ResizeObserver for responsive resize
  - Accept `option: Record<string, any>` and `height?: number` props

- **T1.5**: Validate mviz API — `validation/test-mviz-api.ts`
  ```typescript
  import { buildBarOptions } from 'mviz/dist/charts/bar.js'
  const option = buildBarOptions({
    type: 'bar', x: 'name', y: 'value',
    data: [{name:'A',value:10},{name:'B',value:20}],
    theme: 'light'
  })
  // Verify option has xAxis, yAxis, series, series[0].type === 'bar'
  ```
  Run with `npx tsx validation/test-mviz-api.ts`

- **T1.6**: Validate Zod v4 — `validation/test-zod-v4.ts`
  ```typescript
  import { z } from 'zod'
  const BarChartSchema = z.object({
    type: z.literal('bar'),
    x: z.string(), y: z.string(),
    data: z.array(z.record(z.any()))
  })
  // Test: valid input passes, invalid input fails
  ```

**Verification**: Both validation scripts run without errors.

---

## Plan 2: BarChart Bridge Component

### Tasks

- **T2.1**: Create `src/mviz-bridge/bar-chart/schema.ts`
  Zod v4 schema matching mviz bar chart spec:
  ```typescript
  import { z } from 'zod'
  export const BarChartSchema = z.object({
    type: z.literal('bar'),
    title: z.string().optional(),
    x: z.string(),
    y: z.union([z.string(), z.array(z.string())]),
    data: z.array(z.record(z.any())),
    stacked: z.boolean().optional(),
    horizontal: z.boolean().optional(),
    theme: z.enum(['light', 'dark']).optional(),
  })
  ```

- **T2.2**: Create `src/mviz-bridge/bar-chart/component.tsx`
  React component:
  ```typescript
  import { buildBarOptions } from 'mviz/dist/charts/bar.js'
  import { EChartsWrapper } from '../../core/echarts-wrapper'
  import type { z } from 'zod'
  import { BarChartSchema } from './schema'

  type BarChartProps = z.infer<typeof BarChartSchema>

  export function BarChart(props: BarChartProps) {
    const option = buildBarOptions(props)
    return <EChartsWrapper option={option} height={300} />
  }
  ```

- **T2.3**: Unit test `src/mviz-bridge/bar-chart/component.test.tsx`
  - Render BarChart with sample data
  - Verify canvas element exists
  - Verify ECharts instance created (check for `_echarts_instance_` attribute)

**Verification**: `npm test` passes for BarChart component.

---

## Plan 3: Timeline Custom Component

### Tasks

- **T3.1**: Create `src/components/timeline/schema.ts`
  ```typescript
  import { z } from 'zod'
  export const TimelineSchema = z.object({
    type: z.literal('timeline'),
    title: z.string().optional(),
    events: z.array(z.object({
      date: z.string(),
      title: z.string(),
      description: z.string().optional(),
    }))
  })
  ```

- **T3.2**: Create `src/components/timeline/component.tsx`
  Simple vertical timeline with CSS (no external deps):
  - Vertical line with dots
  - Each event: date label + title + optional description
  - Theme-aware via CSS variables (`var(--rk-bg-primary)` etc.)

- **T3.3**: Unit test for Timeline rendering
  - Renders all events
  - Shows dates and titles

**Verification**: Timeline renders correctly with sample data.

---

## Plan 4: json-render Catalog Integration & E2E Demo

### Tasks

- **T4.1**: Create `src/catalog.ts`
  ```typescript
  import { defineCatalog } from '@json-render/core'
  import { schema } from '@json-render/react/schema'
  import { BarChartSchema } from './mviz-bridge/bar-chart/schema'
  import { TimelineSchema } from './components/timeline/schema'

  export const renderKitCatalog = defineCatalog(schema, {
    components: {
      BarChart: {
        props: BarChartSchema,
        description: 'Bar chart with grouped, stacked, and horizontal variants',
      },
      Timeline: {
        props: TimelineSchema,
        description: 'Vertical timeline of events with dates',
      },
    },
    actions: {},
  })
  ```

- **T4.2**: Create `src/registry.tsx`
  ```typescript
  import { defineRegistry } from '@json-render/react'
  import { renderKitCatalog } from './catalog'
  import { BarChart } from './mviz-bridge/bar-chart/component'
  import { Timeline } from './components/timeline/component'

  export const { registry } = defineRegistry(renderKitCatalog, {
    components: { BarChart, Timeline },
  })
  ```

- **T4.3**: Validate catalog — `validation/test-catalog.ts`
  - `catalog.prompt()` generates system prompt
  - `catalog.validate()` accepts valid spec, rejects invalid
  - `catalog.zodSchema()` returns valid Zod schema

- **T4.4**: Create E2E demo — `validation/demo.html`
  Standalone HTML that:
  1. Loads React + ReactDOM + json-render + ECharts via CDN
  2. Imports our catalog/registry (via script tag or inline)
  3. Renders a BarChart with sample data: `[{"name":"Q1","value":120},{"name":"Q2","value":200}]`
  4. Renders a Timeline with sample events
  5. Shows both components side by side

**Verification**: Open demo.html in browser, see interactive bar chart + timeline.

---

## Dependencies

```
Plan 1 (setup + validation) → Plan 2 (bar chart) → Plan 3 (timeline) → Plan 4 (catalog + demo)
```

Plans 2 and 3 are independent after Plan 1 completes. Plan 4 depends on both.

## Execution Order

1. Plan 1 (setup + mviz/zod validation) — sequential, must pass first
2. Plan 2 + Plan 3 (bar chart + timeline) — PARALLEL
3. Plan 4 (catalog + demo) — after both complete
