import type { AuditLogProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

/**
 * Operation log with timestamps.
 * 在 DocView 内时，每条记录支持独立批注。
 */
export function AuditLog({ props }: { props: AuditLogProps }) {
  const ctx = useAnnotationContext()
  const sevColors = {info:tcss('--rk-accent'),warning:tcss('--rk-warning'),error:tcss('--rk-error')}
  return <div>
    {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
    <div style={{display:'flex',flexDirection:'column',gap:2,maxHeight:400,overflowY:'auto'}}>
      {props.entries.map((e,i) => {
        const entryAnnotationProps = ctx ? {
          'data-docview-target': `audit-${ctx.sectionIndex}-${i}`,
          'data-section-index': ctx.sectionIndex,
          'data-target-type': 'component',
          onClick: (ev: React.MouseEvent) => {
            ev.stopPropagation()
            ctx.onTargetClick?.({
              sectionIndex: ctx.sectionIndex,
              targetType: 'component',
              label: `${e.timestamp} - ${e.action}`,
              targetId: `audit-${ctx.sectionIndex}-${i}`,
            }, ev.currentTarget as HTMLElement)
          },
          style: { cursor: 'pointer' as const },
        } : {}
        return <div key={i} style={{display:'flex',gap:12,padding:'6px 0',fontSize:tcss('--rk-text-sm'),borderBottom:`1px solid ${tcss('--rk-border')}`,alignItems:'center'}} {...entryAnnotationProps}>
          <span style={{color:tcss('--rk-text-tertiary'),minWidth:140,fontFamily:tcss('--rk-font-mono')}}>{e.timestamp}</span>
          <span style={{color:tcss('--rk-text-secondary'),minWidth:80}}>{e.user}</span>
          <span style={{color:sevColors[e.severity??'info'],fontWeight:tcss('--rk-weight-medium'),minWidth:100}}>{e.action}</span>
          {e.target && <span style={{color:tcss('--rk-text-secondary')}}>{e.target}</span>}
          {e.details && <span style={{color:tcss('--rk-text-tertiary'),marginLeft:'auto'}}>{e.details}</span>}
        </div>
      })}
    </div>
  </div>
}
