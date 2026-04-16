import type { DeltaProps } from './schema'

/**
 * Value change indicator
 */
export function Delta({ props }: { props: DeltaProps }) {
  const isUp = props.direction === 'up', isDown = props.direction === 'down'
  let pct = ''
  if (props.previousValue != null && props.previousValue !== 0) {
    pct = (((Number(props.value) - Number(props.previousValue)) / Number(props.previousValue)) * 100).toFixed(1) + '%'
  }
  return <div style={{padding: '8px 0',textAlign:'center'}}>
    {props.label && <div style={{fontSize:12,color:'var(--rk-text-secondary,#888)',marginBottom:4}}>{props.label}</div>}
    <div style={{fontSize:24,fontWeight:700,color:isUp?'#22c55e':isDown?'#ef4444':'var(--rk-text-primary,#e5e5e5)'}}>
      {isUp?'↑ ':isDown?'↓ ':'→ '}{String(props.value)}
      {props.showPercentage && pct && <span style={{fontSize:14,marginLeft:8}}>{pct}</span>}
    </div>
  </div>
}
