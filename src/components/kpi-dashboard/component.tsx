import type { KpiDashboardProps } from './schema'

/**
 * Multi-metric KPI dashboard cards
 */
export function KpiDashboard({ props }: { props: KpiDashboardProps }) {
      const cols = props.columns ?? Math.min(props.metrics.length, 4)
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12}}>
          {props.metrics.map((m, i) => {
            const isUp = m.trend === 'up', isDown = m.trend === 'down'
            return <div key={i} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:16}}>
              <div style={{fontSize:12,color:'#888',marginBottom:8}}>{m.label}</div>
              <div style={{fontSize:24,fontWeight:700,color:m.color??'#e5e5e5'}}>
                {m.prefix}{String(m.value)}{m.suffix && <span style={{fontSize:14,color:'#888'}}>{m.suffix}</span>}
              </div>
              {m.trendValue && <div style={{fontSize:12,marginTop:4,color:isUp?'#22c55e':isDown?'#ef4444':'#888'}}>
                {isUp?'↑':isDown?'↓':'→'} {m.trendValue}
              </div>}
            </div>
          })}
        </div>
      </div>
}
