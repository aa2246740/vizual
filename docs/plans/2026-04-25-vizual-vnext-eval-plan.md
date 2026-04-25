# Vizual vNext Eval Plan

## Goal

The eval plan proves that Vizual is a usable visual runtime for AI agents, not just a set of React components.

Each test should be runnable by a host developer and understandable by a cold-start agent that only has the Vizual skill.

## Test Groups

### 1. Message Rendering

**Scenario:** Agent replies in a B2B chatbot with text plus one Vizual artifact.

**Pass criteria:**

- Host detects Vizual artifact automatically.
- Artifact renders without manual JSON copy/paste.
- Text and visual output can appear in the same message.
- Render errors produce a readable fallback, not a blank message.
- Debug state records the source message, artifact id, spec, status, and errors.

### 2. Historical Recovery

**Scenario:** User reopens a historical chat message containing a Vizual chart.

**Pass criteria:**

- Artifact re-renders from saved structured state.
- Theme and component state are restored.
- The artifact has a stable id.
- Agent can reference the historical artifact for follow-up changes.

### 3. Natural Language Modification

**Scenario:** User says: "Change this chart to a line chart, only show East China, and make it less dense."

**Pass criteria:**

- Runtime exposes enough target/spec state for the agent to identify the target chart.
- Agent returns an updated artifact/spec or a patch.
- Chart type changes correctly.
- Data filtering is applied correctly when data is present.
- Density/visual settings change without breaking layout.
- Previous artifact version is still recoverable for rollback/debug.

### 4. Interactive Controls

**Scenario:** Agent adds a control panel to an existing visual answer.

**Pass criteria:**

- Host uses Vizual runtime bridge, not a pure static spec.
- FormBuilder controls bind to runtime state.
- Slider/select/switch/color changes update the preview live.
- Re-rendering reuses or safely replaces roots.
- Debug state records state changes and generated preview specs.

### 5. DocView Review Loop

**Scenario:** Agent generates a report. User opens it as DocView, annotates a KPI/chart/table/text section, submits comments, and applies an AI revision.

**Pass criteria:**

- Important sections have stable ids.
- Text selections include text range and quote context.
- KPI/chart/table targets include target ids and semantic anchors.
- `threadsSubmitted` fires with thread anchors and section contexts.
- Agent returns a `RevisionProposal`, not a direct overwrite.
- Runtime shows the proposal.
- User can apply or reject it.
- Applying emits `onSectionsChange(nextSections)`.
- Thread status updates to resolved/rejected/orphaned as appropriate.

### 6. Export

**Scenario:** User exports a visual artifact or report.

**Pass criteria:**

- PNG export works for single artifact and DocView viewport.
- Export target excludes unrelated host UI unless explicitly requested.
- Export metadata records artifact id, format, dimensions, and timestamp.
- PDF/PPT/table export have defined extension points even if not complete in the current milestone.

### 7. Theme and Design.md

**Scenario:** Host applies a company Design.md theme to charts, dashboards, and DocView.

**Pass criteria:**

- Design.md can be loaded at runtime.
- Theme applies across components consistently.
- Chart `theme` is not misused as brand-color injection.
- Dark/light variants stay legible.
- Calendar/heatmap backgrounds and labels fit dark theme expectations.

### 8. Cold-Start Agent

**Scenario:** A clean agent has no source-code context and only reads the installed Vizual skill.

**Pass criteria:**

- It chooses GridLayout for ordinary analysis/dashboard output.
- It chooses DocView only for annotatable/revisable documents.
- It uses host bridge APIs for interactive output.
- It uses `onReviewAction` / controller flow for DocView revision loops.
- It avoids removed components and invented props.
- It preserves messy user input and extracts data faithfully.

## Required Demo Pages

The validation directory should eventually contain:

- `eval-full-31.html`: all components render.
- `vizual-test.html`: chatbot message renderer and interactive bridge.
- `demo-docview.html`: DocView Review SDK loop.
- `demo-artifact-history.html`: historical recovery, target update, and PNG export metadata.
- `demo-design-md.html`: theme tests.

## Stop Rule

A milestone is not done until:

- automated tests pass,
- browser demos pass,
- cold-start agent test passes,
- docs and installed skill are synchronized,
- package dry-run includes generated types and runtime assets.
