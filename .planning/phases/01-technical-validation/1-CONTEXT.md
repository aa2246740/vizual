# Phase 1: Technical Validation - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate the architecture end-to-end before committing to full implementation:
1. mviz programmatic API (buildBarOptions etc.) callable and returns valid ECharts option
2. json-render catalog registration (defineCatalog + defineRegistry) works
3. End-to-end: 1 mviz chart + 1 custom component render through json-render
4. Zod v4 schemas validate AI-generated JSON correctly

This is a proof-of-concept phase. No production code needed — just working demos that prove the architecture.
</domain>

<decisions>
## Implementation Decisions

### mviz API Integration
- **D-01:** Call mviz's compiled JS functions directly from dist/ (e.g., `import { buildBarOptions } from 'mviz/dist/charts/bar.js'`)
- **D-02:** Pin mviz to exact version 1.6.4 to prevent internal API breakage
- **D-03:** Create an adapter layer (mviz-bridge) so React components never call mviz directly — isolates us from mviz API changes

### json-render Integration
- **D-04:** Use `defineCatalog` from `@json-render/core` with `schema` from `@json-render/react/schema`
- **D-05:** Use `defineRegistry` from `@json-render/react` for React component registration
- **D-06:** Pin json-render to exact version 0.16.0 (pre-1.0, API may change)
- **D-07:** Zod v4 required (json-render 0.16 uses v4, not v3)

### ECharts in React
- **D-08:** Standard useRef + useEffect pattern for ECharts initialization
- **D-09:** Always dispose chart in useEffect cleanup
- **D-10:** Use ResizeObserver (not window resize event) for responsive charts

### Validation Scope
- **D-11:** Validate with BarChart (from mviz) — simplest chart type
- **D-12:** Validate with Timeline (custom) — simplest business component
- **D-13:** Create a minimal HTML demo page that loads json-render + our catalog and renders both components

### Claude's Discretion
- Exact project structure (can be flat for validation)
- Test framework setup details
- Demo page styling
- Error handling patterns for validation code
</decisions>

<specifics>
## Specific Ideas

- mviz source code already analyzed at `/tmp/mviz-inspect/package/dist/` — buildBarOptions confirmed to accept `{ type, title, x, y, data, theme }` and return ECharts option object
- json-render API confirmed: catalog.ts + registry.tsx + renderer.tsx three-file pattern
- The existing `src/schemas/` code (16 types, Chart.js based) should NOT be used — this is a clean validation from scratch
</specifics>

<canonical_refs>
## Canonical References

### mviz Integration
- `.planning/research/STACK.md` — mviz version pinning strategy, ECharts bundle approach
- `.planning/research/PITFALLS.md` — PITFALL-02 (mviz internal API instability), PITFALL-04 (Zod v3/v4)

### json-render Integration
- `.planning/research/ARCHITECTURE.md` — defineCatalog + defineRegistry + Renderer pattern
- `PRD-v2.md` — Section 四 (每个组件的集成模式) with code examples

### Existing Codebase
- `src/schemas/` — Reference for schema structure (do NOT reuse, just understand patterns)
- `src/core/theme-colors.ts` — Theme system (tc() utility) to be adapted for React

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/core/theme-colors.ts`: tc() utility for theme-aware color resolution — can be adapted for React context
- `src/core/types.ts`: TypeScript type definitions — patterns inform new type design
- Test patterns in `src/schemas/*/` — 469 tests inform testing approach

### Established Patterns
- Each schema has parser.ts + renderer.ts + schema.json + index.ts — new structure is schema.ts + component.tsx
- Chart.js rendering via canvas — being replaced by ECharts
- Theme via CSS Variables (--rk-*) — can be reused directly

### Integration Points
- New code is GREENFIELD — doesn't integrate with existing src/schemas/
- package.json needs complete rewrite (remove chart.js, add react/echarts/mviz/json-render)
- tsconfig.json needs React JSX support added

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope
</deferred>

---
*Phase: 01-technical-validation*
*Context gathered: 2026-04-15*
