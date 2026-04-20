import type { BigValueProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Large metric display with optional subtitle
 */
export function BigValue({ props }: { props: BigValueProps }) {
  const isUp = props.trend === 'up', isDown = props.trend === 'down'
  return <div style={{padding: '8px 0'}}>
    {props.title && <div style={{fontSize:12,color:tc('--rk-text-secondary'),marginBottom:4}}>{props.title}</div>}
    <div style={{fontSize:32,fontWeight:700,color:tc('--rk-text-primary'),display:'flex',alignItems:'baseline',gap:4}}>
      {props.prefix && <span style={{fontSize:18}}>{props.prefix}</span>}
      <span>{String(props.value)}</span>
      {props.suffix && <span style={{fontSize:16,color:tc('--rk-text-secondary')}}>{props.suffix}</span>}
    </div>
    {(props.subtitle || props.trendValue) && <div style={{fontSize:13,marginTop:4,display:'flex',gap:8,alignItems:'center'}}>
      {props.trendValue && <span style={{color:isUp?tc('--rk-success'):isDown?tc('--rk-error'):tc('--rk-text-secondary'),fontWeight:600}}>
        {isUp?'↑':isDown?'↓':'→'} {props.trendValue}
      </span>}
      {props.subtitle && <span style={{color:tc('--rk-text-secondary')}}>{props.subtitle}</span>}
    </div>}
  </div>
}
