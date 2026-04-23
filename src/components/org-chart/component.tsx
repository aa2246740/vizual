import type { OrgChartProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

/**
 * Organization chart with tree hierarchy.
 * 在 DocView 内时，每个节点支持独立批注。
 */
export function OrgChart({ props }: { props: OrgChartProps }) {
  const ctx = useAnnotationContext()
  const roots = props.nodes.filter(n => !n.parentId)
  const getChildren = (id: string) => props.nodes.filter(n => n.parentId === id)
  const nodeIndexMap = new Map(props.nodes.map((n, i) => [n.id, i]))

  const renderNode = (node: OrgChartProps['nodes'][number], depth: number = 0) => {
    const children = getChildren(node.id)
    const ni = nodeIndexMap.get(node.id) ?? 0
    const nodeAnnotationProps = ctx ? {
      'data-docview-target': `orgchart-${ctx.sectionIndex}-${ni}`,
      'data-section-index': ctx.sectionIndex,
      'data-target-type': 'component',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        ctx.onTargetClick?.({
          sectionIndex: ctx.sectionIndex,
          targetType: 'component',
          label: `${node.name}${node.role ? ` (${node.role})` : ''}`,
          targetId: `orgchart-${ctx.sectionIndex}-${ni}`,
        }, e.currentTarget as HTMLElement)
      },
      style: { cursor: 'pointer' as const },
    } : {}
    return <div key={node.id} style={{marginLeft: depth * 24}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:tcss('--rk-bg-primary'),borderRadius:tcss('--rk-radius-md'),margin:'4px 0',borderLeft:`3px solid ${tcss('--rk-accent')}`}} {...nodeAnnotationProps}>
        <div>
          <div style={{fontSize:tcss('--rk-text-base'),fontWeight:tcss('--rk-weight-semibold'),color:tcss('--rk-text-primary')}}>{node.name}</div>
          {node.role && <div style={{fontSize:tcss('--rk-text-xs'),color:tcss('--rk-text-secondary')}}>{node.role}</div>}
        </div>
      </div>
      {children.length > 0 && <div style={{borderLeft:`1px solid ${tcss('--rk-border-subtle')}`,marginLeft:12}}>{children.map(c => renderNode(c, depth+1))}</div>}
    </div>
  }
  return <div>
    {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
    <div style={{maxHeight:400,overflowY:'auto'}}>
    {roots.map(r => renderNode(r))}
    </div>
  </div>
}
