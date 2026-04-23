import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { HeroLayoutProps } from './schema'

/**
 * HeroLayout — Large prominent section for hero content.
 */
export function HeroLayout({ props, children }: { props: HeroLayoutProps; children?: React.ReactNode }) {
  const { height = 200, background = 'gradient', align = 'center' } = props

  let bg: string
  switch (background) {
    case 'gradient':
      bg = `linear-gradient(135deg, ${tcss('--rk-accent-muted')}, transparent)`
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
      {children}
    </div>
  )
}
