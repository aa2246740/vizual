import React, { useState } from 'react'
import { tcss } from '../../core/theme-colors'
import type { ButtonProps } from './schema'

const sizes: Record<string, React.CSSProperties> = {
  small: { padding: '4px 12px', fontSize: 12 },
  medium: { padding: '8px 16px', fontSize: 14 },
  large: { padding: '12px 24px', fontSize: 16 },
}

export function Button({
  props,
  emit = () => undefined,
}: {
  props: ButtonProps
  emit?: (event: string) => void
}) {
  const { label, text, variant = 'primary', disabled = false, size = 'medium', action } = props
  const [pressed, setPressed] = useState(false)
  const isPrimary = variant === 'primary'
  const isGhost = variant === 'ghost'
  const content = label ?? text ?? ''

  return (
    <button
      disabled={disabled}
      data-clicked={pressed ? 'true' : 'false'}
      onClick={() => {
        setPressed(true)
        emit('press')
        if (action) emit(action)
      }}
      style={{
        ...sizes[size],
        border: isGhost ? 'none' : `1px solid ${isPrimary ? 'transparent' : tcss('--rk-border')}`,
        borderRadius: 8,
        background: isPrimary ? tcss('--rk-accent') : isGhost ? 'transparent' : tcss('--rk-bg-tertiary'),
        color: isPrimary ? '#fff' : tcss('--rk-text-primary'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontWeight: 500,
        fontFamily: tcss('--rk-font-sans'),
        transition: 'opacity 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        maxWidth: '100%',
        height: 'fit-content',
        lineHeight: 1.25,
        textAlign: 'center',
      }}
    >
      {content}
    </button>
  )
}
