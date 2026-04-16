/**
 * Product comparison matrix
 */
export function FeatureTable({ props }: { props: FeatureTableProps }) {
      const products = props.products || []
      const features = props.features || []
      if (products.length === 0 || features.length === 0) {
        return <div style={{color:'#888',fontSize:13}}>No comparison data</div>
      }
      return <div style={{overflowX:'auto'}}>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'8px 12px',borderBottom:'2px solid #2a2a2a',color:'#888'}}>Feature</th>
            {products.map(p => <th key={p} style={{textAlign:'center',padding:'8px 12px',borderBottom:'2px solid #2a2a2a',color:'#ddd'}}>{p}</th>)}
          </tr></thead>
          <tbody>{features.map((f,i) => <tr key={i} style={{borderBottom:'1px solid #1a1a1a'}}>
            <td style={{padding:'8px 12px',color:'#aaa'}}>{f.name}</td>
            {Array.from({ length: products.length }, (_, j) => {
              const v = f.values?.[j]
              return <td key={j} style={{textAlign:'center',padding:'8px 12px'}}>
                {v === undefined ? <span style={{color:'#333'}}>—</span> :
                 typeof v === 'boolean' ? (v ? <span style={{color:'#22c55e',fontWeight:700}}>✓</span> : <span style={{color:'#555'}}>—</span>) :
                 <span style={{color:'#ddd'}}>{String(v)}</span>}
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
}
