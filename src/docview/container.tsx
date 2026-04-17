import { useRef, useCallback, useState } from 'react'
import { useTextSelection } from './use-text-selection'
import { useAnnotations } from './use-annotations'
import { useRevisionLoop } from './use-revision-loop'
import { AnnotationOverlay } from './annotation-overlay'
import { AnnotationPanel } from './annotation-panel'
import { AnnotationInput } from './annotation-input'
import { SectionRenderer } from './section-renderer'
import type { DocViewProps, AnnotationColor, AnnotationStatus, AnnotationTarget } from './types'

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
export function DocView({
  children,
  sections,
  annotations: controlledAnnotations,
  onAnnotationsChange,
  showPanel = true,
  panelPosition = 'right',
  onAction,
  className,
  style,
}: DocViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // State for target-based annotation (clicking a non-text element like chart/KPI/table)
  const [targetAnnotation, setTargetAnnotation] = useState<{
    target: AnnotationTarget
    position: { top: number; left: number }
  } | null>(null)

  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    markOrphans,
  } = useAnnotations({
    annotations: controlledAnnotations,
    onAnnotationsChange,
  })

  const { selection, clearSelection } = useTextSelection({
    containerRef,
    ignoreSelectors: ['button', 'canvas', 'svg', '.echarts-for-html', '[data-docview-ignore]'],
  })

  // Revision loop integration
  const { submitAllDrafts, requestRevision, drafts, orphans } = useRevisionLoop({
    annotations,
    updateAnnotation,
    markOrphans,
    onAction,
  })

  // Confirm annotation from text selection
  const handleConfirmAnnotation = useCallback((note: string, color: AnnotationColor) => {
    if (!selection) return
    const ann = addAnnotation(selection.text, note, color)
    clearSelection()
    onAction?.('annotationAdded', { annotation: ann })
  }, [selection, addAnnotation, clearSelection, onAction])

  // Handle click on a non-text target element (chart, KPI, table cell, etc.)
  const handleTargetClick = useCallback((target: AnnotationTarget, element: HTMLElement) => {
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
  }, [])

  // Confirm annotation from clicking a non-text target
  const handleConfirmTargetAnnotation = useCallback((note: string, color: AnnotationColor) => {
    if (!targetAnnotation) return
    const ann = addAnnotation(targetAnnotation.target.label, note, color)
    // Attach target metadata to the annotation
    updateAnnotation(ann.id, { target: targetAnnotation.target })
    setTargetAnnotation(null)
    onAction?.('annotationAdded', { annotation: ann })
  }, [targetAnnotation, addAnnotation, updateAnnotation, onAction])

  const handleDeleteAnnotation = useCallback((id: string) => {
    const ann = annotations.find(a => a.id === id)
    deleteAnnotation(id)
    if (ann) onAction?.('annotationDeleted', { annotation: ann })
  }, [annotations, deleteAnnotation, onAction])

  const handleUpdateStatus = useCallback((id: string, status: AnnotationStatus) => {
    updateAnnotation(id, { status })
    const ann = annotations.find(a => a.id === id)
    if (ann && status === 'active') {
      requestRevision(id)
    }
  }, [annotations, updateAnnotation, requestRevision])

  // Determine content: sections mode (AI-driven) vs children mode (manual)
  const renderedContent = sections && sections.length > 0
    ? <SectionRenderer sections={sections} onTargetClick={handleTargetClick} />
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
  }

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      {/* Main content area */}
      <div style={contentStyle}>
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
          />
        )}

        {/* Annotation input popup for target-based (non-text) elements */}
        {targetAnnotation && (
          <AnnotationInput
            position={targetAnnotation.position}
            selectedText={targetAnnotation.target.label}
            onConfirm={handleConfirmTargetAnnotation}
            onCancel={() => setTargetAnnotation(null)}
          />
        )}
      </div>

      {/* Annotation panel with revision controls */}
      {showPanel && (
        <AnnotationPanel
          annotations={annotations}
          onDelete={handleDeleteAnnotation}
          onUpdateStatus={handleUpdateStatus}
          onClickAnnotation={(ann) => onAction?.('annotationClicked', { annotation: ann })}
          position={panelPosition}
          drafts={drafts}
          orphans={orphans}
          onSubmitAllDrafts={submitAllDrafts}
        />
      )}
    </div>
  )
}
