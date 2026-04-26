# DocView Review SDK Design

## Goal

DocView should be an SDK surface for AI-agent document review, not a hard-coded AI workflow. It must let a host or agent wire its own model calls while DocView owns the UI state and protocol for annotations, anchors, revision proposals, acceptance, rejection, application, and version history.

## Product Position

Vizual gives AI agents stronger visual and interaction capabilities. DocView is the document-review part of that system:

- Use GridLayout and charts for ordinary dashboards and chat analysis.
- Use DocView only when the artifact is meant to be reviewed, annotated, revised, exported, or versioned.
- The agent should be able to read the Vizual skill and integrate DocView without reading source code.

## Architecture

DocView Review SDK has four layers.

### Anchor Layer

Anchors identify what a user commented on. They must survive document edits better than section-array indexes alone.

Anchors include:

- `sectionId`
- `sectionIndex`
- `targetType`
- `targetId`
- `targetPath`
- `textRange`
- `quoteBefore` / `quoteAfter`
- `chartDataPoint`
- `tableCell`

`sectionIndex` stays for compatibility, but agents should prefer `sectionId` when present.

### Thread Layer

Annotations become review threads. A thread can contain multiple comments and a status lifecycle.

Thread fields include:

- `id`
- `anchor`
- `comments[]`
- `status`
- `color`
- `type`
- `priority`
- timestamps
- linked revision proposal IDs

The old `Annotation` type stays as a compatibility projection for simple consumers and overlay highlighting.

### Revision Layer

Agents do not directly mutate the document. They submit revision proposals.

A proposal includes:

- `id`
- `fromThreadIds`
- `summary`
- `patches[]`
- `status`
- timestamps
- optional risk and error fields

DocView exposes accept, reject, and apply operations. Applying a proposal emits the next sections to the host through `onSectionsChange` when available. The host remains responsible for persistence.

### SDK / Bridge Layer

DocView exposes a controller so hosts and agents can wire their own loop:

- `createThread`
- `addComment`
- `submitThreads`
- `createRevisionProposal`
- `acceptRevision`
- `rejectRevision`
- `applyRevision`
- `resolveThread`
- `reopenThread`
- `exportReviewState`

DocView also emits typed review events through `onReviewAction`. The legacy `onAction(name, params)` remains available.

## Event Flow

1. User selects text or clicks a chart/table/KPI target.
2. DocView creates a thread and emits `threadCreated`.
3. User or host submits open threads.
4. DocView marks them submitted and emits `threadsSubmitted`.
5. Agent receives the event, calls its model, and calls `controller.createRevisionProposal(...)`.
6. DocView shows the proposed revision.
7. User or host accepts/rejects/applies the proposal.
8. DocView emits `revisionAccepted`, `revisionRejected`, or `revisionApplied`.
9. Host persists sections, threads, proposals, and snapshots as needed.

## Compatibility

The existing `annotations`, `onAnnotationsChange`, `onAction`, `showPanel`, and section rendering behavior should keep working. The new SDK should be additive.

## Testing

Required coverage:

- stable anchors and section IDs
- thread creation and status transitions
- proposal creation, accept/reject/apply
- section patch application
- legacy annotation projection for highlights
- DocView controller exposure
- docs and skill guidance for agent integration
