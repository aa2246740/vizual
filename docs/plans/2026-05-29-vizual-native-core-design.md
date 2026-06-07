# Vizual Native Core Design

Date: 2026-05-29
Branch: feature/a2ui-protocol

## Goal

Replace the bridge-centered mental model with one native Vizual core that directly understands AG-UI events, A2UI messages, Vizual specs, and native core operations.

The core is not `AG-UI -> adapter -> A2UI -> bridge -> VizualSpec`.

The target shape is:

```text
AG-UI input  \
A2UI input   -> VizualNativeCore.dispatch(input) -> core state -> snapshot/artifact/render/QA
Vizual input /
```

## Native Objects

Only these objects own product semantics:

- `Run`: agent execution and streaming lifecycle.
- `Surface`: renderable interactive area.
- `ComponentTree`: flat component definitions plus child references.
- `DataModel`: path-addressed state with update and append semantics.
- `Action`: user interaction emitted from the rendered UI.
- `FunctionCall`: agent/client capability request and result lifecycle.
- `Artifact`: saved/exportable/reviewable Vizual artifact.
- `Theme`: visual token state.
- `QAFinding`: browser/runtime quality evidence.

AG-UI, A2UI, and Vizual specs are native input languages for these objects. They do not own separate state machines.

## Dispatch Contract

`VizualNativeCore.dispatch(input)` accepts:

- Native operations such as `surface.create`, `surface.updateComponents`, `surface.updateData`, `surface.appendData`, `action.emit`, and `quality.report`.
- A2UI standard messages including `createSurface`, `updateComponents`, `updateDataModel`, `appendDataModel`, `deleteSurface`, `callFunction`, and `actionResponse`.
- AG-UI run/activity/state/tool events, including activity snapshots/deltas that carry A2UI/Vizual payloads.
- Direct Vizual specs with `elements`.

All accepted inputs are reduced through one native operation path. Compatibility names such as `A2UIBridge` and `VizualFusionRuntime` may remain temporarily, but they must delegate into `VizualNativeCore` and must not grow independent logic.

## Non-Negotiables

- No bridge-to-bridge chains.
- No renderer-side layout rewrite to hide bad Agent output.
- No core-level design or layout gate. Layout and visual composition live in the Agent prompt, design skills, or explicit Vizual spec authored upstream.
- Core primitives render the explicit component contract faithfully; they do not reinterpret a `Row` as a dashboard grid or silently repair weak design choices.
- No hidden fallback template. Fallback must be an explicit Agent/user operation.
- No duplicated surface/data/action/function state outside the native core.
- Browser QA failures are first-class `QAFinding` records, not cosmetic warnings.

## Verification

The first implementation must prove:

- A2UI messages and AG-UI events both produce the same core snapshot path.
- `appendDataModel` updates existing strings, arrays, and objects predictably.
- Function calls and action responses are recorded as lifecycle objects.
- Existing `A2UIBridge` and `VizualFusionRuntime` compatibility APIs still work by using the native core.
- A cloned daemon, not `/Users/wu/Documents/agent-backend-daemon`, can run a cold-start chatbot page against this core.
