import { useState, useRef, useEffect } from 'react'
import type { AnnotationColor } from './types'
import { tcss, tc } from '../core/theme-colors'

/** Default annotation color — amber yellow for clear visibility */
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

/** tcss() returns var() references — naturally reactive via CSS engine, safe at module level */
const popupStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1000,
  background: tcss('--rk-bg-secondary'),
  border: `1px solid ${tcss('--rk-border-subtle')}`,
  borderRadius: parseInt(tc('--rk-radius-lg')),
  padding: parseInt(tc('--rk-space-3')),
  width: POPUP_WIDTH,
  boxShadow: tcss('--rk-shadow'),
  transform: 'translateX(-50%)',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 60,
  padding: '8px 10px',
  fontSize: parseInt(tc('--rk-text-base')),
  lineHeight: 1.4,
  background: tcss('--rk-bg-primary'),
  border: `1px solid ${tcss('--rk-border-subtle')}`,
  borderRadius: parseInt(tc('--rk-radius-md')),
  color: tcss('--rk-text-primary'),
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const buttonBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: parseInt(tc('--rk-radius-md')),
  fontSize: parseInt(tc('--rk-text-base')),
  cursor: 'pointer',
  border: 'none',
  fontWeight: parseInt(tc('--rk-weight-medium')),
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
        fontSize: parseInt(tc('--rk-text-sm')), color: tcss('--rk-text-secondary'), marginBottom: 8,
        padding: '4px 8px', background: tcss('--rk-bg-primary'), borderRadius: parseInt(tc('--rk-radius-sm')),
        maxHeight: 60, overflow: 'hidden', lineHeight: 1.3,
        borderLeft: `3px solid ${DEFAULT_COLOR}`,
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
          background: tcss('--rk-border-subtle'), color: tcss('--rk-text-secondary'),
        }}>取消</button>
        <button
          onClick={handleSubmit}
          disabled={!note.trim()}
          style={{
            ...buttonBase,
            background: note.trim() ? tcss('--rk-accent') : tcss('--rk-border-subtle'),
            color: note.trim() ? '#fff' : tcss('--rk-text-tertiary'),
            cursor: note.trim() ? 'pointer' : 'not-allowed',
          }}
        >确认</button>
      </div>
    </div>
  )
}
