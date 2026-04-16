/**
 * Organization chart with tree hierarchy
 */
export function OrgChart({ props }: { props: OrgChartProps }) {
      const roots = props.nodes.filter(n => !n.parentId)
      const getChildren = (id: string) => props.nodes.filter(n => n.parentId === id)
      const renderNode = (node: any, depth = 0) => {
        const children = getChildren(node.id)
        return <div key={node.id} style={{marginLeft: depth * 24}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#111',borderRadius:6,margin:'4px 0',borderLeft:'3px solid #3b82f6'}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#e5e5e5'}}>{node.name}</div>
              {node.role && <div style={{fontSize:11,color:'#888'}}>{node.role}</div>}
            </div>
          </div>
          {children.length > 0 && <div style={{borderLeft:'1px solid #2a2a2a',marginLeft:12}}>{children.map(c => renderNode(c, depth+1))}</div>}
        </div>
      }
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        {roots.map(r => renderNode(r))}
      </div>
}
