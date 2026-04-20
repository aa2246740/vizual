import type { AlertProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Alert banner with severity
 */
export function Alert({ props }: { props: AlertProps }) {
  const colors = {info:[tc('--rk-accent-muted'),tc('--rk-accent')],warning:[tc('--rk-warning-muted'),tc('--rk-warning')],error:[tc('--rk-error-muted'),tc('--rk-error')],success:[tc('--rk-success-muted'),tc('--rk-success')]}
  const [bg,accent] = colors[props.severity ?? 'info']
  return <div style={{padding:'12px 16px',borderRadius:8,borderLeft:`4px solid ${accent}`,background:bg,marginBottom:8}}>
    {props.title && <div style={{fontSize:14,fontWeight:600,color:accent,marginBottom:4}}>{props.title}</div>}
    <div style={{fontSize:13,color:tc('--rk-text-primary'),lineHeight:1.5}}>{props.message}</div>
  </div>
}
