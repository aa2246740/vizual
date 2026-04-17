import React, { useMemo } from 'react'
import Highlighter from 'react-highlight-words'
import type { Annotation } from './types'

export interface AnnotationOverlayProps {
  /** Content to render with annotations overlaid */
  children: React.ReactNode
  /** Current annotations to highlight */
  annotations: Annotation[]
  /** Called when a highlight is clicked */
  onHighlightClick?: (annotation: Annotation) => void
}

/**
 * Renders highlighted annotations over text content.
 *
 * Uses a text-based matching approach (not character offsets):
 * - Searches for annotation text within the rendered text content
 * - This means highlights survive minor content changes (AI revisions)
 * - Orphaned annotations (text not found) are skipped silently
 *
 * Implementation: uses react-highlight-words for robust text matching,
 * wrapping matches in styled <mark> elements.
 */
export function AnnotationOverlay({ children, annotations, onHighlightClick }: AnnotationOverlayProps) {
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

  // If no active annotations, just render children directly
  if (annotationMap.size === 0) return <>{children}</>

  // Collect search words and their annotation mappings
  const searchWords = Array.from(annotationMap.keys())
  if (searchWords.length === 0) return <>{children}</>

  return (
    <AnnotationHighlightWrapper
      searchWords={searchWords}
      annotationMap={annotationMap}
      onHighlightClick={onHighlightClick}
    >
      {children}
    </AnnotationHighlightWrapper>
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
