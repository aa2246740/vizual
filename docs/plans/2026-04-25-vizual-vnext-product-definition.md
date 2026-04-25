# Vizual vNext Product Definition

## One-Sentence Definition

Vizual is the visual runtime for AI agents. An agent that connects to Vizual gains the ability to output, render, interact with, revise, annotate, and export visual business artifacts instead of returning only text or Markdown.

## Core Principle

The user sees a dynamically rendered visual artifact. Without Vizual, the host only has the structured JSON/artifact data. Images, PDFs, PPTs, and spreadsheets are export formats, not the source of truth.

## What Vizual Is

Vizual is an AI-agent runtime layer for visual output and user interaction:

- It renders agent output as charts, tables, KPI dashboards, layouts, reports, forms, and DocView documents.
- It gives the host platform a consistent way to render agent messages automatically.
- It gives the agent a consistent protocol for producing visual output.
- It lets users modify visual output by natural language or controls.
- It supports DocView review loops: annotate, submit, receive revision proposals, accept/reject/apply, and continue co-creating a report.
- It supports export of the currently rendered artifact into delivery formats.

## What Vizual Is Not

Vizual is not the data-analysis agent itself:

- It does not generate SQL.
- It does not decide metric definitions.
- It does not own business reasoning.
- It does not replace the host platform.
- It does not treat screenshots as the primary artifact.

The agent and platform own data access, analysis, permissions, persistence, and business logic. Vizual owns visual rendering, interaction, target metadata, review state, and export surfaces.

## Primary User

The first user is the project owner and internal agent-development team. Vizual exists to make future company agents easier to build and reuse.

The first product scenario is a B2B internal system with an embedded agent chat box. Over time it can grow into a full ChatGPT-like agent workspace, but the runtime must work inside small chatbot panels from day one.

## Required Host Modes

### Message Mode

The host renders agent replies inside a chat window. A reply can contain text plus one or more Vizual artifacts. The platform should automatically detect and render Vizual output.

### Workspace Mode

The host renders a larger artifact surface for dashboards, reports, DocView documents, and long-lived work. Users can continue editing, annotating, exporting, and revising the same artifact.

Both modes render the same underlying artifact model. The UI container changes; the runtime contract does not.

## Required Artifact Capabilities

Every Vizual output should be treated as a structured visual artifact with enough data to support future operations:

- Recover it from chat history.
- Re-render it in the same visual state.
- Locate a component, chart, KPI, table cell, or document section.
- Modify it from natural language or UI controls.
- Export it.
- Debug render failures.

This means Vizual artifacts need stable identifiers, spec/data/theme/state, target metadata, and optional review/export/version metadata.

## vNext Runtime Contract

The runtime exposes three layers:

- `renderSpec(spec, container)` for low-level static rendering.
- `renderArtifact(artifactOrSpec, container)` for durable outputs with `id`, `targetMap`, `versions`, `theme`, `state`, and `exports`.
- Host bridges such as `renderVizInMsg`, `renderArtifactInMsg`, `updateArtifactInMsg`, `renderInteractiveVizInMsg`, and `exportArtifact` for agent chat surfaces.

Artifact patches are the first editing primitive. They let an agent update an existing output without rebuilding it from memory:

- `changeChartType`
- `filterData`
- `limitData`
- `updateElementProps`
- `replaceElement`
- `replaceSpec`
- `mergeState`
- `setTheme`
- `addExportRecord`

This is enough for the first historical-chat loop: reopen a saved visual, identify a target, change chart type, filter a region, reduce density, re-render, and record export metadata.

## vNext Success Standard

Vizual vNext is successful when an internal agent platform can do the following end to end:

1. Agent returns a Vizual-compatible artifact in a normal chat reply.
2. The B2B host chat window automatically renders it.
3. A user can reopen historical chat and the artifact re-renders from saved state.
4. A user can ask the agent to modify the artifact, such as changing chart type, filtering a region, reducing density, or adding controls.
5. The agent can identify the target artifact/component and update the rendered output.
6. A user can open a generated report as DocView, annotate text or visual targets, and submit those threads.
7. The agent can return a revision proposal, and the user can apply or reject it.
8. The runtime can export the artifact or report to at least PNG initially, with PDF/PPT/table export as planned extension points.
9. The host developer can inspect current artifact state, render history, events, errors, theme, and targets.
10. A cold-start agent that only reads the Vizual skill can generate valid outputs and use the host bridge correctly.

## Implementation Direction

Do not optimize for package structure first. Build the complete runtime capability first:

- Agent-facing docs/skill/schema so the agent knows what it can output.
- Host-facing renderer so the platform can automatically render agent messages.
- Artifact state model so historical outputs are recoverable and editable.
- Target map so user references like "this chart" or "that column" can be resolved.
- Runtime actions for update, review, export, and debug.
- Eval pages and cold-start tests that prove the whole loop works.

Packaging can be decided later after the product contract is stable.

## Dependencies Direction

ECharts should remain the chart rendering engine. Hand-rolling chart rendering is unnecessary.

The semantic chart contract should belong to Vizual. Any third-party chart adapter or skill logic should be treated as replaceable implementation detail. Over time, Vizual should internalize chart schemas, defaults, theme behavior, data normalization, and examples so agents learn Vizual's own protocol rather than an external library's mental model.

## Development Stop Condition

Development should stop for a vNext milestone only when the eval suite proves the complete loop:

- render in chat
- recover from history
- update by user request
- interact through controls
- annotate and revise DocView
- export
- debug failure
- cold-start agent usage

If a feature does not move one of these loops forward, defer it.
