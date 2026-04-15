import type { BigValueProps } from './schema'

/**
 * Large metric display with optional subtitle
 */
export function BigValue(props: BigValueProps) {
  return (props) => {
      const isUp = props.trend === 'up', isDown = props.trend === 'down'
      return <div style={{padding: '8px 0'}}>
        {props.title && <div style={{fontSize:12,color:'var(--rk-text-secondary,#888)',marginBottom:4}}>{props.title}</div>}
        <div style={{fontSize:32,fontWeight:700,color:'var(--rk-text-primary,#e5e5e5)',display:'flex',alignItems:'baseline',gap:4}}>
          {props.prefix && <span style={{fontSize:18}}>{props.prefix}</span>}
          <span>{String(props.value)}</span>
          {props.suffix && <span style={{fontSize:16,color:'var(--rk-text-secondary,#888)'}}>{props.suffix}</span>}
        </div>
        {(props.subtitle || props.trendValue) && <div style={{fontSize:13,marginTop:4,display:'flex',gap:8,alignItems:'center'}}>
          {props.trendValue && <span style={{color:isUp?'#22c55e':isDown?'#ef4444':'#888',fontWeight:600}}>
            {isUp?'↑':isDown?'↓':'→'} {props.trendValue}
          </span>}
          {props.subtitle && <span style={{color:'var(--rk-text-secondary,#888)'}}>{props.subtitle}</span>}
        </div>}
      </div>
    }
}
