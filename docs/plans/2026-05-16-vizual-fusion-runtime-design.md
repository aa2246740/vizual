# Vizual Fusion Runtime Design

Date: 2026-05-16
Branch: feature/a2ui-protocol

## Goal

Unify AG-UI, A2UI, and Vizual as one runtime instead of a chain of lossy bridges.

The runtime must keep these contracts intact:

- AG-UI owns run lifecycle, streaming events, activity snapshots, tool calls, and state deltas.
- A2UI owns surface identity, component definitions, data model updates, delete semantics, function calls, action responses, and user actions.
- Vizual owns the component catalog, renderer, artifact lifecycle, review targets, export records, theme system, and visual QA.

## Non Goals

- Do not make AG-UI responsible for layout.
- Do not make A2UI responsible for Vizual artifact/export/review internals.
- Do not silently rewrite Agent layout intent to pass a local test.
- Do not show a fixed fallback chart or template as authoritative success when daemon output fails.

## Architecture

`VizualFusionRuntime` is the product runtime entrypoint.

It accepts:

- A2UI messages and message batches.
- AG-UI events, especially `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`, `ACTIVITY_SNAPSHOT`, `ACTIVITY_DELTA`, `STATE_SNAPSHOT`, `STATE_DELTA`, and `TOOL_CALL_RESULT`.
- Direct Vizual specs for existing host integrations.

It maintains:

- Surface state keyed by `surfaceId`.
- Last generated `VizualSpec` per surface.
- Last generated `VizualArtifact` per surface.
- A raw event log for audit/debugging.
- Action subscribers for client-to-agent events.
- Quality findings emitted by browser/runtime QA.

`A2UIBridge` remains as a compatibility class, but it should delegate to the Fusion Runtime rather than being the architecture center.

## Data Flow

1. Agent emits AG-UI events or plain A2UI messages.
2. Fusion Runtime records raw input without mutating intent.
3. A2UI operations update surface state using A2UI merge semantics.
4. Surface state is compiled into a Vizual spec using direct catalog mapping.
5. Vizual artifact metadata is refreshed so host apps can export, review, and inspect targets.
6. Browser QA checks the rendered result. It may fail or provide structured findings; it must not hide failures by swapping in a template.
7. User actions are emitted as A2UI user actions and can be forwarded into AG-UI forwardedProps or daemon conversations.

## Layout Policy

Layout normalization must be conservative:

- Allowed: parse explicit Agent hints such as `gridColumn: "1 / span 7"` or `colSpan: 7`.
- Allowed: normalize obvious property aliases that preserve the same meaning, such as `Text.text` to `Text.content`.
- Not allowed: infer that a layout is bad and silently replace it with a different structure.
- Not allowed: stack or resize components only because they contain inputs.
- Not allowed: fixed fallback output for daemon failures.

Bad visual output is a QA failure, not a renderer permission to rewrite the Agent's design.

## Testing Contract

Completion requires all of the following current-state evidence:

- Unit tests for A2UI surface semantics, AG-UI activity ingestion, action routing, artifact creation, and compatibility exports.
- Typecheck and standalone build.
- Daemon test through `/api/runs` with no fixed fallback output.
- Browser test using the validation page with real typing/clicking and rendered output inspection.
- Visual audit checks for blank output, underused width, overflow, invisible controls, and obvious empty cards.
- Chinese acceptance evidence listing exactly what was tested and what the user should verify.

## Acceptance Boundary

The runtime is acceptable only when a real user can open the daemon page, type a normal product request, receive a real Agent response, interact with the rendered UI, and inspect/export/review through Vizual without hidden fallback templates or brittle layout gates.
