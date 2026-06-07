import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { CardProps } from './schema'

const shadows = [
  'none',
  '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
  '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
]

export function Card({
  props,
  children,
  emit = () => undefined,
}: {
  props: CardProps
  children?: React.ReactNode
  emit?: (event: string) => void
}) {
  const {
    title,
    subtitle,
    value,
    unit,
    delta,
    deltaLabel,
    extra,
    padding = 16,
    radius = 12,
    shadow = 1,
    background,
    borderColor,
    borderWidth,
    flex,
    width,
    minHeight,
    height,
    action,
    disabled = false,
  } = props
  const hasMetric = value != null || delta != null || extra
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
      background: background || tcss('--rk-bg-secondary'),
      borderRadius: radius,
      border: borderColor ? `${borderWidth ?? 1}px solid ${borderColor}` : undefined,
      boxShadow: shadows[shadow] || shadows[1],
      padding,
      minWidth: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      flex: typeof flex === 'number' ? `${flex} 1 0` : flex,
      width,
      minHeight,
      height,
      cursor: actionable ? 'pointer' : undefined,
      opacity: disabled ? 0.5 : undefined,
    }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: children ? 12 : 0, minWidth: 0 }}>
          {title && (
            <div style={{
              fontFamily: tcss('--rk-font-display'),
              fontSize: tcss('--rk-text-md'),
              fontWeight: tcss('--rk-weight-semibold'),
              color: tcss('--rk-text-primary'),
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{
              marginTop: title ? 4 : 0,
              fontFamily: tcss('--rk-font-body'),
              fontSize: tcss('--rk-text-sm'),
              color: tcss('--rk-text-secondary'),
              lineHeight: 1.45,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      {hasMetric && (
        <div style={{
          display: 'grid',
          gap: 4,
          marginBottom: children ? 12 : 0,
          minWidth: 0,
        }}>
          {value != null && (
            <div style={{
              fontFamily: tcss('--rk-font-display'),
              fontSize: tcss('--rk-text-2xl'),
              fontWeight: tcss('--rk-weight-bold'),
              color: tcss('--rk-text-primary'),
              lineHeight: 1.1,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(value)}
              {unit && <span style={{ marginLeft: 4, fontSize: tcss('--rk-text-sm'), color: tcss('--rk-text-secondary') }}>{unit}</span>}
            </div>
          )}
          {delta != null && (
            <div style={{
              fontFamily: tcss('--rk-font-ui'),
              fontSize: tcss('--rk-text-sm'),
              color: Number(delta) < 0 ? tcss('--rk-error') : tcss('--rk-success'),
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {[deltaLabel, String(delta)].filter(Boolean).join(' ')}
            </div>
          )}
          {extra && (
            <div style={{
              fontFamily: tcss('--rk-font-body'),
              fontSize: tcss('--rk-text-xs'),
              color: tcss('--rk-text-tertiary'),
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {extra}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
