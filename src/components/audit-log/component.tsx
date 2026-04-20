import type { AuditLogProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Operation log with timestamps
 */
export function AuditLog({ props }: { props: AuditLogProps }) {
      const sevColors = {info:tcss('--rk-accent'),warning:tcss('--rk-warning'),error:tcss('--rk-error')}
      return <div>
        {props.title && <h3 style={{fontSize:parseInt(tcss('--rk-text-md')),fontWeight:parseInt(tcss('--rk-weight-semibold')),marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {props.entries.map((e,i) => <div key={i} style={{display:'flex',gap:12,padding:'6px 0',fontSize:parseInt(tcss('--rk-text-sm')),borderBottom:`1px solid ${tcss('--rk-border')}`,alignItems:'center'}}>
            <span style={{color:tcss('--rk-text-tertiary'),minWidth:140,fontFamily:tcss('--rk-font-mono')}}>{e.timestamp}</span>
            <span style={{color:tcss('--rk-text-secondary'),minWidth:80}}>{e.user}</span>
            <span style={{color:sevColors[e.severity??'info'],fontWeight:parseInt(tcss('--rk-weight-medium')),minWidth:100}}>{e.action}</span>
            {e.target && <span style={{color:tcss('--rk-text-secondary')}}>{e.target}</span>}
            {e.details && <span style={{color:tcss('--rk-text-tertiary'),marginLeft:'auto'}}>{e.details}</span>}
          </div>)}
        </div>
      </div>
}
