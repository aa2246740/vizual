import React, { useMemo, useEffect } from 'react'
import Highlighter from 'react-highlight-words'
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
 * - Uses text-based matching approach (not character offsets)
 * - Searches for annotation text within the rendered text content
 * - Highlights survive minor content changes (AI revisions)
 * - Orphaned annotations (text not found) are skipped silently
 *
 * Component-target highlighting:
 * - Scans the container DOM for elements with data-docview-target attributes
 * - Applies colored outlines to elements that have matching annotations
 * - Uses MutationObserver to detect dynamically added targets
 */
export function AnnotationOverlay({ children, annotations, onHighlightClick, containerRef }: AnnotationOverlayProps) {
  // Build a map of annotation texts to annotations for fast lookup
  const annotationMap = useMemo(() => {
    const map = new Map<string, Annotation>()
    for (const ann of annotations) {
      if (ann.status !== 'orphaned') {
        map.set(ann.text, ann)
      }
    }
    return map
  }, [annotations])

  // Collect search words for text-based highlighting
  const searchWords = Array.from(annotationMap.keys())
  const hasTextAnnotations = searchWords.length > 0

  return (
    <>
      {/* Text-based highlighting */}
      {hasTextAnnotations ? (
        <AnnotationHighlightWrapper
          searchWords={searchWords}
          annotationMap={annotationMap}
          onHighlightClick={onHighlightClick}
        >
          {children}
        </AnnotationHighlightWrapper>
      ) : (
        <>{children}</>
      )}

      {/* Component-target highlighting (chart, kpi, table outlines) */}
      {containerRef && (
        <TargetHighlighter annotations={annotations} containerRef={containerRef} />
      )}
    </>
  )
}

/** Internal component that performs the actual text highlighting using react-highlight-words */
function AnnotationHighlightWrapper({
  searchWords,
  annotationMap,
  onHighlightClick,
  children,
}: {
  searchWords: string[]
  annotationMap: Map<string, Annotation>
  onHighlightClick?: (annotation: Annotation) => void
  children: React.ReactNode
}) {
  // Extract text content from children for highlighting
  const textContent = extractText(children)

  return (
    <Highlighter
      highlightTag={({ children: highlightChildren, highlightIndex }) => {
        const word = searchWords[highlightIndex]
        const annotation = word ? annotationMap.get(word) : undefined
        return (
          <mark
            style={{
              background: annotation ? `${annotation.color}40` : '#fbbf2440',
              borderBottom: `2px solid ${annotation?.color ?? '#fbbf24'}`,
              cursor: 'pointer',
              padding: '1px 0',
              borderRadius: 2,
              transition: 'background 0.15s',
            }}
            onClick={() => annotation && onHighlightClick?.(annotation)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = `${annotation?.color ?? '#fbbf24'}60`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = `${annotation?.color ?? '#fbbf24'}40`
            }}
            title={annotation?.note || ''}
          >
            {highlightChildren}
          </mark>
        )
      }}
      searchWords={searchWords}
      autoEscape={true}
      textToHighlight={textContent}
    />
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
        const selector = `[data-section-index="${ann.target.sectionIndex}"][data-target-type="${ann.target.targetType}"]`
        const elements = container.querySelectorAll(selector)
        elements.forEach(el => {
          const htmlEl = el as HTMLElement
          htmlEl.style.outline = `2px solid ${ann.color}`
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

/**
 * Extract plain text from React children recursively.
 *
 * Handles all common React child types:
 * - strings and numbers (leaf values)
 * - null, undefined, boolean (ignored, returns '')
 * - arrays (each element recursively extracted)
 * - React fragments (type === React.Fragment): recurse into props.children
 * - React elements with props.children: recurse into props.children
 */
function extractText(children: React.ReactNode): string {
  // Leaf string value
  if (typeof children === 'string') return children
  // Leaf number value
  if (typeof children === 'number') return String(children)
  // Null, undefined, boolean — nothing to extract
  if (children === null || children === undefined || typeof children === 'boolean') return ''
  // Array of children — recurse and concatenate
  if (Array.isArray(children)) return children.map(extractText).join('')
  // React element
  if (React.isValidElement(children)) {
    // React.Fragment: type is React.Fragment, children are in props.children
    const childProps = children.props as { children?: React.ReactNode }
    if (childProps.children !== undefined) {
      return extractText(childProps.children)
    }
    return ''
  }
  // All other cases
  return ''
}
