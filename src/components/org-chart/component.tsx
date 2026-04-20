import type { OrgChartProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Organization chart with tree hierarchy
 */
export function OrgChart({ props }: { props: OrgChartProps }) {
      const roots = props.nodes.filter(n => !n.parentId)
      const getChildren = (id: string) => props.nodes.filter(n => n.parentId === id)
      const renderNode = (node: OrgChartProps['nodes'][number], depth: number = 0) => {
        const children = getChildren(node.id)
        return <div key={node.id} style={{marginLeft: depth * 24}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:tcss('--rk-bg-primary'),borderRadius:parseInt(tcss('--rk-radius-md')),margin:'4px 0',borderLeft:`3px solid ${tcss('--rk-accent')}`}}>
            <div>
              <div style={{fontSize:parseInt(tcss('--rk-text-base')),fontWeight:parseInt(tcss('--rk-weight-semibold')),color:tcss('--rk-text-primary')}}>{node.name}</div>
              {node.role && <div style={{fontSize:parseInt(tcss('--rk-text-xs')),color:tcss('--rk-text-secondary')}}>{node.role}</div>}
            </div>
          </div>
          {children.length > 0 && <div style={{borderLeft:`1px solid ${tcss('--rk-border-subtle')}`,marginLeft:12}}>{children.map(c => renderNode(c, depth+1))}</div>}
        </div>
      }
      return <div>
        {props.title && <h3 style={{fontSize:parseInt(tcss('--rk-text-md')),fontWeight:parseInt(tcss('--rk-weight-semibold')),marginBottom:12}}>{props.title}</h3>}
        {roots.map(r => renderNode(r))}
      </div>
}
