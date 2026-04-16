/**
 * Operation log with timestamps
 */
export function AuditLog({ props }: { props: AuditLogProps }) {
      const sevColors = {info:'#3b82f6',warning:'#f59e0b',error:'#ef4444'}
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {props.entries.map((e,i) => <div key={i} style={{display:'flex',gap:12,padding:'6px 0',fontSize:12,borderBottom:'1px solid #1a1a1a',alignItems:'center'}}>
            <span style={{color:'#666',minWidth:140,fontFamily:'monospace'}}>{e.timestamp}</span>
            <span style={{color:'#888',minWidth:80}}>{e.user}</span>
            <span style={{color:sevColors[e.severity??'info'],fontWeight:500,minWidth:100}}>{e.action}</span>
            {e.target && <span style={{color:'#aaa'}}>{e.target}</span>}
            {e.details && <span style={{color:'#666',marginLeft:'auto'}}>{e.details}</span>}
          </div>)}
        </div>
      </div>
}
