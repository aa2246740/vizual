import type { DataTableProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

/**
 * Data table with formatting.
 * 在 DocView 内时，每个单元格支持独立批注。
 */
export function DataTable({ props }: { props: DataTableProps }) {
  const ctx = useAnnotationContext()
  const cols = props.columns ?? (props.data.length > 0 ? Object.keys(props.data[0]).map(k=>({key:k, label: k as string | undefined, align: undefined as 'left'|'center'|'right'|undefined})) : [])

  // 构建单元格点击 handler（仅在 DocView 内生效）
  const handleCellClick = ctx?.onTargetClick
    ? (rIdx: number, cIdx: number, colKey: string, e: React.MouseEvent) => {
        e.stopPropagation()
        ctx.onTargetClick!({
          sectionIndex: ctx.sectionIndex,
          targetType: 'table',
          label: `Row ${rIdx + 1}, ${cols[cIdx]?.label || colKey}`,
          targetId: `table-${ctx.sectionIndex}-${rIdx}-${cIdx}`,
        }, e.currentTarget as HTMLElement)
      }
    : null

  return (
    <div
      style={{width:'100%'}}
      {...(ctx ? {
        'data-section-index': ctx.sectionIndex,
        'data-target-type': 'table',
      } : {})}
    >
      {props.title && <div style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:8}}>{props.title}</div>}
      <div style={{maxHeight:400,overflowY:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:props.compact?12:13}}>
        <thead><tr style={{background:tcss('--rk-bg-primary')}}>{cols.map(c=><th key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:`2px solid ${tcss('--rk-border-subtle')}`,color:tcss('--rk-text-secondary'),fontWeight:tcss('--rk-weight-semibold'),fontSize:12,textTransform:'uppercase',letterSpacing:0.5}}>{c.label??c.key}</th>)}</tr></thead>
        <tbody>{props.data.map((row,i)=><tr key={i} style={{background:props.striped&&i%2?tcss('--rk-bg-primary'):'transparent'}}>
          {cols.map((c, ci) => {
            const cellContent = String(row[c.key]??'')
            // 在 DocView 内时，每个单元格添加批注属性
            const cellAnnotationProps = ctx ? {
              'data-docview-target': `table-${ctx.sectionIndex}-${i}-${ci}`,
              'data-section-index': ctx.sectionIndex,
              'data-target-type': 'table',
              onClick: handleCellClick ? (e: React.MouseEvent) => handleCellClick(i, ci, c.key, e) : undefined,
              style: {
                textAlign: c.align ?? 'left',
                padding: props.compact ? '4px 8px' : '8px 12px',
                borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
                color: tcss('--rk-text-primary'),
                cursor: 'pointer' as const,
              } as React.CSSProperties,
            } : {
              style: {
                textAlign: c.align ?? 'left',
                padding: props.compact ? '4px 8px' : '8px 12px',
                borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
                color: tcss('--rk-text-primary'),
              } as React.CSSProperties,
            }
            return <td key={c.key} {...cellAnnotationProps}>{cellContent}</td>
          })}
        </tr>)}</tbody>
      </table>
      </div>
    </div>
  )
}
