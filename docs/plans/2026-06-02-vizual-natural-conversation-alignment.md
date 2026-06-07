# Vizual Natural Conversation Alignment Plan

Date: 2026-06-02

## Goal

Re-align Vizual Core integration around natural conversation visualization. Agents should decide when a normal conversation needs an inline visual or interactive UI block, using the Vizual Native Catalog and runtime as an enabling capability, not as a creative gate or keyword router.

## Shared Decisions

- Natural conversation visualization is the main product target: the user asks ordinary analysis, explanation, planning, comparison, diagnosis, or decision questions; the Agent may decide text alone is not intuitive enough and insert a visual or interactive UI block.
- Explicit creative requests are separate. If the user asks for a web page, landing page, game, code artifact, or custom HTML artifact, the Agent should follow that creative path instead of forcing the request into Vizual Native.
- Agent autonomy is central. The Agent chooses whether to use Vizual, where the inline UI block appears, and what composition best helps the answer.
- Vizual Core hard failures should be contract failures only: schema/catalog errors, unsafe payloads, render failures, broken persistence, or claimed interactions with no real action loop.
- Creative quality, component choice, and whether the answer is sufficiently intuitive belong to QA guidance and cold-start acceptance, not Core rejection.
- Interactions must be useful. Do not create buttons, forms, or callbacks only to demonstrate interactivity. Interactions should improve understanding, change useful local state, or use an explicit host capability.
- The Vizual Native Catalog is the single capability truth after merging Vizual, A2UI, and AG-UI. Skill, MCP, SDK tool schemas, and docs should derive from it rather than maintain separate capability lists.
- Catalog Gap reporting is optional metadata. It may be Agent-declared or SDK-detected, may be collected by a configured sink, and must not affect user output.

## References

- `CONTEXT.md`
- `docs/adr/0001-contract-validation-not-creative-gating.md`
- `docs/adr/0002-optional-catalog-gap-sink.md`
- `docs/adr/0003-cold-start-acceptance-scenarios-not-scripts.md`
- `validation/prototype-natural-conversation-vizual.html`

## Parallel Workstreams

Worker assignments for this run:

- Worker A / Kepler: contract validation boundary.
- Worker B / Gibbs: Vizual Native Catalog as single truth.
- Worker C / Carver: scenario-based acceptance harness.
- Worker D / Euler: integration docs and skill package.

### Worker A: Contract Validation Boundary

Scope: `src/agent-helper/*` and directly related tests.

Tasks:

- Keep hard failures for schema/catalog/renderability/action/security issues.
- Downgrade creative gates such as missing KPI, unexpected form, unsupported baseline wording, or component-choice expectations into QA guidance.
- Avoid deciding whether a natural conversation should have used Vizual inside Core.
- Update tests to distinguish hard failure from QA guidance.

### Worker B: Vizual Native Catalog As Single Truth

Scope: `src/catalog-manifest.ts`, catalog-derived tool/schema helpers, and directly related tests.

Tasks:

- Make the Native Catalog the source for components, actions/functions, capabilities, and compatibility mappings.
- Identify and reduce separate hand-written capability lists where feasible.
- Keep A2UI/AG-UI/Vizual as input or transport languages normalized into the same native capability truth.
- Do not turn catalog guidance into creative gating.

### Worker C: Scenario-Based Acceptance Harness

Scope: `validation/*` acceptance server/pages/scripts.

Tasks:

- Replace guided-wrapper style acceptance with natural-language scenario acceptance.
- Cover the scenario tree: natural data analysis, concept/algorithm playground, A2UI-style surface/action, AG-UI-style event flow, drill-down loops, text-only negative, explicit creative-request negative, and optional Catalog Gap metadata.
- Browser acceptance must verify visible UI and useful interaction, not only JSON or stdout.
- Do not assume external business APIs in interaction examples.

### Worker D: Integration Docs And Skill Package

Scope: `skills/vizual/*`, `docs/AI-INTEGRATION.md`, `docs/USER_ACCEPTANCE_CN.md`, and adjacent docs.

Tasks:

- Explain natural conversation visualization, explicit creative requests, Agent autonomous composition, useful interactions, and Catalog Gap metadata.
- Make Skill/docs help Agents use the Native Catalog; they must not become the source of truth.
- Remove or soften wording that implies keyword routing, fixed component requirements, or hidden system prompt injection.

## Main Thread Responsibilities

- Keep this plan, `CONTEXT.md`, and ADRs coherent.
- Review worker patches against the shared decisions.
- Resolve conflicts and remove leftover prototype-only ideas from production paths.
- Run targeted tests, build, and then real browser plus Computer Use acceptance.

## Merge Review Checklist

- No new keyword router or Core intent classifier decides whether the Agent should use Vizual.
- No creative QA finding becomes a runtime hard failure.
- No acceptance scenario tells the Agent which component, tool, protocol, or action to use.
- No example invents an external business API such as dispatch, approval, or save unless that capability is explicitly supplied by the Host.
- No interaction exists only to demonstrate action-loop plumbing.
- Catalog Gap metadata is optional and cannot change rendered output.
- Explicit web/landing/code artifact requests remain outside forced Vizual Native.
- Text-only requests remain pure text.

## Acceptance For This Refactor

- Contract hard failures are clearly separated from QA guidance.
- Native Catalog is the visible center of capability discovery.
- Cold-start acceptance uses natural scenarios and captures browser-visible output and event/action evidence.
- Text-only and explicit creative requests are not polluted by Vizual Native.
- No implementation adds interaction only for demonstration.
