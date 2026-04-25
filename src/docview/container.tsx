import React, { useRef, useCallback, useState, useEffect } from 'react'
import { tcss } from '../core/theme-colors'
import { useTextSelection } from './use-text-selection'
import { useReviewController } from './use-review-controller'
import { AnnotationOverlay } from './annotation-overlay'
import { AnnotationPanel } from './annotation-panel'
import { AnnotationInput } from './annotation-input'
import { SectionRenderer } from './section-renderer'
import { getSectionId, threadToAnnotation } from './review-sdk'
import type {
  AnnotationAnchor,
  AnnotationColor,
  AnnotationStatus,
  AnnotationTarget,
  DocViewProps,
  DocViewReviewActionEvent,
  TextRangeAnchor,
} from './types'

/**
 * DocView — Document annotation overlay container.
 *
 * Wraps any React content (children) and provides:
 * - Text selection detection within the container
 * - Inline annotation popup (note + color picker)
 * - Highlighted annotation overlay on text
 * - Sidebar panel for annotation management
 * - AI revision loop (batch submit, individual revision, orphan detection)
 * - Multi-granularity annotation: text selection + component targets (chart, KPI, table)
 * - No internal StateProvider — uses own state or controlled props
 *
 * Supports two rendering modes:
 * 1. Children mode (manual): Wrap arbitrary React content with annotation overlay
 * 2. Sections mode (AI-driven): Pass a `sections` array from DocViewSchema and
 *    SectionRenderer converts it into rendered React elements
 *
 * Usage (children mode):
 * ```tsx
 * <DocView
 *   annotations={annotations}
 *   onAnnotationsChange={setAnnotations}
 *   onAction={(name, params) => handleAction(name, params)}
 * >
 *   <Renderer spec={spec} registry={registry} />
 * </DocView>
 * ```
 *
 * Usage (sections mode — AI-driven):
 * ```tsx
 * <DocView
 *   sections={[{ type: 'text', content: 'Hello' }, { type: 'chart', content: '', data: {...} }]}
 *   onAction={(name, params) => handleAction(name, params)}
 * />
 * ```
 */
/**
 * json-render 适配 wrapper
 * 所有 vizual 组件接收 { props } 格式，DocView 也必须遵循
 *
 * 同时支持两种调用方式：
 * 1. json-render 格式: <DocView props={{ sections, showPanel }} />
 * 2. 直接传 props:     <DocView sections={sections} showPanel={showPanel} />
 */
export function DocView(rawProps: DocViewProps & { props?: DocViewProps; children?: React.ReactNode }) {
  const { props, children, ...directProps } = rawProps
  const p = (props && Object.keys(props).length > 0) ? props : directProps
  return <DocViewInner {...p}>{children ?? (props as DocViewProps)?.children}</DocViewInner>
}

function targetTypeFromTargetId(targetId: string): AnnotationTarget['targetType'] {
  if (targetId.startsWith('chart-')) return 'chart'
  if (targetId.startsWith('kpi-')) return 'kpi'
  if (targetId.startsWith('table-')) return 'table'
  if (targetId.startsWith('callout-')) return 'callout'
  if (targetId.startsWith('component-')) return 'component'
  if (targetId.startsWith('freeform-')) return 'freeform'
  if (targetId.startsWith('markdown-')) return 'markdown'
  if (targetId.startsWith('heading-')) return 'heading'
  return 'text'
}

function buildTextRangeAnchor(range: Range, sectionEl: HTMLElement, selectedText: string): TextRangeAnchor | undefined {
  try {
    const preRange = range.cloneRange()
    preRange.selectNodeContents(sectionEl)
    preRange.setEnd(range.startContainer, range.startOffset)
    const start = preRange.toString().length
    const end = start + selectedText.length
    const content = sectionEl.textContent || ''
    return {
      start,
      end,
      selectedText,
      quoteBefore: content.slice(Math.max(0, start - 40), start),
      quoteAfter: content.slice(end, Math.min(content.length, end + 40)),
    }
  } catch {
    return { start: 0, end: selectedText.length, selectedText }
  }
}

