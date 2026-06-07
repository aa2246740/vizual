import type { KpiDashboardProps } from './schema'
import { tcss } from '../../core/theme-colors'

/**
 * Multi-metric KPI dashboard cards.
 */
export function KpiDashboard({ props }: { props: KpiDashboardProps }) {
  return <div>
    {props.title && <h3 style={{fontFamily:tcss('--rk-font-display'),fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',gap:12,minWidth:0}}>
      {props.metrics.map((m, i) => {
        const isUp = m.trend === 'up', isDown = m.trend === 'down'
        const valueText = `${m.prefix ?? ''}${String(m.value)}${m.suffix ?? ''}`
        const valueLength = valueText.replace(/\s/g, '').length
        const shouldWrapValue = valueLength >= 12 || /[→←↗↘]/.test(valueText)
        const valueFontSize = valueLength >= 16
          ? tcss('--rk-text-sm')
          : valueLength >= 12
            ? tcss('--rk-text-base')
            : valueLength >= 8
              ? tcss('--rk-text-lg')
              : valueLength >= 6
                ? tcss('--rk-text-xl')
                : tcss('--rk-text-2xl')
        const trendText = `${isUp?'↑':isDown?'↓':'→'} ${m.trendValue ?? ''}`
        const shouldWrapTrend = trendText.replace(/\s/g, '').length >= 10
        return <div key={i} style={{fontFamily:tcss('--rk-font-ui'),background:tcss('--rk-bg-primary'),border:`1px solid ${tcss('--rk-border')}`,borderRadius:tcss('--rk-radius-md'),padding:16,minWidth:0}}>
          <div style={{fontFamily:tcss('--rk-font-ui'),fontSize:tcss('--rk-text-sm'),color:tcss('--rk-text-secondary'),marginBottom:8,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.label}</div>
          <div style={{fontFamily:tcss('--rk-font-display'),fontSize:valueFontSize,fontWeight:tcss('--rk-weight-bold'),color:m.color??tcss('--rk-text-primary'),whiteSpace:shouldWrapValue?'normal':'nowrap',overflow:shouldWrapValue?'visible':'hidden',overflowWrap:'anywhere',wordBreak:'break-word',textOverflow:'clip',lineHeight:1.08,letterSpacing:0,fontVariantNumeric:'tabular-nums'}}>
            {m.prefix}{String(m.value)}{m.suffix && <span style={{fontSize:tcss('--rk-text-md'),color:tcss('--rk-text-secondary')}}>{m.suffix}</span>}
          </div>
          {m.trendValue && <div style={{fontFamily:tcss('--rk-font-ui'),fontSize:shouldWrapTrend?tcss('--rk-text-xs'):tcss('--rk-text-sm'),marginTop:4,color:isUp?tcss('--rk-success'):isDown?tcss('--rk-error'):tcss('--rk-text-secondary'),whiteSpace:shouldWrapTrend?'normal':'nowrap',overflow:shouldWrapTrend?'visible':'hidden',overflowWrap:'anywhere',wordBreak:'break-word',textOverflow:'ellipsis',lineHeight:1.15}}>
            {isUp?'↑':isDown?'↓':'→'} {m.trendValue}
          </div>}
        </div>
      })}
    </div>
  </div>
}
