import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { HeroLayoutProps } from './schema'

/**
 * HeroLayout — 顶部大横幅区域，用于落地页标题、仪表盘头图等。
 * 支持标题/副标题/CTA按钮，带渐变/纯色/透明背景。
 */
export function HeroLayout({ props, children }: { props: HeroLayoutProps; children?: React.ReactNode }) {
  const { height = 200, background = 'gradient', align = 'center', title, subtitle, cta } = props ?? {}
  const childArray = React.Children.toArray(children)
  const hasChildren = childArray.length > 0

  let bg: string
  switch (background) {
    case 'gradient':
      bg = `linear-gradient(135deg, ${tcss('--rk-accent-muted')}, ${tcss('--rk-bg-secondary')})`
      break
    case 'solid':
      bg = tcss('--rk-bg-secondary')
      break
    default:
      bg = 'transparent'
  }

  const alignItems = align === 'top' ? 'flex-start' : align === 'bottom' ? 'flex-end' : 'center'

  return (
    <div style={{
      background: bg,
      minHeight: height,
      display: 'flex',
      alignItems,
      justifyContent: 'center',
      padding: 24,
      borderRadius: tcss('--rk-radius-lg'),
      marginBottom: 16,
    }}>
      {/* 有 children 时优先渲染 children，否则渲染内置的标题布局 */}
      {hasChildren ? childArray : (title || subtitle || cta) ? (
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          {title && (
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              color: tcss('--rk-text-primary'),
              margin: 0,
              lineHeight: 1.3,
            }}>{title}</h1>
          )}
          {subtitle && (
            <p style={{
              fontSize: 16,
              color: tcss('--rk-text-secondary'),
              margin: title ? '12px 0 0' : 0,
              lineHeight: 1.6,
            }}>{subtitle}</p>
          )}
          {cta && (
            <div style={{
              marginTop: 20,
              display: 'inline-block',
              padding: '10px 28px',
              background: tcss('--rk-accent'),
              color: '#fff',
              borderRadius: tcss('--rk-radius-md'),
              fontSize: 14,
              fontWeight: 600,
            }}>{cta}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
