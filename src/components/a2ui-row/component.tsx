import React from 'react'
import type { RowProps } from './schema'

const justifyMap: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  between: 'space-between', around: 'space-around',
}

export function Row({ props, children }: { props: RowProps; children?: React.ReactNode }) {
  const { align = 'stretch', justify = 'start', gap = 8, wrap = false } = props
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: align,
      justifyContent: justifyMap[justify] || 'flex-start',
      gap,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      minWidth: 0,
      width: '100%',
    }}>
      {children}
    </div>
  )
}
