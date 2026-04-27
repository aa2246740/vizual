import {
  applyArtifactPatch,
  cloneJson,
  type VizualArtifact,
  type VizualArtifactPatch,
  type VizualTarget,
} from './artifact'

export type VizualReviewActorRole = 'user' | 'agent' | 'system'

export type VizualReviewActor = {
  id: string
  role: VizualReviewActorRole
  name?: string
  avatar?: string
}

export type VizualReviewStatus =
  | 'open'
  | 'submitted'
  | 'in_progress'
  | 'proposed'
  | 'resolved'
  | 'rejected'
  | 'orphaned'

export type VizualRevisionStatus = 'proposed' | 'accepted' | 'rejected' | 'applied' | 'failed'

export type VizualTargetRef = {
  artifactId?: string
  targetId?: string
  target?: VizualTarget
  path?: string
  label?: string
  quote?: string
  contextBefore?: string
  contextAfter?: string
  meta?: Record<string, unknown>
}

export type VizualReviewComment = {
  id: string
  body: string
  author: VizualReviewActor
  kind: 'comment' | 'request' | 'proposal' | 'system'
  createdAt: string
  updatedAt: string
  meta?: Record<string, unknown>
}

export type VizualReviewThread = {
  id: string
  artifactId?: string
  target: VizualTargetRef
  status: VizualReviewStatus
  title?: string
  comments: VizualReviewComment[]
  createdBy?: VizualReviewActor
  assignedTo?: VizualReviewActor
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  revisionProposalIds?: string[]
  meta?: Record<string, unknown>
}

export type VizualRevisionProposal = {
  id: string
  artifactId?: string
  threadIds: string[]
  target?: VizualTargetRef
  title?: string
  summary: string
  rationale?: string
  patches: VizualArtifactPatch[]
  status: VizualRevisionStatus
  author?: VizualReviewActor
  createdAt: string
  updatedAt: string
  appliedAt?: string
  rejectedReason?: string
  error?: string
  risk?: 'low' | 'medium' | 'high'
  meta?: Record<string, unknown>
}

export type CreateVizualReviewThreadInput = {
  id?: string
  artifactId?: string
  target?: Partial<VizualTargetRef> | string | VizualTarget
  title?: string
  body?: string
  comment?: string
  author?: VizualReviewActor
  createdBy?: VizualReviewActor
  assignedTo?: VizualReviewActor
  status?: VizualReviewStatus
  meta?: Record<string, unknown>
  now?: string
}

export type CreateVizualRevisionProposalInput = {
  id?: string
  artifactId?: string
  threadIds?: string[]
  fromThreadIds?: string[]
  target?: Partial<VizualTargetRef> | string | VizualTarget
  title?: string
  summary: string
  rationale?: string
  patches?: VizualArtifactPatch | VizualArtifactPatch[]
  author?: VizualReviewActor
  risk?: VizualRevisionProposal['risk']
  meta?: Record<string, unknown>
  now?: string
}

export type ApplyVizualRevisionResult = {
  artifact: VizualArtifact
  proposal: VizualRevisionProposal
}

const DEFAULT_USER: VizualReviewActor = { id: 'user', role: 'user', name: 'User' }
const DEFAULT_AGENT: VizualReviewActor = { id: 'agent', role: 'agent', name: 'Agent' }

let reviewSeq = 0

