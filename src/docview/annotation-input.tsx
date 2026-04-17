import { useState, useRef, useEffect } from 'react'
import { ANNOTATION_COLORS, type AnnotationColor } from './types'

export interface AnnotationInputProps {
  /** Position to render the popup at (relative to container) */
  position: { top: number; left: number }
  /** Pre-selected text being annotated */
  selectedText: string
  /** Called when user confirms the annotation */
  onConfirm: (note: string, color: AnnotationColor) => void
  /** Called when user cancels the annotation */
  onCancel: () => void
}

const popupStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1000,
  background: '#1a1a2e',
  border: '1px solid #2a2a4a',
  borderRadius: 10,
  padding: 12,
  width: 280,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  transform: 'translateX(-50%)',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 60,
  padding: '8px 10px',
  fontSize: 13,
  lineHeight: 1.4,
  background: '#111',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
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
 * Inline popup that appears when user selects text.
 * Shows a note input and color picker, then confirms or cancels.
 */
export function AnnotationInput({ position, selectedText, onConfirm, onCancel }: AnnotationInputProps) {
  const [note, setNote] = useState('')
  const [color, setColor] = useState<AnnotationColor>(ANNOTATION_COLORS[0])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (note.trim()) onConfirm(note.trim(), color)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [note, color, onConfirm, onCancel])

  const handleSubmit = () => {
    if (note.trim()) onConfirm(note.trim(), color)
  }

  return (
    <div style={{ ...popupStyle, top: position.top, left: position.left }}>
      {/* Selected text preview */}
      <div style={{
        fontSize: 12, color: '#999', marginBottom: 8,
        padding: '4px 8px', background: '#111', borderRadius: 4,
        maxHeight: 60, overflow: 'hidden', lineHeight: 1.3,
        borderLeft: `3px solid ${color}`,
      }}>
        "{selectedText.length > 100 ? selectedText.slice(0, 100) + '...' : selectedText}"
      </div>

      {/* Note input */}
      <textarea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note... (Ctrl+Enter to confirm)"
        style={textareaStyle}
      />

      {/* Color picker */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#888' }}>Color:</span>
        {ANNOTATION_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: c, border: color === c ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer', padding: 0,
              boxShadow: color === c ? `0 0 8px ${c}60` : 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          ...buttonBase,
          background: '#2a2a2a', color: '#aaa',
        }}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!note.trim()}
          style={{
            ...buttonBase,
            background: note.trim() ? '#3b82f6' : '#2a2a2a',
            color: note.trim() ? '#fff' : '#666',
            cursor: note.trim() ? 'pointer' : 'not-allowed',
          }}
        >Annotate</button>
      </div>
    </div>
  )
}
