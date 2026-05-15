import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { DividerProps } from './schema'

export function Divider({ props }: { props: DividerProps }) {
  const { direction = 'horizontal', spacing = 8, color } = props
  const isHorizontal = direction === 'horizontal'
  return (
    <div style={{
      [isHorizontal ? 'borderBottom' : 'borderRight']: `1px solid ${color || tcss('--rk-border')}`,
      [isHorizontal ? 'margin' : 'margin']: `${spacing}px 0`,
      ...(isHorizontal ? { width: '100%' } : { height: 'auto', alignSelf: 'stretch' }),
    }} />
  )
}
