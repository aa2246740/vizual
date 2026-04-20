import type { TextAreaProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Multi-line text block
 */
export function TextArea({ props }: { props: TextAreaProps }) {
  return <div style={{
    padding: '12px 16px', borderRadius: 8, background: tc('--rk-bg-primary'), border: `1px solid ${tc('--rk-border-subtle')}`,
    fontFamily: tc('--rk-font-mono'), fontSize: 13, lineHeight: 1.6,
    whiteSpace: 'pre-wrap', maxHeight: props.maxLines ? props.maxLines * 22 : undefined,
    overflow: 'auto', color: tc('--rk-text-primary'),
  }}>
    {props.title && <div style={{fontSize:12,color:tc('--rk-text-secondary'),marginBottom:8}}>{props.title}</div>}
    {props.content}
  </div>
}
