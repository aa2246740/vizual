# Architecture Research: AI RenderKit

**Researched:** 2026-04-15

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      AI Layer                             │
│  Claude / GPT / Agent outputs JSON matching Zod Schema   │
└────────────────────────┬────────────────────────────────┘
                         │ JSON spec
┌────────────────────────▼────────────────────────────────┐
│               json-render Platform                        │
│                                                           │
│  catalog.prompt()  → AI system prompt                    │
│  catalog.validate() → runtime validation                  │
│  <Renderer spec={} registry={} /> → React tree           │
│  StateProvider + VisibilityProvider + ActionProvider      │
└────────────────────────┬────────────────────────────────┘
                         │ component lookup
┌────────────────────────▼────────────────────────────────┐
│            RenderKit Catalog (registry)                   │
│                                                           │
│  ┌──────────────────────┐ ┌──────────────────────────┐  │
│  │  mviz Bridge (24)     │ │  Custom Business (11)    │  │
│  │                       │ │                           │  │
│  │  Shared ECharts       │ │  Shared Theme System      │  │
│  │  React Component      │ │  React Components          │  │
│  │  Wrapper              │ │  (SVG + CSS)               │  │
│  └──────────────────────┘ └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Layer 1: Core Infrastructure
- **themes.ts**: CSS Variables (--rk-*), theme definitions, color resolution
- **echarts-lazy.ts**: ECharts lazy loading + CDN fallback
- **types.ts**: Shared TypeScript types

### Layer 2: mviz Bridge (24 components)
Each chart component follows the same pattern:
```
mviz-bridge/[chart-type]/
  schema.ts        → Zod schema matching mviz spec format
  component.tsx    → React component wrapping ECharts
```

**Shared wrapper pattern:**
```typescript
function EChartsWrapper({ option, height }: { option: Record<string, any>, height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const chart = echarts.init(ref.current!)
    chart.setOption(option)
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { chart.dispose(); window.removeEventListener('resize', onResize) }
  }, [option])
  return <div ref={ref} style={{ width: '100%', height: height ?? 300 }} />
}
```

Each mviz bridge component:
1. Receives props matching mviz JSON spec
2. Calls mviz's `buildXxxOptions(props)` to get ECharts option
3. Passes option to `<EChartsWrapper>`
4. Handles theme mapping (our themes → mviz theme colors)

### Layer 3: Business Components (11 components)
Each follows:
```
components/[type]/
  schema.ts        → Zod schema for component props
  component.tsx    → React component (SVG or DOM)
```

No shared wrapper needed — each is a standard React component.

### Layer 4: Catalog Assembly
```
catalog.ts    → defineCatalog with all 35 Zod schemas
registry.tsx  → defineRegistry with all 35 React components
index.ts      → exports catalog + registry + individual components
```

## Data Flow

```
AI Output (JSON)
  → json-render validates against catalog.zodSchema()
  → Renderer looks up registry[componentType]
  → React component receives props
  → mviz bridge: props → buildXxxOptions() → ECharts option → echarts.setOption()
  → business: props → React rendering (SVG/DOM)
  → User sees interactive visualization
```

## Suggested Build Order

1. **Core infrastructure first** (themes, ECharts wrapper, types)
2. **One mviz bridge component** as proof of concept (bar chart)
3. **One business component** as proof of concept (kanban)
4. **json-render catalog registration** for those 2 components
5. **Validate end-to-end**: AI JSON → json-render → rendered component
6. **Scale up**: Remaining mviz bridge components (batch)
7. **Scale up**: Remaining business components (batch)
8. **Polish**: Themes, tests, documentation, SKILL.md

## Existing Code Migration

The existing `src/schemas/` code (16 types, Chart.js based) will be:
- **Discarded** for chart types (replaced by mviz bridge)
- **Rewritten as React** for business types (kanban, gantt, org-chart, etc.)
- **Theme system preserved** (tc() utility, CSS Variables) — adapts to React context

Existing test patterns (469 tests) inform the new test structure but need rewriting for React Testing Library.
