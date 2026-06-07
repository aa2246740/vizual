import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { IconProps } from './schema'

const namedIcons: Record<string, string> = {
  check: '\u2713',
  close: '\u00d7',
  x: '\u00d7',
  plus: '+',
  minus: '-',
  info: 'i',
  warning: '!',
}

export function Icon({ props }: { props: IconProps }) {
  const { name, size = 24, color } = props
  const glyph = namedIcons[name] || name
  const isNamedGlyph = glyph !== name
  return (
    <span
      aria-label={isNamedGlyph ? name : undefined}
      style={{
        fontSize: size,
        lineHeight: 1,
        color: color || tcss('--rk-text-primary'),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size,
        width: isNamedGlyph ? size : 'auto',
        height: size,
        padding: isNamedGlyph ? 0 : '0 2px',
        whiteSpace: 'nowrap',
      }}
    >
      {glyph}
    </span>
  )
}
