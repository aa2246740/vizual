import type { KpiDashboardProps } from './schema'
import { tc } from '../../core/theme-colors'

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
            return <div key={i} style={{background:tc('--rk-bg-primary'),border:`1px solid ${tc('--rk-border')}`,borderRadius:8,padding:16}}>
              <div style={{fontSize:12,color:tc('--rk-text-secondary'),marginBottom:8}}>{m.label}</div>
              <div style={{fontSize:24,fontWeight:700,color:m.color??tc('--rk-text-primary')}}>
                {m.prefix}{String(m.value)}{m.suffix && <span style={{fontSize:14,color:tc('--rk-text-secondary')}}>{m.suffix}</span>}
              </div>
              {m.trendValue && <div style={{fontSize:12,marginTop:4,color:isUp?tc('--rk-success'):isDown?tc('--rk-error'):tc('--rk-text-secondary')}}>
                {isUp?'↑':isDown?'↓':'→'} {m.trendValue}
              </div>}
            </div>
          })}
        </div>
      </div>
}
