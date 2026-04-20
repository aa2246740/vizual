import type { NoteProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Callout note with icon
 */
export function Note({ props }: { props: NoteProps }) {
  const icons = {info:'ℹ️',tip:'💡',warning:'⚠️',important:'🔴'}
  const icon = icons[props.variant ?? 'info']
  return <div style={{padding:'12px 16px',borderRadius:8,background:tc('--rk-bg-secondary'),border:`1px solid ${tc('--rk-border-subtle')}`,marginBottom:8,display:'flex',gap:12}}>
    <span style={{fontSize:18}}>{icon}</span>
    <div>
      {props.title && <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{props.title}</div>}
      <div style={{fontSize:13,color:tc('--rk-text-secondary'),lineHeight:1.5}}>{props.content}</div>
    </div>
  </div>
}
