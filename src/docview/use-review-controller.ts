import { useCallback, useMemo, useRef, useState } from 'react'
import type { DocViewSchemaProps } from './schema'
import { buildSectionContext } from './section-context'
import type {
  Annotation,
  AnnotationComment,
  AnnotationThread,
  CreateRevisionProposalInput,
  CreateThreadInput,
  DocViewReviewActionEvent,
  DocViewReviewController,
  ReviewActor,
  ReviewStatus,
  RevisionProposal,
} from './types'
import {
  applySectionPatches,
  createComment,
  createRevisionProposal,
  createReviewId,
  createThreadFromAnnotation,
  findSectionIndex,
  getSectionId,
  getProposalThreads,
  normalizeColor,
  threadsToAnnotations,
} from './review-sdk'

export interface UseReviewControllerOptions {
  sections?: DocViewSchemaProps['sections']
  annotations?: Annotation[]
  onAnnotationsChange?: (annotations: Annotation[]) => void
  threads?: AnnotationThread[]
  onThreadsChange?: (threads: AnnotationThread[]) => void
  revisionProposals?: RevisionProposal[]
  onRevisionProposalsChange?: (proposals: RevisionProposal[]) => void
  onSectionsChange?: (sections: DocViewSchemaProps['sections']) => void
  onReviewAction?: (event: DocViewReviewActionEvent) => void
}

export interface UseReviewControllerReturn {
  threads: AnnotationThread[]
  revisionProposals: RevisionProposal[]
  reviewAnnotations: Annotation[]
  controller: DocViewReviewController
}

function emitThreadAnnotations(
  nextThreads: AnnotationThread[],
  onAnnotationsChange?: (annotations: Annotation[]) => void,
) {
  onAnnotationsChange?.(threadsToAnnotations(nextThreads))
}

function getSectionTypeForAnchor(section: DocViewSchemaProps['sections'][number] | undefined): AnnotationThread['anchor']['targetType'] {
  const type = section?.type
  switch (type) {
    case 'heading':
    case 'chart':
    case 'kpi':
    case 'table':
    case 'callout':
    case 'component':
    case 'freeform':
    case 'markdown':
    case 'text':
      return type
    default:
      return 'text'
  }
}

function getSectionPlainText(section: DocViewSchemaProps['sections'][number] | undefined): string {
  if (!section) return ''
  if (typeof section.content === 'string') return section.content
  if (typeof section.title === 'string') return section.title
  return ''
}

function normalizeThreadAnchor(
  input: CreateThreadInput,
  sections: DocViewSchemaProps['sections'],
): AnnotationThread['anchor'] {
  const rawAnchor = input.anchor
  const index = findSectionIndex(sections, rawAnchor?.sectionId || input.sectionId, rawAnchor?.sectionIndex ?? input.sectionIndex)
  const sectionIndex = rawAnchor?.sectionIndex ?? index
  const section = sectionIndex >= 0 ? sections[sectionIndex] : undefined
  const sectionId = rawAnchor?.sectionId || input.sectionId || (sectionIndex >= 0 ? getSectionId(section, sectionIndex) : undefined)
  const sectionText = getSectionPlainText(section)
  const selectedText = rawAnchor?.textRange?.selectedText || input.selectedText || input.targetText || ''
  const foundAt = selectedText ? sectionText.indexOf(selectedText) : -1
  const textRange = rawAnchor?.textRange || (selectedText
    ? {
        start: foundAt >= 0 ? foundAt : 0,
        end: foundAt >= 0 ? foundAt + selectedText.length : selectedText.length,
        selectedText,
      }
    : undefined)

  return {
    ...rawAnchor,
    sectionIndex,
    sectionId,
    targetType: rawAnchor?.targetType || input.targetType || getSectionTypeForAnchor(section),
    label: rawAnchor?.label || input.label || selectedText || section?.title || sectionText.slice(0, 80) || 'DocView section',
    textRange,
  }
}

