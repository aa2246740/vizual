import type { AuditLogProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Operation log with timestamps
 */
export function AuditLog({ props }: { props: AuditLogProps }) {
      const sevColors = {info:tc('--rk-accent'),warning:tc('--rk-warning'),error:tc('--rk-error')}
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {props.entries.map((e,i) => <div key={i} style={{display:'flex',gap:12,padding:'6px 0',fontSize:12,borderBottom:`1px solid ${tc('--rk-border')}`,alignItems:'center'}}>
            <span style={{color:tc('--rk-text-tertiary'),minWidth:140,fontFamily:tc('--rk-font-mono')}}>{e.timestamp}</span>
            <span style={{color:tc('--rk-text-secondary'),minWidth:80}}>{e.user}</span>
            <span style={{color:sevColors[e.severity??'info'],fontWeight:500,minWidth:100}}>{e.action}</span>
            {e.target && <span style={{color:tc('--rk-text-secondary')}}>{e.target}</span>}
            {e.details && <span style={{color:tc('--rk-text-tertiary'),marginLeft:'auto'}}>{e.details}</span>}
          </div>)}
        </div>
      </div>
}