function DocViewInner({
  children,
  sections,
  annotations: controlledAnnotations,
  onAnnotationsChange,
  threads: controlledThreads,
  onThreadsChange,
  revisionProposals: controlledRevisionProposals,
  onRevisionProposalsChange,
  onSectionsChange,
  onReviewAction,
  controllerRef,
  showPanel = true,
  panelPosition = 'right',
  onAction,
  className,
  style,
}: DocViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // State for target-based annotation (clicking a non-text element like chart/KPI/table)
  const [targetAnnotation, setTargetAnnotation] = useState<{
    target: AnnotationTarget
    position: { top: number; left: number }
  } | null>(null)

  const emitReviewAction = useCallback((event: DocViewReviewActionEvent) => {
    onReviewAction?.(event)

    // Legacy onAction bridge. New hosts should use onReviewAction/controllerRef.
    switch (event.type) {
      case 'threadCreated': {
        onAction?.('annotationAdded', {
          annotation: threadToAnnotation(event.thread),
          sectionContext: event.sectionContext,
          thread: event.thread,
        })
        break
      }
      case 'threadDeleted':
        onAction?.('annotationDeleted', { annotation: threadToAnnotation(event.thread), thread: event.thread })
        break
      case 'threadsSubmitted': {
        const annotations = event.threads.map(thread => ({
          ...threadToAnnotation(thread),
          sectionContext: event.sectionContexts[thread.id],
        }))
        onAction?.('batchSubmit', { annotations, threads: event.threads, sectionContexts: event.sectionContexts })
        if (event.threads.length === 1) {
          const thread = event.threads[0]
          onAction?.('requestRevision', {
            annotationId: thread.id,
            threadId: thread.id,
            text: thread.anchor.textRange?.selectedText || thread.anchor.label,
            note: thread.comments[0]?.body || '',
            target: thread.anchor,
            sectionContext: event.sectionContexts[thread.id],
          })
        }
        break
      }
      case 'revisionProposalCreated':
        onAction?.('revisionProposalCreated', { proposal: event.proposal, threads: event.threads })
        break
      case 'revisionAccepted':
        onAction?.('revisionAccepted', { proposal: event.proposal, threads: event.threads })
        break
      case 'revisionRejected':
        onAction?.('revisionRejected', { proposal: event.proposal, threads: event.threads })
        break
      case 'revisionApplied':
        onAction?.('revisionApplied', { proposal: event.proposal, sections: event.sections, threads: event.threads })
        break
    }
  }, [onAction, onReviewAction])

  const {
    threads,
    revisionProposals,
    reviewAnnotations: annotations,
    controller,
  } = useReviewController({
    sections,
    annotations: controlledAnnotations,
    onAnnotationsChange,
    threads: controlledThreads,
    onThreadsChange,
    revisionProposals: controlledRevisionProposals,
    onRevisionProposalsChange,
    onSectionsChange,
    onReviewAction: emitReviewAction,
  })

  const { selection, clearSelection } = useTextSelection({
    containerRef,
    ignoreSelectors: ['button', 'canvas', 'svg', '.echarts-for-html', '[data-docview-ignore]'],
    onSelectionChange: () => { if (targetAnnotation) setTargetAnnotation(null) },
  })

  useEffect(() => {
    if (!controllerRef) return
    if (typeof controllerRef === 'function') {
      controllerRef(controller)
      return () => controllerRef(null)
    }
    controllerRef.current = controller
    return () => { controllerRef.current = null }
  }, [controller, controllerRef])

  const drafts = threads.length > 0
    ? threads.filter(t => t.status === 'open').map(threadToAnnotation)
    : annotations.filter(a => a.status === 'draft')
  const orphans = threads.length > 0
    ? threads.filter(t => t.status === 'orphaned').map(threadToAnnotation)
    : annotations.filter(a => a.status === 'orphaned')
  const submitAllDrafts = useCallback(() => {
    controller.submitThreads()
  }, [controller])

  // Auto-detect orphaned annotations when sections change (AI returns revised content)
  // Extracts all text from sections and passes to onContentRevised which calls markOrphans.
  // Annotations whose text is no longer found in the revised content are marked 'orphaned'.
  useEffect(() => {
    if (!sections || sections.length === 0) return
    const allText = sections
      .map(s => {
        if (typeof s.content === 'string') return s.content
        if (s.data && typeof s.data === 'object') return JSON.stringify(s.data)
        return ''
      })
      .filter(Boolean)
      .join(' ')
    if (allText) {
      threads.forEach(thread => {
        const selected = thread.anchor.textRange?.selectedText || ''
        if (selected && thread.status !== 'orphaned' && !allText.includes(selected)) {
          controller.updateThreadStatus(thread.id, 'orphaned')
        }
      })
    }
  }, [sections, threads, controller])

  // Confirm annotation from text selection
  const handleConfirmAnnotation = useCallback((note: string, color: AnnotationColor) => {
    if (!selection) return

    // Resolve section index from the DOM range by walking up to [data-section-index]
    let sectionIndex = -1
    let sectionType: AnnotationTarget['targetType'] = 'text'
    let sectionEl: HTMLElement | null = null
    let targetId: string | undefined
    let sectionId: string | undefined
    try {
      const node = selection.range.commonAncestorContainer
      const el = node instanceof HTMLElement ? node : node.parentElement
      sectionEl = el?.closest('[data-section-index]') as HTMLElement | null
      if (sectionEl) {
        sectionIndex = parseInt(sectionEl.getAttribute('data-section-index') || '-1', 10)
        targetId = sectionEl.getAttribute('data-docview-target') || undefined
        sectionId = sectionEl.getAttribute('data-section-id') || undefined
        sectionType = targetTypeFromTargetId(targetId || '')
      }
    } catch { /* DOM traversal failure, leave sectionIndex = -1 */ }

    const section = sectionIndex >= 0 && sections && sectionIndex < sections.length ? sections[sectionIndex] : undefined
    const anchor: AnnotationAnchor = {
      sectionIndex,
      sectionId: sectionId || (section ? getSectionId(section, sectionIndex) : undefined),
      targetType: sectionType,
      targetId,
      targetPath: targetId ? `[data-docview-target="${targetId}"]` : undefined,
      label: section?.content?.substring(0, 50) || selection.text.substring(0, 50) || section?.type || 'Text',
      textRange: sectionEl ? buildTextRangeAnchor(selection.range, sectionEl, selection.text) : { start: 0, end: selection.text.length, selectedText: selection.text },
    }

    controller.createThread({ anchor, body: note, color })

    clearSelection()
  }, [selection, controller, clearSelection, sections])

  // Handle click on a non-text target element (chart, KPI, table cell, etc.)
  const handleTargetClick = useCallback((target: AnnotationTarget, element: HTMLElement) => {
    // Close text selection popup when opening target popup — only one popup at a time
    if (selection) clearSelection()
    const rect = element.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setTargetAnnotation({
      target,
      position: {
        top: rect.bottom - containerRect.top + 8,
        left: rect.left - containerRect.left + rect.width / 2,
      },
    })
  }, [selection, clearSelection])

  // Confirm annotation from clicking a non-text target
  const handleConfirmTargetAnnotation = useCallback((note: string, color: AnnotationColor) => {
    if (!targetAnnotation) return
    const section = sections?.[targetAnnotation.target.sectionIndex]
    const anchor: AnnotationAnchor = {
      ...targetAnnotation.target,
      sectionId: targetAnnotation.target.sectionId || (section ? getSectionId(section, targetAnnotation.target.sectionIndex) : undefined),
      targetPath: targetAnnotation.target.targetPath || (targetAnnotation.target.targetId ? `[data-docview-target="${targetAnnotation.target.targetId}"]` : undefined),
    }
    controller.createThread({ anchor, body: note, color })
    setTargetAnnotation(null)
  }, [targetAnnotation, controller, sections])

  const handleDeleteAnnotation = useCallback((id: string) => {
    controller.deleteThread(id)
  }, [controller])

  const handleUpdateStatus = useCallback((id: string, status: AnnotationStatus) => {
    if (status === 'active') {
      controller.submitThreads([id])
    } else if (status === 'resolved') {
      controller.resolveThread(id)
    } else if (status === 'orphaned') {
      controller.updateThreadStatus(id, 'orphaned')
    } else {
      controller.reopenThread(id)
    }
  }, [controller])

  // Determine content: sections mode (AI-driven) vs children mode (manual)
  const renderedContent = sections && sections.length > 0
    ? <SectionRenderer sections={sections} onTargetClick={handleTargetClick} annotations={annotations} />
    : children

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: panelPosition === 'bottom' ? 'column' : 'row',
    position: 'relative',
    width: '100%',
    height: '100%',
    ...style,
  }

  const contentStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    overflow: 'auto',
    minHeight: 0,
    background: tcss('--rk-bg-primary'),
    display: 'flex',
    justifyContent: 'center',
  }

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      {/* Main content area — export target should use [data-docview-viewport] */}
      <div ref={contentRef} data-docview-viewport style={contentStyle}>
        <AnnotationOverlay
          annotations={annotations}
          onHighlightClick={(ann) => onAction?.('annotationClicked', { annotation: ann })}
          containerRef={containerRef}
        >
          {renderedContent}
        </AnnotationOverlay>

        {/* Annotation input popup for text selection */}
        {selection && (
          <AnnotationInput
            position={selection.position}
            selectedText={selection.text}
            onConfirm={handleConfirmAnnotation}
            onCancel={clearSelection}
            containerWidth={contentRef.current?.clientWidth}
          />
        )}

        {/* Annotation input popup for target-based (non-text) elements */}
        {targetAnnotation && (
          <AnnotationInput
            key={`${targetAnnotation.target.sectionIndex}-${targetAnnotation.target.targetId || targetAnnotation.target.label}`}
            position={targetAnnotation.position}
            selectedText={targetAnnotation.target.label}
            onConfirm={handleConfirmTargetAnnotation}
            onCancel={() => setTargetAnnotation(null)}
            containerWidth={contentRef.current?.clientWidth}
          />
        )}
      </div>

      {/* Annotation panel with revision controls */}
      {showPanel && (
        <AnnotationPanel
          annotations={annotations}
          threads={threads}
          revisionProposals={revisionProposals}
          onDelete={handleDeleteAnnotation}
          onUpdateStatus={handleUpdateStatus}
          onClickAnnotation={(ann) => onAction?.('annotationClicked', { annotation: ann })}
          position={panelPosition}
          drafts={drafts}
          orphans={orphans}
          onSubmitAllDrafts={submitAllDrafts}
          onSubmitThread={(threadId) => controller.submitThreads([threadId])}
          onApplyRevision={(proposalId) => controller.applyRevision(proposalId)}
          onRejectRevision={(proposalId) => controller.rejectRevision(proposalId)}
        />
      )}
    </div>
  )
}