export function useReviewController({
  sections = [],
  annotations,
  onAnnotationsChange,
  threads: controlledThreads,
  onThreadsChange,
  revisionProposals: controlledProposals,
  onRevisionProposalsChange,
  onSectionsChange,
  onReviewAction,
}: UseReviewControllerOptions): UseReviewControllerReturn {
  const seededThreadsRef = useRef<AnnotationThread[] | null>(null)
  if (!seededThreadsRef.current) {
    seededThreadsRef.current = (annotations || []).map(createThreadFromAnnotation)
  }

  const [internalThreads, setInternalThreads] = useState<AnnotationThread[]>(seededThreadsRef.current)
  const [internalProposals, setInternalProposals] = useState<RevisionProposal[]>([])

  const threads = controlledThreads ?? internalThreads
  const revisionProposals = controlledProposals ?? internalProposals

  const sectionsRef = useRef(sections)
  const threadsRef = useRef(threads)
  const proposalsRef = useRef(revisionProposals)
  sectionsRef.current = sections
  threadsRef.current = threads
  proposalsRef.current = revisionProposals

  const emitThreads = useCallback((next: AnnotationThread[]) => {
    threadsRef.current = next
    if (!controlledThreads) setInternalThreads(next)
    onThreadsChange?.(next)
    emitThreadAnnotations(next, onAnnotationsChange)
  }, [controlledThreads, onThreadsChange, onAnnotationsChange])

  const emitProposals = useCallback((next: RevisionProposal[]) => {
    proposalsRef.current = next
    if (!controlledProposals) setInternalProposals(next)
    onRevisionProposalsChange?.(next)
  }, [controlledProposals, onRevisionProposalsChange])

  const emitReview = useCallback((event: DocViewReviewActionEvent) => {
    onReviewAction?.(event)
  }, [onReviewAction])

  const getSectionContextsForThreads = useCallback((inputThreads: AnnotationThread[]) => {
    const result: Record<string, ReturnType<typeof buildSectionContext>> = {}
    for (const thread of inputThreads) {
      const index = thread.anchor.sectionIndex
      if (index >= 0 && index < sectionsRef.current.length) {
        result[thread.id] = buildSectionContext(sectionsRef.current[index], index)
      }
    }
    return result
  }, [])

  const controller = useMemo<DocViewReviewController>(() => {
    const getThreads = () => threadsRef.current
    const getRevisionProposals = () => proposalsRef.current
    const getAnnotations = () => threadsToAnnotations(threadsRef.current)

    const createThread = (input: CreateThreadInput): AnnotationThread => {
      const now = new Date().toISOString()
      const anchor = normalizeThreadAnchor(input, sectionsRef.current)
      const comment = createComment(input.body, input.author, 'comment')
      const thread: AnnotationThread = {
        id: createReviewId('thread'),
        anchor,
        comments: [comment],
        color: normalizeColor(input.color),
        status: 'open',
        type: input.type || 'comment',
        priority: input.priority,
        createdAt: now,
        updatedAt: now,
        createdBy: input.author,
        metadata: input.metadata,
      }
      const next = [...threadsRef.current, thread]
      emitThreads(next)
      const sectionContext = anchor.sectionIndex >= 0 && anchor.sectionIndex < sectionsRef.current.length
        ? buildSectionContext(sectionsRef.current[anchor.sectionIndex], anchor.sectionIndex)
        : undefined
      emitReview({ type: 'threadCreated', thread, sectionContext })
      return thread
    }

    const addComment = (threadId: string, body: string, author: ReviewActor = { id: 'user', role: 'user' }): AnnotationComment | undefined => {
      const comment = createComment(body, author, author.role === 'agent' ? 'agent_reply' : 'comment')
      let updatedThread: AnnotationThread | undefined
      const next = threadsRef.current.map(thread => {
        if (thread.id !== threadId) return thread
        updatedThread = {
          ...thread,
          comments: [...thread.comments, comment],
          updatedAt: comment.updatedAt,
        }
        return updatedThread
      })
      if (!updatedThread) return undefined
      emitThreads(next)
      emitReview({ type: 'commentAdded', thread: updatedThread, comment })
      return comment
    }

    const updateThreadStatus = (threadId: string, status: ReviewStatus): AnnotationThread | undefined => {
      let updatedThread: AnnotationThread | undefined
      let previousStatus: ReviewStatus | undefined
      const now = new Date().toISOString()
      const next = threadsRef.current.map(thread => {
        if (thread.id !== threadId) return thread
        previousStatus = thread.status
        updatedThread = {
          ...thread,
          status,
          updatedAt: now,
          resolvedAt: status === 'resolved' ? now : thread.resolvedAt,
        }
        return updatedThread
      })
      if (!updatedThread) return undefined
      emitThreads(next)
      emitReview({ type: 'threadUpdated', thread: updatedThread, previousStatus })
      return updatedThread
    }

    const submitThreads = (threadIds?: string[]): AnnotationThread[] => {
      const ids = threadIds ? new Set(threadIds) : null
      const now = new Date().toISOString()
      const submitted: AnnotationThread[] = []
      const next = threadsRef.current.map(thread => {
        const canSubmit = ids
          ? ids.has(thread.id) && (thread.status === 'open' || thread.status === 'orphaned' || thread.status === 'rejected')
          : thread.status === 'open'
        if (!canSubmit) return thread
        const updated = { ...thread, status: 'submitted' as const, updatedAt: now }
        submitted.push(updated)
        return updated
      })
      if (submitted.length === 0) return []
      emitThreads(next)
      emitReview({
        type: 'threadsSubmitted',
        threads: submitted,
        sectionContexts: getSectionContextsForThreads(submitted),
      })
      return submitted
    }

    const createProposal = (input: CreateRevisionProposalInput): RevisionProposal => {
      const proposal = createRevisionProposal(input)
      const proposalThreadIds = new Set(input.fromThreadIds)
      const now = new Date().toISOString()
      const nextThreads = threadsRef.current.map(thread => proposalThreadIds.has(thread.id)
        ? {
            ...thread,
            status: 'proposed' as const,
            updatedAt: now,
            revisionProposalIds: [...(thread.revisionProposalIds || []), proposal.id],
          }
        : thread)
      const nextProposals = [...proposalsRef.current, proposal]
      emitThreads(nextThreads)
      emitProposals(nextProposals)
      emitReview({
        type: 'revisionProposalCreated',
        proposal,
        threads: getProposalThreads(nextThreads, proposal),
      })
      return proposal
    }

    const updateProposalStatus = (
      proposalId: string,
      status: RevisionProposal['status'],
      eventType: 'revisionAccepted' | 'revisionRejected',
      error?: string,
    ): RevisionProposal | undefined => {
      let updatedProposal: RevisionProposal | undefined
      const now = new Date().toISOString()
      const nextProposals = proposalsRef.current.map(proposal => {
        if (proposal.id !== proposalId) return proposal
        updatedProposal = { ...proposal, status, updatedAt: now, error }
        return updatedProposal
      })
      if (!updatedProposal) return undefined
      emitProposals(nextProposals)

      const nextThreads = threadsRef.current.map(thread => updatedProposal!.fromThreadIds.includes(thread.id)
        ? { ...thread, status: status === 'accepted' ? 'resolved' as const : 'rejected' as const, updatedAt: now }
        : thread)
      emitThreads(nextThreads)
      emitReview({
        type: eventType,
        proposal: updatedProposal,
        threads: getProposalThreads(nextThreads, updatedProposal),
      } as DocViewReviewActionEvent)
      return updatedProposal
    }

    const acceptRevision = (proposalId: string) =>
      updateProposalStatus(proposalId, 'accepted', 'revisionAccepted')

    const rejectRevision = (proposalId: string, reason?: string) =>
      updateProposalStatus(proposalId, 'rejected', 'revisionRejected', reason)

    const applyRevision = (proposalId: string): RevisionProposal | undefined => {
      const proposal = proposalsRef.current.find(p => p.id === proposalId)
      if (!proposal) return undefined
      const nextSections = applySectionPatches(sectionsRef.current, proposal.patches)
      const now = new Date().toISOString()
      const updatedProposal = { ...proposal, status: 'applied' as const, updatedAt: now }
      emitProposals(proposalsRef.current.map(p => p.id === proposalId ? updatedProposal : p))
      const nextThreads = threadsRef.current.map(thread => proposal.fromThreadIds.includes(thread.id)
        ? { ...thread, status: 'resolved' as const, updatedAt: now, resolvedAt: now }
        : thread)
      emitThreads(nextThreads)
      onSectionsChange?.(nextSections)
      emitReview({
        type: 'revisionApplied',
        proposal: updatedProposal,
        sections: nextSections,
        threads: getProposalThreads(nextThreads, updatedProposal),
      })
      return updatedProposal
    }

    const resolveThread = (threadId: string) => updateThreadStatus(threadId, 'resolved')
    const reopenThread = (threadId: string) => updateThreadStatus(threadId, 'open')

    const deleteThread = (threadId: string): AnnotationThread | undefined => {
      const thread = threadsRef.current.find(t => t.id === threadId)
      if (!thread) return undefined
      emitThreads(threadsRef.current.filter(t => t.id !== threadId))
      emitReview({ type: 'threadDeleted', thread })
      return thread
    }

    const exportReviewState = () => ({
      threads: threadsRef.current,
      revisionProposals: proposalsRef.current,
      annotations: threadsToAnnotations(threadsRef.current),
    })

    return {
      getThreads,
      getRevisionProposals,
      getAnnotations,
      createThread,
      addComment,
      updateThreadStatus,
      submitThreads,
      createRevisionProposal: createProposal,
      acceptRevision,
      rejectRevision,
      applyRevision,
      resolveThread,
      reopenThread,
      deleteThread,
      exportReviewState,
    }
  }, [emitProposals, emitReview, emitThreads, getSectionContextsForThreads, onSectionsChange])

  return {
    threads,
    revisionProposals,
    reviewAnnotations: threads.length > 0 ? threadsToAnnotations(threads) : (annotations || []),
    controller,
  }
}
