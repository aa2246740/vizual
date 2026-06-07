import React from 'react'
import type { RowProps } from './schema'

const justifyMap: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  between: 'space-between', around: 'space-around',
  'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly',
  'flex-start': 'flex-start', 'flex-end': 'flex-end',
}

const alignMap: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch',
  'flex-start': 'flex-start', 'flex-end': 'flex-end', baseline: 'baseline',
}

export function Row({
  props,
  children,
  emit = () => undefined,
}: {
  props: RowProps
  children?: React.ReactNode
  emit?: (event: string) => void
}) {
  const { align = 'stretch', justify = 'start', gap = 8, wrap = false, action, disabled = false } = props
  const actionable = Boolean(action) && !disabled
  const trigger = () => {
    if (!actionable || !action) return
    emit('press')
    emit(action)
  }
  return (
    <div
      role={actionable ? 'button' : undefined}
      tabIndex={actionable ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onClick={trigger}
      onKeyDown={(event) => {
        if (!actionable) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          trigger()
        }
      }}
      style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: alignMap[align] || 'stretch',
      justifyContent: justifyMap[justify] || 'flex-start',
      gap,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      minWidth: 0,
      width: '100%',
      cursor: actionable ? 'pointer' : undefined,
      opacity: disabled ? 0.5 : undefined,
    }}>
      {children}
    </div>
  )
}
