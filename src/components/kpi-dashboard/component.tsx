import type { KpiDashboardProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Multi-metric KPI dashboard cards
 */
export function KpiDashboard({ props }: { props: KpiDashboardProps }) {
      const cols = props.columns ?? Math.min(props.metrics.length, 4)
      return <div>
        {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12}}>
          {props.metrics.map((m, i) => {
            const isUp = m.trend === 'up', isDown = m.trend === 'down'
            return <div key={i} style={{background:tcss('--rk-bg-primary'),border:`1px solid ${tcss('--rk-border')}`,borderRadius:tcss('--rk-radius-md'),padding:16}}>
              <div style={{fontSize:tcss('--rk-text-sm'),color:tcss('--rk-text-secondary'),marginBottom:8}}>{m.label}</div>
              <div style={{fontSize:tcss('--rk-text-2xl'),fontWeight:tcss('--rk-weight-bold'),color:m.color??tcss('--rk-text-primary')}}>
                {m.prefix}{String(m.value)}{m.suffix && <span style={{fontSize:tcss('--rk-text-md'),color:tcss('--rk-text-secondary')}}>{m.suffix}</span>}
              </div>
              {m.trendValue && <div style={{fontSize:tcss('--rk-text-sm'),marginTop:4,color:isUp?tcss('--rk-success'):isDown?tcss('--rk-error'):tcss('--rk-text-secondary')}}>
                {isUp?'↑':isDown?'↓':'→'} {m.trendValue}
              </div>}
            </div>
          })}
        </div>
      </div>
}
