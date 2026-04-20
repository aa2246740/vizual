import type { DataTableProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Data table with formatting
 */
export function DataTable({ props }: { props: DataTableProps }) {
  const cols = props.columns ?? (props.data.length > 0 ? Object.keys(props.data[0]).map(k=>({key:k, label: k as string | undefined, align: undefined as 'left'|'center'|'right'|undefined})) : [])
  return <div style={{width:'100%'}}>
    {props.title && <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</div>}
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:props.compact?12:13}}>
      <thead><tr>{cols.map(c=><th key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:`2px solid ${tc('--rk-border-subtle')}`,color:tc('--rk-text-secondary'),fontWeight:600}}>{c.label??c.key}</th>)}</tr></thead>
      <tbody>{props.data.map((row,i)=><tr key={i} style={{background:props.striped&&i%2?tc('--rk-bg-primary'):'transparent'}}>
        {cols.map(c=><td key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:`1px solid ${tc('--rk-border')}`,color:tc('--rk-text-primary')}}>{String(row[c.key]??'')}</td>)}
      </tr>)}</tbody>
    </table>
  </div>
}
