import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { GridLayoutProps } from './schema'

/**
 * GridLayout — CSS Grid container for composing child components.
 * Uses json-render's children mechanism.
 */
export function GridLayout({ props, children }: { props: GridLayoutProps; children?: React.ReactNode }) {
  const { columns = 2, gap = 12, columnWidths } = props
  const templateColumns = columnWidths?.length
    ? columnWidths.join(' ')
    : `repeat(${columns}, 1fr)`

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: templateColumns,
      gap,
    }}>
      {children}
    </div>
  )
}
