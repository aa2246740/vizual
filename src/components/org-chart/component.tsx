import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

interface FlatNode { id: string; name: string; role?: string; parentId?: string | null }

/**
 * Flatten nested data (with children arrays) into flat nodes with parentId.
 * json-render strips transform output, so we handle both formats in the component.
 */
function flattenNestedData(items: any[], parentId: string | null = null): FlatNode[] {
  const result: FlatNode[] = []
  for (const item of items) {
    result.push({ id: item.id, name: item.name, role: item.title ?? item.role, parentId })
    if (Array.isArray(item.children)) {
      result.push(...flattenNestedData(item.children, item.id))
    }
  }
  return result
}

/**
 * Organization chart with tree hierarchy.
 * Accepts both flat `nodes[]` with parentId and nested `data[]` with children.
 */
export function OrgChart({ props }: { props: Record<string, any> }) {
  const ctx = useAnnotationContext()
  // Resolve nodes from either format
  let nodes: FlatNode[] = []
  if (Array.isArray(props.nodes) && props.nodes.length > 0) {
    nodes = props.nodes
  } else if (Array.isArray(props.data) && props.data.length > 0) {
    nodes = flattenNestedData(props.data)
  }
  const roots = nodes.filter(n => !n.parentId)
  const getChildren = (id: string) => nodes.filter(n => n.parentId === id)
  const nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]))

  const renderNode = (node: FlatNode, depth: number = 0) => {
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
