import { useCallback } from 'react'
import type { Annotation, OnAction } from './types'

export interface UseRevisionLoopOptions {
  /** Current annotations */
  annotations: Annotation[]
  /** Update annotation status */
  updateAnnotation: (id: string, updates: Partial<Pick<Annotation, 'note' | 'color' | 'status'>>) => void
  /** Mark orphaned annotations */
  markOrphans: (content: string) => void
  /** Fire an action event */
  onAction?: OnAction
}

export interface UseRevisionLoopReturn {
  /** Submit all draft annotations as a batch for AI revision */
  submitAllDrafts: () => void
  /** Request revision for a single annotation */
  requestRevision: (annotationId: string) => void
  /** Call after AI revises content — marks orphaned annotations */
  onContentRevised: (newContent: string) => void
  /** Get all draft annotations */
  drafts: Annotation[]
  /** Get all orphaned annotations */
  orphans: Annotation[]
}

/**
 * Hook for managing the AI revision loop with annotations.
 *
 * Lifecycle:
 * 1. User creates annotations (status: draft)
 * 2. User submits drafts → status becomes active, batchSubmit action fires
 * 3. AI revises content → host calls onContentRevised(newContent)
 * 4. Orphaned annotations are detected (text no longer found)
 * 5. User can resolve or delete orphaned annotations
 */
export function useRevisionLoop({
  annotations,
  updateAnnotation,
  markOrphans,
  onAction,
}: UseRevisionLoopOptions): UseRevisionLoopReturn {

  const drafts = annotations.filter(a => a.status === 'draft')
  const orphans = annotations.filter(a => a.status === 'orphaned')

  const submitAllDrafts = useCallback(() => {
    if (drafts.length === 0) return

    // Mark all drafts as active
    for (const draft of drafts) {
      updateAnnotation(draft.id, { status: 'active' })
    }

    // Fire batchSubmit action with all draft data
    onAction?.('batchSubmit', {
      annotations: drafts.map(d => ({
        id: d.id,
        text: d.text,
        note: d.note,
        color: d.color,
      })),
    })
  }, [drafts, updateAnnotation, onAction])

  const requestRevision = useCallback((annotationId: string) => {
    const ann = annotations.find(a => a.id === annotationId)
    if (!ann) return

    updateAnnotation(annotationId, { status: 'active' })

    onAction?.('requestRevision', {
      annotationId,
      text: ann.text,
      note: ann.note,
    })
  }, [annotations, updateAnnotation, onAction])

  const onContentRevised = useCallback((newContent: string) => {
    markOrphans(newContent)
  }, [markOrphans])

  return {
    submitAllDrafts,
    requestRevision,
    onContentRevised,
    drafts,
    orphans,
  }
}
