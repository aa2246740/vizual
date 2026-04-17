# Requirements: Vizual v1.1 Interactive

**Defined:** 2026-04-16
**Core Value:** AI outputs structured JSON → Vizual renders interactive components → user interacts → data flows back to AI

## v1.1 Requirements

### Bug Fix (Prerequisite)

- [ ] **BUG-01**: Fix double-wrapper anti-pattern in all 18 affected components (Kanban, BigValue, DataTable, FormView, and 14 others) — change `return (props) =>` to `({ props, bindings })` pattern

### Interactive Input Components

- [ ] **INP-01**: InputText component — text input with placeholder, label, disabled state, bidirectional binding via useBoundProp
- [ ] **INP-02**: InputSelect component — dropdown select with options array, placeholder, searchable mode, bidirectional binding
- [ ] **INP-03**: InputFile component — file upload with drag-and-drop, click-to-browse, accept filter, file size display, state stores FileList or base64
- [ ] **INP-04**: FormBuilder component — meta-component that dynamically renders InputText/InputSelect/InputFile based on fields schema, supports field grouping and layout
- [ ] **INP-05**: Cascading field dependencies — FormBuilder fields can depend on other fields via json-render watch (e.g. select country → load cities)
- [ ] **INP-06**: Form validation visualization — ValidationProvider integration with 13 built-in validators, real-time error display, validateOn: change|blur|submit modes

### Catalog & Registry Actions

- [ ] **ACT-01**: Add catalog actions — submitForm, requestRevision, batchSubmit action definitions in catalog.ts
- [ ] **ACT-02**: Register action handlers in registry.tsx — handlers must be atomic with catalog changes (TypeScript conditional type enforces this)
- [ ] **ACT-03**: Update catalog.prompt() to include 4 new input components + action documentation

### DocView: Core Annotation

- [ ] **DOC-01**: DocView container component — wraps vizual Renderer, renders all 37+4 components as children in vertical layout
- [ ] **DOC-02**: Text selection detection — browser Selection API + selectionchange event, detect selection within DocView container, exclude button/chart clicks
- [ ] **DOC-03**: Annotation highlight rendering — react-highlight-words for rendering yellow highlights on annotated text ranges
- [ ] **DOC-04**: Annotation data model — content-based (not offset-based) annotation storage with: id, elementId, selectedText, comment, status, timestamps
- [ ] **DOC-05**: Annotation input popup — floating card appears on text selection with comment input field, submit/cancel buttons
- [ ] **DOC-06**: Annotation panel — right-side panel listing all annotations with status, selected text excerpt, comment, click-to-scroll
- [ ] **DOC-07**: Orphaned annotation detection — when AI revision changes content, detect annotations whose selectedText no longer matches, mark as orphaned

### DocView: AI Revision Loop

- [ ] **REV-01**: Batch annotation submission — "Submit All" button sends all pending annotations + current spec to AI via ActionBinding
- [ ] **REV-02**: AI revision handler — onSpecUpdate callback receives new spec from AI, triggers document refresh
- [ ] **REV-03**: Annotation status lifecycle — draft → pending → applied → confirmed/dismissed, with per-annotation AI response text
- [ ] **REV-04**: Preview mode — after AI returns new spec, show preview (accept/reject) before applying, with diff highlighting on changed sections

### DocView: Version Management

- [ ] **VER-01**: Version snapshots — save full spec + annotations snapshot on each AI revision, append-only storage
- [ ] **VER-02**: Version rollback — restore any previous snapshot, orphaned annotations re-detected after rollback
- [ ] **VER-03**: Version history panel — list of snapshots with timestamp, annotation count, AI response summary

### @vizual/docview Package

- [ ] **PKG-01**: Separate npm package @vizual/docview with vizual as peerDependency
- [ ] **PKG-02**: Package build — esbuild IIFE (CDN) + ESM + CJS, with vizual as external
- [ ] **PKG-03**: Package exports — DocView, AnnotationOverlay, AnnotationPanel, useAnnotations hook

### Distribution & Testing

- [ ] **DIST-01**: Update AI Skill (skill/prompt.md) with 41 component catalog including input components
- [ ] **DIST-02**: Update AI Skill references/component-catalog.md with input component schemas
- [ ] **DIST-03**: Validation demo page — interactive form demo + DocView annotation demo
- [ ] **DIST-04**: User testing — complete workflow test: AI generates form → user fills → data returns; AI generates report → user annotates → AI revises

## v2 Requirements (Deferred)

- **Chart data point annotation** — hover on ECharts data point → annotate, requires ECharts instance access
- **FormBuilder multi-step wizard** — step-by-step form with progress indicator
- **Multi-user collaboration** — real-time annotation sync, @mentions
- **Permission system** — who can annotate, who can view
- **Offline support** — annotation local cache, sync on reconnect
- **Rich text / Markdown component** — HTML rendering block for long-form content

## Out of Scope

| Feature | Reason |
|---------|--------|
| Long-form infographic rendering | Content production pipeline, not a rendering library concern |
| Screenshot / image export / LANCZOS upscale | Separate delivery pipeline, not visualization |
| Vue/Svelte component output | v2+ consideration |
| BI/database connectivity | Not a BI platform |
| Generic UI components (buttons/dialogs) | json-render/shadcn covers this |
| PDF generation | Separate json-render packages handle this |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 5 | Pending |
| INP-01 | Phase 6 | Pending |
| INP-02 | Phase 6 | Pending |
| INP-03 | Phase 6 | Pending |
| INP-04 | Phase 7 | Pending |
| INP-05 | Phase 7 | Pending |
| INP-06 | Phase 7 | Pending |
| ACT-01 | Phase 8 | Pending |
| ACT-02 | Phase 8 | Pending |
| ACT-03 | Phase 8 | Pending |
| DOC-01 | Phase 9 | Pending |
| DOC-02 | Phase 9 | Pending |
| DOC-03 | Phase 9 | Pending |
| DOC-04 | Phase 9 | Pending |
| DOC-05 | Phase 9 | Pending |
| DOC-06 | Phase 9 | Pending |
| DOC-07 | Phase 9 | Pending |
| REV-01 | Phase 10 | Pending |
| REV-02 | Phase 10 | Pending |
| REV-03 | Phase 10 | Pending |
| REV-04 | Phase 10 | Pending |
| VER-01 | Phase 11 | Pending |
| VER-02 | Phase 11 | Pending |
| VER-03 | Phase 11 | Pending |
| PKG-01 | Phase 12 | Pending |
| PKG-02 | Phase 12 | Pending |
| PKG-03 | Phase 12 | Pending |
| DIST-01 | Phase 13 | Pending |
| DIST-02 | Phase 13 | Pending |
| DIST-03 | Phase 13 | Pending |
| DIST-04 | Phase 13 | Pending |

**Coverage:**
- v1.1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after v1.1 milestone definition*
