import type { NoteProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Callout note with icon
 */
export function Note({ props }: { props: NoteProps }) {
  const icons = {info:'ℹ️',tip:'💡',warning:'⚠️',important:'🔴'}
  const icon = icons[props.variant ?? 'info']
  return <div style={{padding:'12px 16px',borderRadius:tcss('--rk-radius-md'),background:tcss('--rk-bg-secondary'),border:`1px solid ${tcss('--rk-border-subtle')}`,marginBottom:8,display:'flex',gap:12}}>
    <span style={{fontSize:tcss('--rk-text-lg')}}>{icon}</span>
    <div>
      {props.title && <div style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:4}}>{props.title}</div>}
      <div style={{fontSize:tcss('--rk-text-base'),color:tcss('--rk-text-secondary'),lineHeight:1.5}}>{props.content}</div>
    </div>
  </div>
}
