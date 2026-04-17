import { useRef, useCallback } from 'react'
import { useTextSelection } from './use-text-selection'
import { useAnnotations } from './use-annotations'
import { useRevisionLoop } from './use-revision-loop'
import { AnnotationOverlay } from './annotation-overlay'
import { AnnotationPanel } from './annotation-panel'
import { AnnotationInput } from './annotation-input'
import type { DocViewProps, AnnotationColor } from './types'

/**
 * DocView — Document annotation overlay container.
 *
 * Wraps any React content (children) and provides:
 * - Text selection detection within the container
 * - Inline annotation popup (note + color picker)
 * - Highlighted annotation overlay on text
 * - Sidebar panel for annotation management
 * - AI revision loop (batch submit, individual revision, orphan detection)
 * - No internal StateProvider — uses own state or controlled props
 *
 * Usage:
 * ```tsx
 * <DocView
 *   annotations={annotations}
 *   onAnnotationsChange={setAnnotations}
 *   onAction={(name, params) => handleAction(name, params)}
 * >
 *   <Renderer spec={spec} registry={registry} />
 * </DocView>
 * ```
 */
export function DocView({
  children,
  annotations: controlledAnnotations,
  onAnnotationsChange,
  showPanel = true,
  panelPosition = 'right',
  onAction,
  className,
  style,
}: DocViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
  const { submitAllDrafts, requestRevision, drafts, orphans, onContentRevised } = useRevisionLoop({
    annotations,
    updateAnnotation,
    markOrphans,
    onAction,
  })

  const handleConfirmAnnotation = useCallback((note: string, color: AnnotationColor) => {
    if (!selection) return
    const ann = addAnnotation(selection.text, note, color)
    clearSelection()
    onAction?.('annotationAdded', { annotation: ann })
  }, [selection, addAnnotation, clearSelection, onAction])

  const handleDeleteAnnotation = useCallback((id: string) => {
    const ann = annotations.find(a => a.id === id)
    deleteAnnotation(id)
    if (ann) onAction?.('annotationDeleted', { annotation: ann })
  }, [annotations, deleteAnnotation, onAction])

  const handleUpdateStatus = useCallback((id: string, status: Annotation['status']) => {
    updateAnnotation(id, { status })
    const ann = annotations.find(a => a.id === id)
    if (ann && status === 'active') {
      requestRevision(id)
    }
  }, [annotations, updateAnnotation, requestRevision])

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
        >
          {children}
        </AnnotationOverlay>

        {/* Annotation input popup */}
        {selection && (
          <AnnotationInput
            position={selection.position}
            selectedText={selection.text}
            onConfirm={handleConfirmAnnotation}
            onCancel={clearSelection}
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
          onContentRevised={onContentRevised}
        />
      )}
    </div>
  )
}
