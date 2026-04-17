# Roadmap: Vizual

**Created:** 2026-04-15
**Granularity:** Coarse
**Total Requirements (v2.0):** 24

---

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-04-15)
- 🚧 **v2.0 DocView Native Integration** - Phases 5-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED 2026-04-15</summary>

### Phase 1: Technical Validation
**Goal:** Prove the architecture works end-to-end before committing to full implementation.
**Plans:** 1 plan

Plans:
- [x] 01-01: Technical validation POC

### Phase 2: Core Infrastructure + mviz Bridge
**Goal:** Build shared infrastructure and bridge all 24 mviz components as React components with Zod schemas.
**Plans:** 1 plan

Plans:
- [x] 02-01: Core infrastructure and mviz bridge

### Phase 3: Business Components
**Goal:** Implement all 11 custom business components as React components with Zod schemas.
**Plans:** 1 plan

Plans:
- [x] 03-01: Business components batch

### Phase 4: Publishing & Distribution
**Goal:** Package and publish as Claude Code Skill, npm package, and create demo/documentation.
**Plans:** 1 plan

Plans:
- [x] 04-01: Publishing and distribution

</details>

### 🚧 v2.0 DocView Native Integration (In Progress)

**Milestone Goal:** Merge DocView from standalone package into vizual core. AI outputs DocView JSON spec, users annotate the rendered document, annotations feed back to AI for revision.

- [x] **Phase 5: Migration & Registration** - Merge DocView source, fix tech debt, register in catalog/registry
- [ ] **Phase 6: Annotation System** - Full annotation UX: text selection, highlights, multi-granularity, panel, lifecycle, hooks
- [ ] **Phase 7: AI Revision Loop & Distribution** - Close the AI revision loop, update builds, AI prompts, and docs

## Phase Details

### Phase 5: Migration & Registration
**Goal:** DocView exists inside vizual as a first-class component. AI can output a DocView JSON spec and the Renderer renders it -- no separate package needed.
**Depends on:** Phase 4 (v1.0 shipped)
**Requirements:** MIGR-01, MIGR-02, MIGR-03, MIGR-04, CATL-01, CATL-02, CATL-03, CATL-04, BLD-01
**Success Criteria** (what must be TRUE):
  1. DocView source code lives in src/docview/ and compiles without errors
  2. AI can output a DocView JSON spec and the Renderer renders the document (text sections + embedded components)
  3. `catalog.prompt()` includes DocView in its generated AI system prompt
  4. No require() calls remain -- all imports are static ES imports
  5. extractText() correctly handles complex React trees (nested elements, fragments)
**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Merge source files with tech debt fixes, create Zod schema, add react-highlight-words dependency
- [x] 05-02-PLAN.md — Register DocView in catalog/registry, export from index.ts and cdn-entry.ts, fix CDN drift, verify build

### Phase 6: Annotation System
**Goal:** Users can annotate any part of a DocView document -- text, charts, KPIs, table cells -- with full lifecycle management and hooks for programmatic control.
**Depends on:** Phase 5
**Requirements:** ANNO-01, ANNO-02, ANNO-03, ANNO-04, ANNO-05, ANNO-06, HOOK-01, HOOK-02, HOOK-03, HOOK-04
**Success Criteria** (what must be TRUE):
  1. User can select text in a document and add an annotation (note + color choice) via popup
  2. Annotations render as colored highlights on the document text (AnnotationOverlay)
  3. User can click a chart data point, KPI card, or table cell to annotate it
  4. AnnotationPanel sidebar shows all annotations with color, status, timestamp, and action buttons
  5. Annotations follow the lifecycle: draft -> active -> resolved/orphaned, with batch submit for drafts
  6. All 4 hooks (useAnnotations, useTextSelection, useVersionHistory, + controlled/uncontrolled modes) are exported and functional
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — Section renderer, multi-granularity annotations (ANNO-01, ANNO-02, ANNO-03)
- [ ] 06-02-PLAN.md — Annotation panel lifecycle, hooks exports, build verification (ANNO-04, ANNO-05, ANNO-06, HOOK-01, HOOK-02, HOOK-03, HOOK-04)

### Phase 7: AI Revision Loop & Distribution
**Goal:** The annotation-to-AI-to-revised-document loop works end-to-end. All build artifacts include DocView. AI prompts and documentation are updated.
**Depends on:** Phase 6
**Requirements:** REV-01, REV-02, REV-03, BLD-02, BLD-03, AIPR-01, AIPR-02, VAL-01, VAL-02
**Success Criteria** (what must be TRUE):
  1. Submitting annotations triggers an onAction callback that an AI agent can consume to revise the document
  2. When AI returns updated content, orphaned annotations (whose text was changed) are automatically detected and marked
  3. useRevisionLoop hook is exported and integrates submitAllDrafts, requestRevision, and onContentRevised
  4. All 4 build formats (ESM, CJS, CDN, Standalone) include DocView and all hooks; cdn-entry drift is fixed
  5. demo-docview.html loads from vizual CDN build and demonstrates full annotation + revision flow
  6. README.md and COMPONENTS.md document DocView usage and annotation features
**Plans:** TBD

Plans:
- [ ] 07-01: AI revision loop integration
- [ ] 07-02: Build exports, AI prompts, and documentation

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Technical Validation | v1.0 | 1/1 | Complete | 2026-04-15 |
| 2. Core Infrastructure + mviz Bridge | v1.0 | 1/1 | Complete | 2026-04-15 |
| 3. Business Components | v1.0 | 1/1 | Complete | 2026-04-15 |
| 4. Publishing & Distribution | v1.0 | 1/1 | Complete | 2026-04-15 |
| 5. Migration & Registration | v2.0 | 2/2 | Complete | 2026-04-17 |
| 6. Annotation System | v2.0 | 0/2 | Not started | - |
| 7. AI Revision Loop & Distribution | v2.0 | 0/2 | Not started | - |
