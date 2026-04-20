import type { BigValueProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Large metric display with optional subtitle
 */
export function BigValue({ props }: { props: BigValueProps }) {
  const isUp = props.trend === 'up', isDown = props.trend === 'down'
  return <div style={{padding: '8px 0'}}>
    {props.title && <div style={{fontSize:parseInt(tcss('--rk-text-sm')),color:tcss('--rk-text-secondary'),marginBottom:4}}>{props.title}</div>}
    <div style={{fontSize:parseInt(tcss('--rk-text-2xl')),fontWeight:parseInt(tcss('--rk-weight-bold')),color:tcss('--rk-text-primary'),display:'flex',alignItems:'baseline',gap:4}}>
      {props.prefix && <span style={{fontSize:parseInt(tcss('--rk-text-lg'))}}>{props.prefix}</span>}
      <span>{String(props.value)}</span>
      {props.suffix && <span style={{fontSize:parseInt(tcss('--rk-text-lg')),color:tcss('--rk-text-secondary')}}>{props.suffix}</span>}
    </div>
    {(props.subtitle || props.trendValue) && <div style={{fontSize:parseInt(tcss('--rk-text-base')),marginTop:4,display:'flex',gap:8,alignItems:'center'}}>
      {props.trendValue && <span style={{color:isUp?tcss('--rk-success'):isDown?tcss('--rk-error'):tcss('--rk-text-secondary'),fontWeight:parseInt(tcss('--rk-weight-semibold'))}}>
        {isUp?'↑':isDown?'↓':'→'} {props.trendValue}
      </span>}
      {props.subtitle && <span style={{color:tcss('--rk-text-secondary')}}>{props.subtitle}</span>}
    </div>}
  </div>
}
