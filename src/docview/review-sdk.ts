import type { DocViewSchemaProps } from './schema'
import type {
  Annotation,
  AnnotationAnchor,
  AnnotationColor,
  AnnotationComment,
  AnnotationThread,
  ReviewActor,
  ReviewStatus,
  RevisionProposal,
  SectionPatch,
} from './types'

const DEFAULT_USER: ReviewActor = { id: 'user', role: 'user' }
const DEFAULT_AGENT: ReviewActor = { id: 'agent', role: 'agent' }

let reviewIdCounter = 0

export function createReviewId(prefix: string): string {
  reviewIdCounter += 1
  return `${prefix}_${Date.now()}_${reviewIdCounter}`
}

export function defaultReviewUser(): ReviewActor {
  return DEFAULT_USER
}

export function defaultReviewAgent(): ReviewActor {
  return DEFAULT_AGENT
}

export function getSectionId(section: { id?: string } | undefined, index: number): string {
  return typeof section?.id === 'string' && section.id.trim() ? section.id : `section-${index}`
}

export function reviewStatusToAnnotationStatus(status: ReviewStatus): Annotation['status'] {
  switch (status) {
    case 'resolved':
      return 'resolved'
    case 'orphaned':
      return 'orphaned'
    case 'submitted':
    case 'in_progress':
    case 'proposed':
      return 'active'
    case 'rejected':
    case 'open':
    default:
      return 'draft'
  }
}

export function threadToAnnotation(thread: AnnotationThread): Annotation {
  const firstComment = thread.comments[0]
  const selectedText = thread.anchor.textRange?.selectedText
  const text = selectedText || thread.anchor.label
  return {
    id: thread.id,
    threadId: thread.id,
    text,
    note: firstComment?.body || '',
    color: thread.color,
    status: reviewStatusToAnnotationStatus(thread.status),
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    target: thread.anchor,
    anchor: thread.anchor,
  }
}

export function threadsToAnnotations(threads: AnnotationThread[]): Annotation[] {
  return threads.map(threadToAnnotation)
}

export function createThreadFromAnnotation(annotation: Annotation): AnnotationThread {
  const now = annotation.createdAt || new Date().toISOString()
  const anchor: AnnotationAnchor = annotation.anchor || annotation.target || {
    sectionIndex: -1,
    targetType: 'text',
    label: annotation.text,
    textRange: { start: 0, end: annotation.text.length, selectedText: annotation.text },
  }
  const comment: AnnotationComment = {
    id: createReviewId('comment'),
    body: annotation.note,
    author: DEFAULT_USER,
    createdAt: now,
    updatedAt: annotation.updatedAt || now,
    kind: 'comment',
  }
  return {
    id: annotation.threadId || annotation.id,
    anchor,
    comments: annotation.note ? [comment] : [],
    color: annotation.color,
    status: annotation.status === 'resolved'
      ? 'resolved'
      : annotation.status === 'orphaned'
        ? 'orphaned'
        : annotation.status === 'active'
          ? 'submitted'
          : 'open',
    createdAt: now,
    updatedAt: annotation.updatedAt || now,
    createdBy: DEFAULT_USER,
  }
}

export function createComment(body: string, author: ReviewActor = DEFAULT_USER, kind: AnnotationComment['kind'] = 'comment'): AnnotationComment {
  const now = new Date().toISOString()
  return {
    id: createReviewId('comment'),
    body,
    author,
    createdAt: now,
    updatedAt: now,
    kind,
  }
}

export function findSectionIndex(
  sections: DocViewSchemaProps['sections'],
  sectionId?: string,
  sectionIndex?: number,
): number {
  if (sectionId) {
    const idx = sections.findIndex((section, index) => getSectionId(section, index) === sectionId)
    if (idx >= 0) return idx
  }
  return typeof sectionIndex === 'number' && sectionIndex >= 0 && sectionIndex < sections.length ? sectionIndex : -1
}

export function applySectionPatches(
  sections: DocViewSchemaProps['sections'],
  patches: SectionPatch[],
): DocViewSchemaProps['sections'] {
  let next = [...sections]

  for (const patch of patches) {
    const idx = findSectionIndex(next, patch.sectionId, patch.sectionIndex)

    switch (patch.op) {
      case 'replaceSection':
        if (idx >= 0 && patch.section) {
          next = next.map((section, index) => index === idx ? patch.section! : section)
        }
        break
      case 'updateSection':
        if (idx >= 0 && patch.updates) {
          next = next.map((section, index) => index === idx ? { ...section, ...patch.updates } : section)
        }
        break
      case 'insertSection': {
        if (!patch.section) break
        const afterIdx = patch.afterSectionId
          ? findSectionIndex(next, patch.afterSectionId, undefined)
          : idx
        const insertAt = afterIdx >= 0 ? afterIdx + 1 : next.length
        next = [...next.slice(0, insertAt), patch.section, ...next.slice(insertAt)]
        break
      }
      case 'deleteSection':
        if (idx >= 0) {
          next = next.filter((_, index) => index !== idx)
        }
        break
    }
  }

  return next
}

export function createRevisionProposal(
  input: Omit<RevisionProposal, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { id?: string },
): RevisionProposal {
  const now = new Date().toISOString()
  return {
    id: input.id || createReviewId('proposal'),
    fromThreadIds: input.fromThreadIds,
    summary: input.summary,
    patches: input.patches,
    status: 'proposed',
    createdAt: now,
    updatedAt: now,
    author: input.author || DEFAULT_AGENT,
    risk: input.risk,
    metadata: input.metadata,
  }
}

export function getProposalThreads(threads: AnnotationThread[], proposal: RevisionProposal): AnnotationThread[] {
  const ids = new Set(proposal.fromThreadIds)
  return threads.filter(thread => ids.has(thread.id))
}

export function normalizeColor(color?: AnnotationColor): AnnotationColor {
  return color || '#fbbf24'
}