export function createVizualReviewId(prefix: string): string {
  reviewSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${reviewSeq.toString(36)}`
}

export function defaultVizualReviewUser(): VizualReviewActor {
  return { ...DEFAULT_USER }
}

export function defaultVizualReviewAgent(): VizualReviewActor {
  return { ...DEFAULT_AGENT }
}

export function normalizeTargetRef(input?: Partial<VizualTargetRef> | string | VizualTarget | null): VizualTargetRef {
  if (!input) return {}
  if (typeof input === 'string') return { targetId: input }
  if ('id' in input && 'type' in input && 'path' in input) {
    const target = cloneJson(input as VizualTarget)
    return {
      targetId: target.id,
      target,
      path: target.path,
      label: target.label,
      meta: target.meta,
    }
  }
  return cloneJson(input)
}

export function createReviewComment(
  body: string,
  author: VizualReviewActor = DEFAULT_USER,
  kind: VizualReviewComment['kind'] = 'comment',
  now = new Date().toISOString(),
): VizualReviewComment {
  return {
    id: createVizualReviewId('comment'),
    body,
    author: cloneJson(author),
    kind,
    createdAt: now,
    updatedAt: now,
  }
}

export function createReviewThread(input: CreateVizualReviewThreadInput): VizualReviewThread {
  const now = input.now || new Date().toISOString()
  const author = input.author || input.createdBy || DEFAULT_USER
  const body = input.body ?? input.comment
  const comments = body ? [createReviewComment(body, author, 'request', now)] : []

  const target = normalizeTargetRef(input.target)
  if (input.artifactId && !target.artifactId) target.artifactId = input.artifactId

  return {
    id: input.id || createVizualReviewId('thread'),
    artifactId: input.artifactId || target.artifactId,
    target,
    title: input.title,
    status: input.status || 'open',
    comments,
    createdBy: cloneJson(author),
    assignedTo: input.assignedTo ? cloneJson(input.assignedTo) : undefined,
    createdAt: now,
    updatedAt: now,
    revisionProposalIds: [],
    meta: cloneJson(input.meta),
  }
}

export function addReviewComment(
  thread: VizualReviewThread,
  body: string,
  author: VizualReviewActor = DEFAULT_USER,
  kind: VizualReviewComment['kind'] = 'comment',
  now = new Date().toISOString(),
): { thread: VizualReviewThread; comment: VizualReviewComment } {
  const comment = createReviewComment(body, author, kind, now)
  const next = cloneJson(thread)
  next.comments = [...(next.comments || []), comment]
  next.updatedAt = now
  return { thread: next, comment }
}

export function updateReviewThreadStatus(
  thread: VizualReviewThread,
  status: VizualReviewStatus,
  now = new Date().toISOString(),
): VizualReviewThread {
  const next = cloneJson(thread)
  next.status = status
  next.updatedAt = now
  if (status === 'resolved') next.resolvedAt = now
  return next
}

export function createRevisionProposal(input: CreateVizualRevisionProposalInput): VizualRevisionProposal {
  const now = input.now || new Date().toISOString()
  const patches = input.patches
    ? Array.isArray(input.patches) ? input.patches : [input.patches]
    : []
  const target = normalizeTargetRef(input.target)
  if (input.artifactId && !target.artifactId) target.artifactId = input.artifactId

  return {
    id: input.id || createVizualReviewId('proposal'),
    artifactId: input.artifactId || target.artifactId,
    threadIds: [...(input.threadIds || input.fromThreadIds || [])],
    target: Object.keys(target).length ? target : undefined,
    title: input.title,
    summary: input.summary,
    rationale: input.rationale,
    patches: cloneJson(patches),
    status: 'proposed',
    author: input.author ? cloneJson(input.author) : cloneJson(DEFAULT_AGENT),
    createdAt: now,
    updatedAt: now,
    risk: input.risk,
    meta: cloneJson(input.meta),
  }
}

export function acceptRevisionProposal(
  proposal: VizualRevisionProposal,
  now = new Date().toISOString(),
): VizualRevisionProposal {
  return {
    ...cloneJson(proposal),
    status: 'accepted',
    updatedAt: now,
  }
}

export function rejectRevisionProposal(
  proposal: VizualRevisionProposal,
  reason?: string,
  now = new Date().toISOString(),
): VizualRevisionProposal {
  return {
    ...cloneJson(proposal),
    status: 'rejected',
    rejectedReason: reason,
    updatedAt: now,
  }
}

export function applyRevisionProposalToArtifact(
  artifact: VizualArtifact,
  proposal: VizualRevisionProposal,
  now = new Date().toISOString(),
): ApplyVizualRevisionResult {
  try {
    const patched = proposal.patches.length
      ? applyArtifactPatch(artifact, proposal.patches)
      : cloneJson(artifact)
    return {
      artifact: patched,
      proposal: {
        ...cloneJson(proposal),
        status: 'applied',
        appliedAt: now,
        updatedAt: now,
        error: undefined,
      },
    }
  } catch (error) {
    return {
      artifact: cloneJson(artifact),
      proposal: {
        ...cloneJson(proposal),
        status: 'failed',
        updatedAt: now,
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}
