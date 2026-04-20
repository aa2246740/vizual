import type { KanbanProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Kanban board with columns and cards
 */
export function Kanban({ props }: { props: KanbanProps }) {
      const colors = {low:tc('--rk-success'),medium:tc('--rk-warning'),high:tc('--rk-error')}
      return <div style={{width:'100%'}}>
        {props.title && <h3 style={{fontSize:16,fontWeight:600,marginBottom:12,color:tc('--rk-text-primary')}}>{props.title}</h3>}
        <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}}>
          {props.columns.map(col => (
            <div key={col.id} style={{minWidth:250,flex:1,background:tc('--rk-bg-primary'),borderRadius:8,padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col.color??tc('--rk-accent')}} />
                <span style={{fontSize:13,fontWeight:600,color:tc('--rk-text-secondary')}}>{col.title}</span>
                <span style={{fontSize:11,color:tc('--rk-text-tertiary'),marginLeft:'auto'}}>{col.cards.length}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {col.cards.map(card => (
                  <div key={card.id} style={{background:tc('--rk-bg-secondary'),border:`1px solid ${tc('--rk-border-subtle')}`,borderRadius:6,padding:10}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4,color:tc('--rk-text-primary')}}>{card.title}</div>
                    {card.description && <div style={{fontSize:12,color:tc('--rk-text-secondary'),lineHeight:1.4}}>{card.description}</div>}
                    {(card.tags?.length || card.assignee || card.priority) && <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
                      {card.tags?.map((t,i) => <span key={i} style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:tc('--rk-bg-secondary'),color:tc('--rk-text-secondary')}}>{t}</span>)}
                      {card.priority && <span style={{width:6,height:6,borderRadius:'50%',background:colors[card.priority]}} />}
                      {card.assignee && <span style={{fontSize:10,color:tc('--rk-text-tertiary'),marginLeft:'auto'}}>{card.assignee}</span>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
}
