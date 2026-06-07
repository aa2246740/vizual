import React from 'react'
import type { ContainerProps } from './schema'

const alignMap: Record<string, React.CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  'flex-start': 'flex-start',
  'flex-end': 'flex-end',
  baseline: 'baseline',
}

const justifyMap: Record<string, React.CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
  'flex-start': 'flex-start',
  'flex-end': 'flex-end',
}

function normalizeWrap(value: ContainerProps['flexWrap']): React.CSSProperties['flexWrap'] {
  if (value === true) return 'wrap'
  if (value === false) return 'nowrap'
  if (value === 'wrap' || value === 'nowrap' || value === 'wrap-reverse') return value
  return 'nowrap'
}

export function Container({
  props,
  children,
  emit = () => undefined,
}: {
  props: ContainerProps
  children?: React.ReactNode
  emit?: (event: string) => void
}) {
  const {
    direction = 'column',
    gap = 8,
    padding,
    margin,
    background,
    border,
    borderRadius,
    radius,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    flex,
    flexWrap,
    alignItems,
    justifyContent,
    action,
    disabled = false,
  } = props
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
        flexDirection: direction,
        gap,
        padding,
        margin,
        background,
        border,
        borderRadius: borderRadius ?? radius,
        width: width ?? '100%',
        height,
        minWidth: minWidth ?? 0,
        minHeight,
        maxWidth,
        flex: typeof flex === 'number' ? `${flex} 1 0` : flex,
        flexWrap: normalizeWrap(flexWrap),
        alignItems: alignItems ? alignMap[alignItems] ?? alignItems : direction === 'row' ? 'center' : 'stretch',
        justifyContent: justifyContent ? justifyMap[justifyContent] ?? justifyContent : 'flex-start',
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: actionable ? 'pointer' : undefined,
        opacity: disabled ? 0.5 : undefined,
      }}
    >
      {children}
    </div>
  )
}
