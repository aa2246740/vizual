import type { ProgressBarProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

const SIZES = {
  sm: { track: 6, text: 11 },
  md: { track: 12, text: 12 },
  lg: { track: 20, text: 13 },
} as const

const VARIANT_COLORS: Record<string, { bar: string; bg: string }> = {
  default: { bar: tcss('--rk-accent'), bg: tcss('--rk-accent-muted') },
  success: { bar: tcss('--rk-success'), bg: tcss('--rk-success-muted') },
  warning: { bar: tcss('--rk-warning'), bg: tcss('--rk-warning-muted') },
  error: { bar: tcss('--rk-error'), bg: tcss('--rk-error-muted') },
  gradient: { bar: tcss('--rk-accent'), bg: tcss('--rk-accent-muted') },
}

export function ProgressBar({ props }: { props: ProgressBarProps }) {
  const size = SIZES[props.size || 'md']
  const variant = props.variant || 'default'
  const colors = VARIANT_COLORS[variant]

  // 多段进度条模式
  if (props.segments && props.segments.length > 0) {
    return (
      <div style={{ padding: '8px 0' }}>
        {props.title && (
          <div style={{ fontSize: 13, color: tcss('--rk-text-secondary'), marginBottom: 6 }}>
            {props.title}
          </div>
        )}
        <div style={{
          display: 'flex',
          height: size.track,
          borderRadius: size.track / 2,
          background: tcss('--rk-bg-tertiary'),
          overflow: 'hidden',
          gap: 2,
        }}>
          {props.segments.map((seg, i) => {
            const pct = Math.min(100, Math.max(0, seg.value))
            return (
              <div
                key={i}
                style={{
                  width: pct + '%',
                  height: '100%',
                  background: seg.color || tc('--rk-chart-' + ((i % 6) + 1)),
                  borderRadius: size.track / 2,
                  transition: 'width 0.3s ease',
                }}
                title={seg.label ? `${seg.label}: ${pct}%` : `${pct}%`}
              />
            )
          })}
        </div>
        {props.showValue !== false && (
          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            {props.segments.map((seg, i) => (
              <span key={i} style={{ fontSize: size.text, color: tcss('--rk-text-tertiary'), display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color || tc('--rk-chart-' + ((i % 6) + 1)), display: 'inline-block' }} />
                {seg.label || `段${i + 1}`} {seg.value}%
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 单段进度条
  const pct = Math.min(100, Math.max(0, props.value))
  const barBg = variant === 'gradient'
    ? `linear-gradient(90deg, ${tc('--rk-accent')}, ${tc('--rk-accent-hover')})`
    : colors.bar

  return (
    <div style={{ padding: '8px 0' }}>
      {props.title && (
        <div style={{ fontSize: 13, color: tcss('--rk-text-secondary'), marginBottom: 6 }}>
          {props.title}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1,
          height: size.track,
          borderRadius: size.track / 2,
          background: tcss('--rk-bg-tertiary'),
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: pct + '%',
            height: '100%',
            borderRadius: size.track / 2,
            background: barBg,
            transition: 'width 0.6s ease',
            ...(props.striped ? {
              backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%)`,
              backgroundSize: `${size.track * 2}px ${size.track * 2}px`,
            } : {}),
            ...(props.animated ? {
              animation: 'rk-progress-stripe 1s linear infinite',
            } : {}),
          }} />
        </div>
        {props.showValue !== false && (
          <span style={{ fontSize: size.text, color: tcss('--rk-text-secondary'), minWidth: 36, textAlign: 'right' }}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
      {props.label && (
        <div style={{ fontSize: 11, color: tcss('--rk-text-tertiary'), marginTop: 2 }}>
          {props.label}
        </div>
      )}
      <style>{`
        @keyframes rk-progress-stripe {
          from { background-position: ${size.track * 2}px 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  )
}
