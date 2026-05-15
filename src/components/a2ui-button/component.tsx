import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { ButtonProps } from './schema'

const sizes: Record<string, React.CSSProperties> = {
  small: { padding: '4px 12px', fontSize: 12 },
  medium: { padding: '8px 16px', fontSize: 14 },
  large: { padding: '12px 24px', fontSize: 16 },
}

export function Button({ props }: { props: ButtonProps }) {
  const { label, variant = 'primary', disabled = false, size = 'medium' } = props
  const isPrimary = variant === 'primary'
  const isGhost = variant === 'ghost'

  return (
    <button
      disabled={disabled}
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
      }}
    >
      {label}
    </button>
  )
}
