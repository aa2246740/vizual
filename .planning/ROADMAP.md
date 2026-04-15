# Roadmap: AI RenderKit

**Created:** 2026-04-15
**Granularity:** Coarse (4 phases)
**Total Requirements:** 43

---

## Phase 1: Technical Validation

**Goal:** Prove the architecture works end-to-end before committing to full implementation.

**Requirements:** VAL-01, VAL-02, VAL-03, VAL-04

**Success Criteria:**
1. mviz buildBarOptions() can be called from Node.js and returns a valid ECharts option object
2. json-render defineCatalog + defineRegistry produces a working catalog that renders a BarChart
3. A demo page shows: AI JSON → json-render → rendered Bar chart + rendered Kanban
4. Zod v4 schema validates a sample AI-generated JSON spec (accepts valid, rejects invalid)

**UI hint:** no

---

## Phase 2: Core Infrastructure + mviz Bridge

**Goal:** Build shared infrastructure and bridge all 24 mviz components as React components with Zod schemas.

**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, MVIZ-01 ~ MVIZ-24, REG-01, REG-02

**Success Criteria:**
1. All 24 mviz components render correctly through json-render with sample data
2. 3 themes (Default Dark, Linear, Vercel) apply correctly to all 24 components
3. Full catalog.prompt() generates usable AI system prompt
4. All 24 Zod schemas validate correctly (accept valid specs, reject invalid)
5. Bundle size < 200KB (excluding ECharts and mviz peer deps)

**UI hint:** yes

---

## Phase 3: Business Components

**Goal:** Implement all 11 custom business components as React components with Zod schemas.

**Requirements:** BIZ-01 ~ BIZ-11

**Success Criteria:**
1. Kanban board supports drag-and-drop between columns
2. Gantt chart renders task bars with dependencies and supports pan/zoom
3. Org chart renders tree hierarchy with expand/collapse
4. All 11 business components render through json-render with sample data
5. Full catalog (35 components) validates and renders end-to-end

**UI hint:** yes

---

## Phase 4: Publishing & Distribution

**Goal:** Package and publish as Claude Code Skill, npm package, and create demo/documentation.

**Requirements:** PUB-01, PUB-02, PUB-03, PUB-04

**Success Criteria:**
1. `npx skills add` installs RenderKit as Claude Code Skill
2. `npm install ai-render-kit` works and exports catalog + registry
3. Demo page at /demo shows all 35 components with theme switching
4. README includes installation + usage examples for all 3 distribution forms

**UI hint:** no
