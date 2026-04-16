import type { AlertProps } from './schema'

/**
 * Alert banner with severity
 */
export function Alert({ props }: { props: AlertProps }) {
  const colors = {info:['#1e3a5f','#3b82f6'],warning:['#422006','#f59e0b'],error:['#450a0a','#ef4444'],success:['#052e16','#22c55e']}
  const [bg,accent] = colors[props.severity ?? 'info']
  return <div style={{padding:'12px 16px',borderRadius:8,borderLeft:`4px solid ${accent}`,background:bg,marginBottom:8}}>
    {props.title && <div style={{fontSize:14,fontWeight:600,color:accent,marginBottom:4}}>{props.title}</div>}
    <div style={{fontSize:13,color:'#d1d5db',lineHeight:1.5}}>{props.message}</div>
  </div>
}
