import { useState, useEffect, useCallback, useRef } from 'react'

export interface TextSelection {
  /** The selected text content */
  text: string
  /** The DOM Range of the selection */
  range: Range
  /** Approximate position { top, left } relative to the container for popup placement */
  position: { top: number; left: number }
}

export interface UseTextSelectionOptions {
  /** Ref to the container element to monitor for selections */
  containerRef: React.RefObject<HTMLElement | null>
  /** Minimum text length to trigger selection */
  minLength?: number
  /** CSS selectors for elements that should NOT trigger selection (buttons, charts, inputs) */
  ignoreSelectors?: string[]
  /** Called when selection changes (new selection or cleared) */
  onSelectionChange?: (selection: TextSelection | null) => void
}

export interface UseTextSelectionReturn {
  /** Current text selection, null if nothing selected */
  selection: TextSelection | null
  /** Programmatically clear the current selection */
  clearSelection: () => void
}

/**
 * Hook for detecting text selection within a container element.
 *
 * Uses mouseup + selectioncheck pattern:
 * - Only captures selection on mouseup (not during drag), avoiding mid-selection dismiss
 * - Debounces rapid selection changes
 * - Filters out selections on interactive elements
 */
export function useTextSelection(options: UseTextSelectionOptions): UseTextSelectionReturn {
  const { containerRef, minLength = 2, ignoreSelectors = [], onSelectionChange } = options
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const selectionRef = useRef<TextSelection | null>(null)
  const isPopupOpenRef = useRef(false)

  const clearSelection = useCallback(() => {
    setSelection(null)
    selectionRef.current = null
    isPopupOpenRef.current = false
    window.getSelection()?.removeAllRanges()
    onSelectionChange?.(null)
  }, [onSelectionChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ignoreTargets = ['button', 'input', 'select', 'textarea', 'a', '[data-docview-ignore]', ...ignoreSelectors]

    /** Extract TextSelection from current browser selection, or null */
    function extractSelection(): TextSelection | null {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) return null

      const text = sel.toString().trim()
      if (text.length < minLength) return null

      const range = sel.getRangeAt(0)
      if (!container!.contains(range.commonAncestorContainer)) return null

      // Check if selection is within an ignored element
      const target = range.commonAncestorContainer instanceof HTMLElement
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
      if (target && ignoreTargets.some(selector => target.closest(selector))) return null

      // Calculate position relative to container
      const rect = range.getBoundingClientRect()
      const containerRect = container!.getBoundingClientRect()
      const position = {
        top: rect.bottom - containerRect.top + 8,
        left: rect.left - containerRect.left + rect.width / 2,
      }

      return { text, range, position }
    }

    /** On mouseup inside container: capture the selection */
    function handleMouseUp(e: MouseEvent) {
      // Don't capture if popup is open (user might be clicking the popup itself)
      if (isPopupOpenRef.current) return
      // Don't capture if clicking on an existing highlight (avoid duplicate annotations)
      const target = e.target as HTMLElement
      if (target.closest('[data-annotation-highlight]')) return
      // Small delay to let the browser finalize the selection
      setTimeout(() => {
        const result = extractSelection()
        if (result) {
          setSelection(result)
          selectionRef.current = result
          isPopupOpenRef.current = true
          onSelectionChange?.(result)
        }
      }, 10)
    }

    /** On mousedown inside container: clear previous selection if clicking elsewhere */
    function handleMouseDown(e: MouseEvent) {
      if (isPopupOpenRef.current) {
        // Check if click is inside the popup (don't dismiss)
        const target = e.target as HTMLElement
        if (target.closest('[data-annotation-input]')) return
        // Clicking elsewhere in the document dismisses the popup
        setSelection(null)
        selectionRef.current = null
        isPopupOpenRef.current = false
      }
    }

    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [containerRef, minLength, ignoreSelectors])

  return { selection, clearSelection }
}
