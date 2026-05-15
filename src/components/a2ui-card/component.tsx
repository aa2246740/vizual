import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { CardProps } from './schema'

const shadows = [
  'none',
  '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
  '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
]

export function Card({ props, children }: { props: CardProps; children?: React.ReactNode }) {
  const { padding = 16, radius = 12, shadow = 1, background } = props
  return (
    <div style={{
      background: background || tcss('--rk-bg-secondary'),
      borderRadius: radius,
      boxShadow: shadows[shadow] || shadows[1],
      padding,
      minWidth: 0,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}
