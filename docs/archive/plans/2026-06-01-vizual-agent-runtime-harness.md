# Vizual Agent Runtime Harness

Date: 2026-06-01

## Goal

Make Vizual Core usable by external agents in the same way A2UI-style runtimes are usable: an agent can emit native UI intent, the host can normalize and validate it, and a chat product can render it as a persistent rich UI part instead of losing it inside Markdown.

This work does not put layout policy, theme injection, or design taste gates into core. The agent remains responsible for story, theme, and composition. Core owns protocol ingestion, state updates, rendering artifacts, interaction events, validation, and preview envelopes.

## Three-Stage Plan

1. **Runtime harness**
   - Public `normalize`, `validate`, and `preview` APIs over `VizualNativeCore`.
   - Agent helper contract for tool-call rich UI parts.
   - Minimal MCP server with `vizual_normalize`, `vizual_validate`, and `vizual_preview`.
   - Skill reference explaining when to use native Vizual, A2UI, AG-UI, or plain text.

2. **Simulated DeerFlow acceptance**
   - A local workbench that mimics DeerFlow's chat flow: user message, assistant text, tool call, tool result, persistent rich UI card.
   - A real local agent run must use the helper or MCP path, not a hardcoded demo payload.
   - Computer Use acceptance covers visual result, chart content, input interaction, follow-up update, and persisted payload inspection.

3. **Real DeerFlow integration**
   - Preserve DeerFlow's existing Markdown path for normal messages.
   - Add a rich UI part renderer for a Vizual tool call/result in the message rendering layer.
   - Do not overload `thread.values.artifacts` or inject rich JSON into Markdown.
   - Validate with Computer Use before asking the user to accept in browser.

## Acceptance Boundary

A result is not accepted just because a unit test passes. Before user handoff, the runtime must pass:

- typed unit coverage for normalize/validate/preview/helper;
- MCP smoke test after build;
- browser workbench acceptance by real interaction;
- Computer Use inspection of rendered chart/table/form content and tool payload;
- regression check that no theme/layout gate is injected by the core bundle.
