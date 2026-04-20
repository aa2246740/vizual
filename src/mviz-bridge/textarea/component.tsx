import type { TextAreaProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Multi-line text block
 */
export function TextArea({ props }: { props: TextAreaProps }) {
  return <div style={{
    padding: '12px 16px', borderRadius:parseInt(tcss('--rk-radius-md')), background: tcss('--rk-bg-primary'), border: `1px solid ${tcss('--rk-border-subtle')}`,
    fontFamily: tcss('--rk-font-mono'), fontSize:parseInt(tcss('--rk-text-base')), lineHeight: 1.6,
    whiteSpace: 'pre-wrap', maxHeight: props.maxLines ? props.maxLines * 22 : undefined,
    overflow: 'auto', color: tcss('--rk-text-primary'),
  }}>
    {props.title && <div style={{fontSize:parseInt(tcss('--rk-text-sm')),color:tcss('--rk-text-secondary'),marginBottom:8}}>{props.title}</div>}
    {props.content}
  </div>
}
