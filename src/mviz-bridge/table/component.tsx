import type { DataTableProps } from './schema'

/**
 * Data table with formatting
 */
export function DataTable(props: DataTableProps) {
  const cols = props.columns ?? (props.data.length > 0 ? Object.keys(props.data[0]).map(k=>({key:k})) : [])
  return <div style={{width:'100%'}}>
    {props.title && <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</div>}
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:props.compact?12:13}}>
      <thead><tr>{cols.map(c=><th key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:'2px solid #2a2a2a',color:'#888',fontWeight:600}}>{c.label??c.key}</th>)}</tr></thead>
      <tbody>{props.data.map((row,i)=><tr key={i} style={{background:props.striped&&i%2?'#111':'transparent'}}>
        {cols.map(c=><td key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:'1px solid #1a1a1a',color:'#d1d5db'}}>{String(row[c.key]??'')}</td>)}
      </tr>)}</tbody>
    </table>
  </div>
}
