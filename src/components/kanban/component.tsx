import type { KanbanProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

/**
 * Kanban board with columns and cards.
 * 在 DocView 内时，每张卡片支持独立批注。
 */
export function Kanban({ props }: { props: KanbanProps }) {
  const ctx = useAnnotationContext()
  const colors = {low:tcss('--rk-success'),medium:tcss('--rk-warning'),high:tcss('--rk-error')}
  return <div style={{width:'100%'}}>
    {props.title && <h3 style={{fontSize:tcss('--rk-text-lg'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12,color:tcss('--rk-text-primary')}}>{props.title}</h3>}
    <div style={{display:'flex',gap:12,overflowX:'auto',maxHeight:400,paddingBottom:8}}>
      {props.columns.map((col, ci) => (
        <div key={col.id} style={{minWidth:250,flex:1,background:tcss('--rk-bg-primary'),borderRadius:tcss('--rk-radius-md'),padding:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col.color??tcss('--rk-accent')}} />
            <span style={{fontSize:tcss('--rk-text-base'),fontWeight:tcss('--rk-weight-semibold'),color:tcss('--rk-text-secondary')}}>{col.title}</span>
            <span style={{fontSize:tcss('--rk-text-xs'),color:tcss('--rk-text-tertiary'),marginLeft:'auto'}}>{col.cards.length}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {col.cards.map((card, ki) => {
              // 每张卡片的批注属性
              const cardAnnotationProps = ctx ? {
                'data-docview-target': `kanban-${ctx.sectionIndex}-${ci}-${ki}`,
                'data-section-index': ctx.sectionIndex,
                'data-target-type': 'component',
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation()
                  ctx.onTargetClick?.({
                    sectionIndex: ctx.sectionIndex,
                    targetType: 'component',
                    label: `${col.title} › ${card.title}`,
                    targetId: `kanban-${ctx.sectionIndex}-${ci}-${ki}`,
                  }, e.currentTarget as HTMLElement)
                },
                style: { cursor: 'pointer' as const },
              } : {}
              return (
                <div key={card.id} style={{background:tcss('--rk-bg-secondary'),border:`1px solid ${tcss('--rk-border-subtle')}`,borderRadius:tcss('--rk-radius-md'),padding:10}} {...cardAnnotationProps}>
                  <div style={{fontSize:tcss('--rk-text-base'),fontWeight:tcss('--rk-weight-medium'),marginBottom:4,color:tcss('--rk-text-primary')}}>{card.title}</div>
                  {card.description && <div style={{fontSize:tcss('--rk-text-sm'),color:tcss('--rk-text-secondary'),lineHeight:1.4}}>{card.description}</div>}
                  {(card.tags?.length || card.assignee || card.priority) && <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
                    {card.tags?.map((t,i) => <span key={i} style={{fontSize:tcss('--rk-text-xs'),padding:'2px 6px',borderRadius:tcss('--rk-radius-sm'),background:tcss('--rk-bg-secondary'),color:tcss('--rk-text-secondary')}}>{t}</span>)}
                    {card.priority && <span style={{width:6,height:6,borderRadius:'50%',background:colors[card.priority]}} />}
                    {card.assignee && <span style={{fontSize:tcss('--rk-text-xs'),color:tcss('--rk-text-tertiary'),marginLeft:'auto'}}>{card.assignee}</span>}
                  </div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
}
