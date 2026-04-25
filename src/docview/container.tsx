import React, { useRef, useCallback, useState, useEffect } from 'react'
import { tcss, tc } from '../core/theme-colors'
import { useTextSelection } from './use-text-selection'
import { useAnnotations } from './use-annotations'
import { useRevisionLoop } from './use-revision-loop'
import { AnnotationOverlay } from './annotation-overlay'
import { AnnotationPanel } from './annotation-panel'
import { AnnotationInput } from './annotation-input'
import { SectionRenderer } from './section-renderer'
import { buildSectionContextMap, buildSectionContext } from './section-context'
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

function DocViewInner({
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
  const contentRef = useRef<HTMLDivElement>(null)

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
    onSelectionChange: () => { if (targetAnnotation) setTargetAnnotation(null) },
  })

  // Revision loop integration
  const { submitAllDrafts, requestRevision, onContentRevised, drafts, orphans } = useRevisionLoop({
    annotations,
    updateAnnotation,
    markOrphans,
    onAction,
    sections,  // Pass sections for context enrichment in revision payloads
  })

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
      onContentRevised(allText)
    }
  }, [sections, onContentRevised])

  // Confirm annotation from text selection
  const handleConfirmAnnotation = useCallback((note: string, color: AnnotationColor) => {
    if (!selection) return
    const ann = addAnnotation(selection.text, note, color)

    // Resolve section index from the DOM range by walking up to [data-section-index]
    let sectionIndex = -1
    let sectionType = 'text'
    try {
      const node = selection.range.commonAncestorContainer
      const el = node instanceof HTMLElement ? node : node.parentElement
      const sectionEl = el?.closest('[data-section-index]')
      if (sectionEl) {
        sectionIndex = parseInt(sectionEl.getAttribute('data-section-index') || '-1', 10)
        // Derive targetType from data-docview-target prefix (chart-*, kpi-*, table-*) or default to 'text'
        const targetId = sectionEl.getAttribute('data-docview-target') || ''
        if (targetId.startsWith('chart-')) sectionType = 'chart'
        else if (targetId.startsWith('kpi-')) sectionType = 'kpi'
        else if (targetId.startsWith('table-')) sectionType = 'table'
        else if (targetId.startsWith('callout-')) sectionType = 'callout'
        else if (targetId.startsWith('freeform-')) sectionType = 'freeform'
        else if (targetId.startsWith('markdown-')) sectionType = 'markdown'
        else if (targetId.startsWith('heading-')) sectionType = 'heading'
        // text sections 没有显式 targetId 前缀，默认保持 'text'
      }
    } catch { /* DOM traversal failure, leave sectionIndex = -1 */ }

    // Attach target so buildSectionContextMap can locate the section
    if (sectionIndex >= 0 && sections && sectionIndex < sections.length) {
      updateAnnotation(ann.id, {
        target: {
          sectionIndex,
          targetType: sectionType as AnnotationTarget['targetType'],
          label: sections[sectionIndex].content?.substring(0, 50) || sections[sectionIndex].type,
        }
      })
    }

    clearSelection()
    // Build section contexts — re-read the annotation with target attached
    const annWithTarget = { ...ann, target: sectionIndex >= 0 ? { sectionIndex, targetType: sectionType, label: sections?.[sectionIndex]?.content?.substring(0, 50) || '' } : undefined }
    const sectionContext = sectionIndex >= 0 && sections
      ? buildSectionContext(sections[sectionIndex], sectionIndex)
      : undefined
    onAction?.('annotationAdded', { annotation: annWithTarget, sectionContext })
  }, [selection, addAnnotation, updateAnnotation, clearSelection, onAction, sections])

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
    const ann = addAnnotation(targetAnnotation.target.label, note, color)
    const annWithTarget = { ...ann, target: targetAnnotation.target }
    // Attach target metadata to the annotation
    updateAnnotation(ann.id, { target: targetAnnotation.target })
    setTargetAnnotation(null)
    // Build section context for the targeted section
    const sectionContext = sections && targetAnnotation.target.sectionIndex < sections.length
      ? buildSectionContext(sections[targetAnnotation.target.sectionIndex], targetAnnotation.target.sectionIndex)
      : undefined
    onAction?.('annotationAdded', { annotation: annWithTarget, sectionContext })
  }, [targetAnnotation, addAnnotation, updateAnnotation, onAction, sections])

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
