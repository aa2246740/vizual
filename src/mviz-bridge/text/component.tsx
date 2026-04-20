import type { TextBlockProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Styled text display
 */
export function TextBlock({ props }: { props: TextBlockProps }) {
  return <div style={{
    fontSize: props.fontSize ?? 14,
    fontWeight: props.fontWeight ?? 'normal',
    textAlign: props.align ?? 'left',
    color: props.color ?? tcss('--rk-text-primary'),
    lineHeight: 1.6,
  }}>{props.content}</div>
}
