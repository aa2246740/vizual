import type { DeltaProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

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
    {props.label && <div style={{fontSize:parseInt(tcss('--rk-text-sm')),color:tcss('--rk-text-secondary'),marginBottom:4}}>{props.label}</div>}
    <div style={{fontSize:parseInt(tcss('--rk-text-2xl')),fontWeight:parseInt(tcss('--rk-weight-bold')),color:isUp?tcss('--rk-success'):isDown?tcss('--rk-error'):tcss('--rk-text-primary')}}>
      {isUp?'↑ ':isDown?'↓ ':'→ '}{String(props.value)}
      {props.showPercentage && pct && <span style={{fontSize:parseInt(tcss('--rk-text-md')),marginLeft:8}}>{pct}</span>}
    </div>
  </div>
}
