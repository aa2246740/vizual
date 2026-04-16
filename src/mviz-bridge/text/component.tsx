import type { TextBlockProps } from './schema'

/**
 * Styled text display
 */
export function TextBlock(props: TextBlockProps) {
  return <div style={{
    fontSize: props.fontSize ?? 14,
    fontWeight: props.fontWeight ?? 'normal',
    textAlign: props.align ?? 'left',
    color: props.color ?? 'var(--rk-text-primary,#e5e5e5)',
    lineHeight: 1.6,
  }}>{props.content}</div>
}
