import { useCallback } from 'react'
import type { Annotation, OnAction } from './types'
import { buildSectionContext } from './section-context'
import type { SectionContext } from './section-context'

export interface UseRevisionLoopOptions {
  /** Current annotations */
  annotations: Annotation[]
  /** Update annotation status and other fields */
  updateAnnotation: (id: string, updates: Partial<Pick<Annotation, 'note' | 'color' | 'status' | 'target'>>) => void
  /** Mark orphaned annotations */
  markOrphans: (content: string) => void
  /** Fire an action event */
  onAction?: OnAction
  /** Current sections array for building semantic context in annotation payloads */
  sections?: Array<{
    type: string
    content: string
    data?: unknown
    title?: string
    aiContext?: string
    componentType?: string
  }>
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
 * 2. User submits drafts -> status becomes active, batchSubmit action fires
 * 3. AI revises content -> host calls onContentRevised(newContent)
 * 4. Orphaned annotations are detected (text no longer found)
 * 5. User can resolve or delete orphaned annotations
 *
 * Enriched payloads include sectionContext for each annotation that has a target,
 * giving the AI receiver enough semantic context to understand what the user is commenting on.
 */
export function useRevisionLoop({
  annotations,
  updateAnnotation,
  markOrphans,
  onAction,
  sections,
}: UseRevisionLoopOptions): UseRevisionLoopReturn {

  const drafts = annotations.filter(a => a.status === 'draft')
  const orphans = annotations.filter(a => a.status === 'orphaned')

  const submitAllDrafts = useCallback(() => {
    if (drafts.length === 0) return

    // Mark all drafts as active
    for (const draft of drafts) {
      updateAnnotation(draft.id, { status: 'active' })
    }

    // Enriched payload: each annotation gets its sectionContext + target
    const enrichedAnnotations = drafts.map(d => {
      const entry: Record<string, unknown> = {
        id: d.id,
        text: d.text,
        note: d.note,
        color: d.color,
      }
      if (d.target) {
        entry.target = d.target
      }
      // Add section context for this annotation
      if (sections && d.target?.sectionIndex !== undefined && d.target.sectionIndex < sections.length) {
        entry.sectionContext = buildSectionContext(sections[d.target.sectionIndex], d.target.sectionIndex)
      }
      return entry
    })

    onAction?.('batchSubmit', { annotations: enrichedAnnotations })
  }, [drafts, updateAnnotation, onAction, sections])

  const requestRevision = useCallback((annotationId: string) => {
    const ann = annotations.find(a => a.id === annotationId)
    if (!ann) return

    updateAnnotation(annotationId, { status: 'active' })

    // Enriched payload with section context
    const payload: Record<string, unknown> = {
      annotationId,
      text: ann.text,
      note: ann.note,
    }
    if (ann.target) {
      payload.target = ann.target
    }
    if (sections && ann.target?.sectionIndex !== undefined && ann.target.sectionIndex < sections.length) {
      payload.sectionContext = buildSectionContext(sections[ann.target.sectionIndex], ann.target.sectionIndex)
    }

    onAction?.('requestRevision', payload)
  }, [annotations, updateAnnotation, onAction, sections])

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
