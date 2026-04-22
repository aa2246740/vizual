import type { AlertProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Alert banner with severity
 */
export function Alert({ props }: { props: AlertProps }) {
  const colors = {info:[tcss('--rk-accent-muted'),tcss('--rk-accent')],warning:[tcss('--rk-warning-muted'),tcss('--rk-warning')],error:[tcss('--rk-error-muted'),tcss('--rk-error')],success:[tcss('--rk-success-muted'),tcss('--rk-success')]}
  const [bg,accent] = colors[props.severity ?? 'info']
  return <div style={{padding:'12px 16px',borderRadius:tcss('--rk-radius-md'),borderLeft:`4px solid ${accent}`,background:bg,marginBottom:8}}>
    {props.title && <div style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),color:accent,marginBottom:4}}>{props.title}</div>}
    <div style={{fontSize:tcss('--rk-text-base'),color:tcss('--rk-text-primary'),lineHeight:1.5}}>{props.message}</div>
  </div>
}
