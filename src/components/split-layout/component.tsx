import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { SplitLayoutProps } from './schema'

/**
 * SplitLayout — Two-pane split container for side-by-side or stacked layouts.
 */
export function SplitLayout({ props, children }: { props: SplitLayoutProps; children?: React.ReactNode }) {
  const { direction = 'horizontal', ratio = 50, gap = 0 } = props
  const isHorizontal = direction === 'horizontal'

  // Wrap children in two panes
  const childArray = React.Children.toArray(children)
  const primary = childArray[0] ?? null
  const secondary = childArray[1] ?? null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isHorizontal ? `${ratio}% ${100 - ratio}%` : '1fr',
      gridTemplateRows: isHorizontal ? '1fr' : `${ratio}% ${100 - ratio}%`,
      gap,
      width: '100%',
    }}>
      <div>{primary}</div>
      <div>{secondary}</div>
    </div>
  )
}
