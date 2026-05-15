import React from 'react'
import type { ColumnProps } from './schema'

const justifyMap: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  between: 'space-between', around: 'space-around',
}

export function Column({ props, children }: { props: ColumnProps; children?: React.ReactNode }) {
  const { align = 'stretch', justify = 'start', gap = 8 } = props
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align,
      justifyContent: justifyMap[justify] || 'flex-start',
      gap,
      minWidth: 0,
      width: '100%',
    }}>
      {children}
    </div>
  )
}
