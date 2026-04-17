import type { KanbanProps } from './schema'

/**
 * Kanban board with columns and cards
 */
export function Kanban({ props }: { props: KanbanProps }) {
      const colors = {low:'#22c55e',medium:'#f59e0b',high:'#ef4444'}
      return <div style={{width:'100%'}}>
        {props.title && <h3 style={{fontSize:16,fontWeight:600,marginBottom:12,color:'var(--rk-text-primary,#e5e5e5)'}}>{props.title}</h3>}
        <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}}>
          {props.columns.map(col => (
            <div key={col.id} style={{minWidth:250,flex:1,background:'#111',borderRadius:8,padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col.color??'#3b82f6'}} />
                <span style={{fontSize:13,fontWeight:600,color:'#aaa'}}>{col.title}</span>
                <span style={{fontSize:11,color:'#555',marginLeft:'auto'}}>{col.cards.length}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {col.cards.map(card => (
                  <div key={card.id} style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:6,padding:10}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4,color:'#e5e5e5'}}>{card.title}</div>
                    {card.description && <div style={{fontSize:12,color:'#888',lineHeight:1.4}}>{card.description}</div>}
                    {(card.tags?.length || card.assignee || card.priority) && <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
                      {card.tags?.map((t,i) => <span key={i} style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:'#1e293b',color:'#94a3b8'}}>{t}</span>)}
                      {card.priority && <span style={{width:6,height:6,borderRadius:'50%',background:colors[card.priority]}} />}
                      {card.assignee && <span style={{fontSize:10,color:'#666',marginLeft:'auto'}}>{card.assignee}</span>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
}
