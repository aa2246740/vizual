import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { TextProps } from './schema'

const weightMap: Record<string, number> = {
  normal: 400, medium: 500, semibold: 600, bold: 700,
}

const defaultSizes: Record<string, number> = {
  heading: 20, body: 14, caption: 12, label: 12, code: 13,
}

export function Text({ props }: { props: TextProps }) {
  const { content, variant = 'body', size, weight, color, align = 'left', maxLines } = props
  const Tag = variant === 'heading' ? 'h2' : 'p'
  const fontSize = size ?? defaultSizes[variant] ?? 14

  const lineClamp: React.CSSProperties = maxLines
    ? { display: '-webkit-box', WebkitLineClamp: maxLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' as const }
    : {}

  return (
    <Tag style={{
      margin: 0,
      fontSize,
      fontWeight: weight ? weightMap[weight] : (variant === 'heading' ? 600 : 400),
      color: color || (variant === 'caption' ? tcss('--rk-text-tertiary') : tcss('--rk-text-primary')),
      textAlign: align,
      fontFamily: variant === 'code' ? 'monospace' : tcss('--rk-font-sans'),
      lineHeight: variant === 'heading' ? 1.3 : 1.5,
      ...lineClamp,
    }}>
      {content}
    </Tag>
  )
}
