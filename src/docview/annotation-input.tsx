import { useState, useRef, useEffect } from 'react'
import type { AnnotationColor } from './types'
import { tc } from '../core/theme-colors'

/** Default annotation color — amber yellow for clear visibility in dark mode */
const DEFAULT_COLOR: AnnotationColor = '#fbbf24'

export interface AnnotationInputProps {
  /** Position to render the popup at (relative to container) */
  position: { top: number; left: number }
  /** Pre-selected text being annotated */
  selectedText: string
  /** Called when user confirms the annotation */
  onConfirm: (note: string, color: AnnotationColor) => void
  /** Called when user cancels the annotation */
  onCancel: () => void
  /** Width of the parent container for boundary clamping */
  containerWidth?: number
}

const POPUP_WIDTH = 280
const POPUP_HALF = POPUP_WIDTH / 2

const popupStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1000,
  background: tc('--rk-bg-secondary'),
  border: `1px solid ${tc('--rk-border-subtle')}`,
  borderRadius: 10,
  padding: 12,
  width: POPUP_WIDTH,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  transform: 'translateX(-50%)',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 60,
  padding: '8px 10px',
  fontSize: 13,
  lineHeight: 1.4,
  background: tc('--rk-bg-primary'),
  border: `1px solid ${tc('--rk-border-subtle')}`,
  borderRadius: 6,
  color: tc('--rk-text-primary'),
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const buttonBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  border: 'none',
  fontWeight: 500,
}

/**
 * Inline popup for text/target annotation input.
 * Shows selected text preview, note textarea, confirm/cancel buttons.
 * Boundary-aware: clamps position to stay within container.
 * Auto-resets note when selectedText changes (new target).
 */
export function AnnotationInput({ position, selectedText, onConfirm, onCancel, containerWidth }: AnnotationInputProps) {
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset note when targeting a different text/element
  useEffect(() => { setNote('') }, [selectedText])

  useEffect(() => { textareaRef.current?.focus() }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (note.trim()) onConfirm(note.trim(), DEFAULT_COLOR)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [note, onConfirm, onCancel])

  const handleSubmit = () => {
    if (note.trim()) onConfirm(note.trim(), DEFAULT_COLOR)
  }

  // Clamp left position to keep popup within container bounds
  const clampedLeft = containerWidth
    ? Math.max(POPUP_HALF + 4, Math.min(position.left, containerWidth - POPUP_HALF - 4))
    : position.left

  return (
    <div style={{ ...popupStyle, top: position.top, left: clampedLeft }} data-annotation-input>
      {/* Selected text preview */}
      <div style={{
        fontSize: 12, color: tc('--rk-text-secondary'), marginBottom: 8,
        padding: '4px 8px', background: tc('--rk-bg-primary'), borderRadius: 4,
        maxHeight: 60, overflow: 'hidden', lineHeight: 1.3,
        borderLeft: `3px solid #fbbf24`,
      }}>
        "{selectedText.length > 100 ? selectedText.slice(0, 100) + '...' : selectedText}"
      </div>

      {/* Note input */}
      <textarea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="添加批注... (Ctrl+Enter 确认)"
        style={textareaStyle}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          ...buttonBase,
          background: tc('--rk-border-subtle'), color: tc('--rk-text-secondary'),
        }}>取消</button>
        <button
          onClick={handleSubmit}
          disabled={!note.trim()}
          style={{
            ...buttonBase,
            background: note.trim() ? '#fbbf24' : tc('--rk-border-subtle'),
            color: note.trim() ? '#000' : tc('--rk-text-tertiary'),
            cursor: note.trim() ? 'pointer' : 'not-allowed',
          }}
        >确认</button>
      </div>
    </div>
  )
}
