import type { DataTableProps } from './schema'
import { tcss } from '../../core/theme-colors'

/**
 * Data table with formatting.
 */
export function DataTable({ props }: { props: DataTableProps }) {
  const data = Array.isArray(props.data) ? props.data : []
  const cols = props.columns ?? (data.length > 0 ? Object.keys(data[0]).map(k=>({key:k, label: k as string | undefined, align: undefined as 'left'|'center'|'right'|undefined, format: undefined as string | undefined})) : [])
  const minTableWidth = Math.max(640, cols.length * (props.compact ? 96 : 128))
  const columnMinWidth = (key: string, label?: string) => {
    const text = `${key} ${label ?? ''}`.toLowerCase()
    if (/(reason|detail|desc|说明|解释|备注)/i.test(text)) return 220
    if (/(store|name|门店|机构|名称)/i.test(text)) return 132
    if (/(date|time|日期|时间)/i.test(text)) return 120
    return props.compact ? 84 : 104
  }
  const shouldWrapColumn = (key: string, label?: string) => /(reason|detail|desc|说明|解释|备注)/i.test(`${key} ${label ?? ''}`)

  const formatCell = (value: unknown, format?: string) => {
    if (format === 'percent') {
      if (typeof value === 'string' && value.trim().endsWith('%')) return value.trim()
      const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
      if (Number.isFinite(numeric)) {
        const percent = Math.abs(numeric) <= 1 ? numeric * 100 : numeric
        return `${Number(percent.toFixed(2)).toString()}%`
      }
    }
    if (format === 'currencyCNY' || format === 'currency') {
      const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
      if (Number.isFinite(numeric)) return numeric.toLocaleString('zh-CN')
    }
    return String(value ?? '')
  }

  return (
    <div style={{width:'100%'}}>
      {props.title && <div style={{fontFamily:tcss('--rk-font-display'),fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:8}}>{props.title}</div>}
      <div style={{maxHeight:400,overflow:'auto',width:'100%'}}>
      <table style={{width:'100%',minWidth:minTableWidth,borderCollapse:'collapse',fontSize:props.compact?12:13,fontFamily:tcss('--rk-font-body'),tableLayout:'auto'}}>
        <thead><tr style={{background:tcss('--rk-bg-primary')}}>{cols.map(c=><th key={c.key} style={{fontFamily:tcss('--rk-font-mono'),textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:`2px solid ${tcss('--rk-border-subtle')}`,color:tcss('--rk-text-secondary'),fontWeight:tcss('--rk-weight-semibold'),fontSize:12,textTransform:'uppercase',letterSpacing:0,minWidth:columnMinWidth(c.key,c.label),whiteSpace:'nowrap'}}>{c.label??c.key}</th>)}</tr></thead>
        <tbody>{data.map((row,i)=><tr key={i} style={{background:props.striped&&i%2?tcss('--rk-bg-primary'):'transparent'}}>
          {cols.map((c, ci) => {
            const cellContent = formatCell(row[c.key], c.format)
            const wraps = shouldWrapColumn(c.key, c.label)
            return <td key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:`1px solid ${tcss('--rk-border-subtle')}`,color:tcss('--rk-text-primary'),minWidth:columnMinWidth(c.key,c.label),whiteSpace:wraps?'normal':'nowrap',wordBreak:'keep-all',overflowWrap:wraps?'break-word':'normal',lineHeight:1.35}}>{cellContent}</td>
          })}
        </tr>)}</tbody>
      </table>
      </div>
    </div>
  )
}
