import React, { useMemo, useEffect, useRef, useCallback } from 'react'
import type { Annotation } from './types'

export interface AnnotationOverlayProps {
  /** Content to render with annotations overlaid */
  children: React.ReactNode
  /** Current annotations to highlight */
  annotations: Annotation[]
  /** Called when a highlight is clicked */
  onHighlightClick?: (annotation: Annotation) => void
  /** Ref to the content container for scanning target elements */
  containerRef?: React.RefObject<HTMLElement | null>
}

/**
 * Renders highlighted annotations over text content and applies visual outlines
 * to component targets (chart, kpi, table) that have annotations.
 *
 * Text-based highlighting:
 * - Uses DOM-based approach: walks text nodes and wraps matches in <mark> elements
 * - Non-destructive: original React tree is preserved, highlights are overlaid via DOM manipulation
 * - Highlights are cleaned up and re-applied on each render cycle
 *
 * Component-target highlighting:
 * - Scans the container DOM for elements with data-docview-target attributes
 * - Applies colored outlines to elements that have matching annotations
 * - Uses MutationObserver to detect dynamically added targets
 */
export function AnnotationOverlay({ children, annotations, onHighlightClick, containerRef }: AnnotationOverlayProps) {
  const contentRef = useRef<HTMLSpanElement>(null)

  // Filter to active (non-orphaned) text annotations for highlighting
  const activeAnnotations = useMemo(() =>
    annotations.filter(a => a.status !== 'orphaned' && !a.target),
    [annotations]
  )

  // Stable callback ref for highlight clicks
  const handleClick = useCallback((ann: Annotation) => {
    onHighlightClick?.(ann)
  }, [onHighlightClick])

  // Apply text-based highlighting via DOM manipulation (non-destructive)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    // Step 1: Remove all previous highlights (cleanup from last render)
    el.querySelectorAll('[data-annotation-highlight]').forEach(mark => {
      const parent = mark.parentNode
      if (!parent) return
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
      parent.removeChild(mark)
    })
    el.normalize() // Merge adjacent text nodes after removing marks

    // Step 2: Apply highlights for each active annotation
    if (activeAnnotations.length === 0) return

    for (const ann of activeAnnotations) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const textNode = walker.currentNode as Text
        const text = textNode.textContent ?? ''
        const idx = text.indexOf(ann.text)
        if (idx === -1) continue

        try {
          const range = document.createRange()
          range.setStart(textNode, idx)
          range.setEnd(textNode, idx + ann.text.length)

          const mark = document.createElement('mark')
          mark.style.cssText = `background:rgba(251,191,36,0.35);border-bottom:2px solid #fbbf24;color:#000;cursor:pointer;padding:1px 2px;border-radius:2px;transition:background 0.15s;`
          mark.setAttribute('data-annotation-highlight', ann.id)
          mark.addEventListener('click', () => handleClick(ann))

          range.surroundContents(mark)
          break // Only highlight first occurrence per annotation
        } catch {
          // range.surroundContents fails if range crosses element boundaries — skip
        }
      }
    }
  }, [activeAnnotations, children, handleClick])

  return (
    <>
      <span ref={contentRef}>{children}</span>
      {containerRef && (
        <TargetHighlighter annotations={annotations} containerRef={containerRef} />
      )}
    </>
  )
}

/**
 * Applies visual indicators to component targets (chart, kpi, table) that have annotations.
 * Scans the container for elements with data-section-index and data-target-type attributes
 * and applies a colored outline if a matching annotation exists.
 * Uses MutationObserver to detect dynamically added targets.
 */
function TargetHighlighter({
  annotations,
  containerRef,
}: {
  annotations: Annotation[]
  containerRef: React.RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Find all target annotations (non-text)
    const targetAnns = annotations.filter(a => a.target)

    /**
     * Apply or remove outlines on component targets based on current annotations.
     * First clears all existing target highlights, then applies new ones.
     */
    const applyHighlights = () => {
      // Remove all existing target highlights
      container.querySelectorAll('[data-docview-annotated]').forEach(el => {
        const htmlEl = el as HTMLElement
        htmlEl.style.outline = ''
        htmlEl.style.outlineOffset = ''
        htmlEl.removeAttribute('data-docview-annotated')
      })

      // Apply highlights for each target annotation
      for (const ann of targetAnns) {
        if (!ann.target || ann.status === 'orphaned') continue
        // Skip chart data point annotations — handled by ECharts dispatchAction in ChartSection
        if (ann.target.chartDataPoint) continue
        // Use targetId for precise element matching (e.g., "kpi-3-1" not all kpi-3)
        const selector = ann.target.targetId
          ? `[data-docview-target="${ann.target.targetId}"]`
          : `[data-section-index="${ann.target.sectionIndex}"][data-target-type="${ann.target.targetType}"]`
        const elements = container.querySelectorAll(selector)
        elements.forEach(el => {
          const htmlEl = el as HTMLElement
          htmlEl.style.outline = `2px solid #fbbf24`
          htmlEl.style.outlineOffset = '2px'
          htmlEl.setAttribute('data-docview-annotated', ann.id)
        })
      }
    }

    applyHighlights()

    // Re-apply on DOM changes (sections may load asynchronously)
    const observer = new MutationObserver(applyHighlights)
    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [annotations, containerRef])

  return null
}
