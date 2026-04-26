import type { KpiDashboardProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

/**
 * Multi-metric KPI dashboard cards.
 * 在 DocView 内时，每个指标卡片支持独立批注。
 */
export function KpiDashboard({ props }: { props: KpiDashboardProps }) {
  const ctx = useAnnotationContext()
  const cols = props.columns ?? Math.min(props.metrics.length, 4)
  return <div>
    {props.title && <h3 style={{fontFamily:tcss('--rk-font-display'),fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12}}>
      {props.metrics.map((m, i) => {
        const isUp = m.trend === 'up', isDown = m.trend === 'down'
        // 每个指标卡片的批注属性
        const metricAnnotationProps = ctx ? {
          'data-docview-target': `kpi-${ctx.sectionIndex}-${i}`,
          'data-section-index': ctx.sectionIndex,
          'data-target-type': 'kpi',
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation()
            ctx.onTargetClick?.({
              sectionIndex: ctx.sectionIndex,
              targetType: 'kpi',
              label: `${m.label}: ${m.value}`,
              targetId: `kpi-${ctx.sectionIndex}-${i}`,
            }, e.currentTarget as HTMLElement)
          },
          style: { cursor: 'pointer' as const },
        } : {}
        return <div key={i} style={{fontFamily:tcss('--rk-font-ui'),background:tcss('--rk-bg-primary'),border:`1px solid ${tcss('--rk-border')}`,borderRadius:tcss('--rk-radius-md'),padding:16}} {...metricAnnotationProps}>
          <div style={{fontFamily:tcss('--rk-font-ui'),fontSize:tcss('--rk-text-sm'),color:tcss('--rk-text-secondary'),marginBottom:8}}>{m.label}</div>
          <div style={{fontFamily:tcss('--rk-font-display'),fontSize:tcss('--rk-text-2xl'),fontWeight:tcss('--rk-weight-bold'),color:m.color??tcss('--rk-text-primary')}}>
            {m.prefix}{String(m.value)}{m.suffix && <span style={{fontSize:tcss('--rk-text-md'),color:tcss('--rk-text-secondary')}}>{m.suffix}</span>}
          </div>
          {m.trendValue && <div style={{fontFamily:tcss('--rk-font-ui'),fontSize:tcss('--rk-text-sm'),marginTop:4,color:isUp?tcss('--rk-success'):isDown?tcss('--rk-error'):tcss('--rk-text-secondary')}}>
            {isUp?'↑':isDown?'↓':'→'} {m.trendValue}
          </div>}
        </div>
      })}
    </div>
  </div>
}
