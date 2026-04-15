# Pitfalls Research: AI RenderKit

**Researched:** 2026-04-15

## Critical Pitfalls

### PITFALL-01: json-render v0.16 API Breaking Changes
**Risk**: HIGH
**Warning signs**: Import paths change, defineCatalog signature changes, Zod version mismatch
**Prevention**:
- Pin exact version: `"@json-render/core": "0.16.0"` (not `^0.16.0`)
- Abstract json-render API behind our own thin wrapper
- Write integration tests that catch API breakage
**Phase**: Phase 0 (validation)

### PITFALL-02: mviz Internal API Instability
**Risk**: HIGH
**Warning signs**: `buildBarOptions` function signature changes, export paths change
**Prevention**:
- mviz's dist/ files are compiled JS — they CAN change between versions
- Pin mviz exact version: `"mviz": "1.6.4"` (not `^1.6.4`)
- Consider copying mviz's chart compilation logic (it's ~3000 lines total) as fallback
- Write adapter layer, don't call mviz functions directly from React components
**Phase**: Phase 0 (validation)

### PITFALL-03: ECharts + React Lifecycle Issues
**Risk**: MEDIUM
**Warning signs**: Memory leaks, charts not resizing, stale chart instances after re-render
**Prevention**:
- Always dispose chart in useEffect cleanup
- Use ResizeObserver instead of window resize event
- Never create chart instance in render phase (only in useEffect)
- Handle container unmount gracefully
**Phase**: Phase 1 (infrastructure)

### PITFALL-04: Zod v3 vs v4 Incompatibility
**Risk**: MEDIUM
**Warning signs**: Schema validation silently fails, `.optional()` behaves differently
**Prevention**:
- Use Zod v4 ONLY (matching json-render)
- Don't import from 'zod' v3 anywhere
- Test that catalog.validate() actually catches invalid specs
**Phase**: Phase 0 (validation)

### PITFALL-05: Theme System Conflict (mviz vs RenderKit)
**Risk**: MEDIUM
**Warning signs**: Charts render with wrong colors in dark mode, inconsistent styling
**Prevention**:
- mviz uses its own "mdsinabox" theme colors; we need to map our themes to mviz colors
- Create a theme adapter: our CSS variables → mviz theme options
- Test all 3 themes with all chart types
**Phase**: Phase 1 (infrastructure)

### PITFALL-06: Bundle Size Explosion
**Risk**: MEDIUM
**Warning signs**: npm package > 1MB, slow initial load
**Prevention**:
- ECharts as external/peer dependency (don't bundle it)
- mviz is also external (consumers install it)
- Our package should be < 200KB (just React components + Zod schemas)
- Use ECharts CDN for browser usage
**Phase**: Phase 1 (build setup)

### PITFALL-07: Drag-and-Drop in Kanban Component
**Risk**: LOW-MEDIUM
**Warning signs**: Janky drag behavior, mobile touch issues, state desync
**Prevention**:
- Use @dnd-kit/core (modern, React-native, accessible)
- Don't implement custom DnD from scratch
- Test on touch devices
**Phase**: Phase 2 (business components)

### PITFALL-08: SVG Rendering Performance (Gantt/Org Chart)
**Risk**: LOW
**Warning signs**: Sluggish pan/zoom with many nodes, browser tab freezes
**Prevention**:
- Virtualize large trees (only render visible nodes)
- Use CSS transforms for pan/zoom (GPU accelerated)
- Limit initial render to top 2-3 levels, expand on demand
**Phase**: Phase 2 (business components)

## Phase Mapping Summary

| Pitfall | Phase to Address | Validation Method |
|---------|-----------------|-------------------|
| json-render API | Phase 0 | Integration test with real json-render |
| mviz internal API | Phase 0 | Call buildBarOptions successfully |
| ECharts lifecycle | Phase 1 | Memory leak test, resize test |
| Zod v4 compat | Phase 0 | Schema validation test |
| Theme conflict | Phase 1 | Visual regression test |
| Bundle size | Phase 1 | Bundle size CI check |
| DnD issues | Phase 2 | Manual QA on touch device |
| SVG perf | Phase 2 | Performance benchmark |
