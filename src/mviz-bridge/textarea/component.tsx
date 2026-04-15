import type { TextAreaProps } from './schema'

/**
 * Multi-line text block
 */
export function TextArea(props: TextAreaProps) {
  return (props) => <div style={{
      padding: '12px 16px', borderRadius: 8, background: '#111', border: '1px solid #2a2a2a',
      fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6,
      whiteSpace: 'pre-wrap', maxHeight: props.maxLines ? props.maxLines * 22 : undefined,
      overflow: 'auto', color: '#d1d5db',
    }}>
      {props.title && <div style={{fontSize:12,color:'#888',marginBottom:8}}>{props.title}</div>}
      {props.content}
    </div>
}
