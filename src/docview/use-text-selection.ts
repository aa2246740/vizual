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
 * Uses the browser Selection API (selectionchange event) to detect when the user
 * selects text. Filters out selections on interactive elements (buttons, inputs,
 * chart containers) to avoid false positives.
 */
export function useTextSelection(options: UseTextSelectionOptions): UseTextSelectionReturn {
  const { containerRef, minLength = 2, ignoreSelectors = [] } = options
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const selectionRef = useRef<TextSelection | null>(null)

  const clearSelection = useCallback(() => {
    setSelection(null)
    selectionRef.current = null
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        // Don't clear if we just cleared it programmatically
        if (selectionRef.current) {
          setSelection(null)
          selectionRef.current = null
        }
        return
      }

      const text = sel.toString().trim()

      // Minimum length check
      if (text.length < minLength) return

      // Must be within our container
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return

      // Check if selection is within an ignored element
      const ignoreTargets = ['button', 'input', 'select', 'textarea', 'a', '[data-docview-ignore]', ...ignoreSelectors]
      const target = range.commonAncestorContainer instanceof HTMLElement
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
      if (target && ignoreTargets.some(selector => target.closest(selector))) return

      // Calculate position relative to container
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const position = {
        top: rect.bottom - containerRect.top + 8,
        left: rect.left - containerRect.left + rect.width / 2,
      }

      const textSelection: TextSelection = { text, range, position }
      setSelection(textSelection)
      selectionRef.current = textSelection
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [containerRef, minLength, ignoreSelectors])

  return { selection, clearSelection }
}
