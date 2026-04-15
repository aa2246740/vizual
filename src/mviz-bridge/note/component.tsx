import type { NoteProps } from './schema'

/**
 * Callout note with icon
 */
export function Note(props: NoteProps) {
  return (props) => {
      const icons = {info:'ℹ️',tip:'💡',warning:'⚠️',important:'🔴'}
      const icon = icons[props.variant ?? 'info']
      return <div style={{padding:'12px 16px',borderRadius:8,background:'#1a1a2e',border:'1px solid #2a2a3e',marginBottom:8,display:'flex',gap:12}}>
        <span style={{fontSize:18}}>{icon}</span>
        <div>
          {props.title && <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{props.title}</div>}
          <div style={{fontSize:13,color:'#9ca3af',lineHeight:1.5}}>{props.content}</div>
        </div>
      </div>
    }
}
