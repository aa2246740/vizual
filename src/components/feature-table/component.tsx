import type { FeatureTableProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Product comparison matrix
 */
export function FeatureTable({ props }: { props: FeatureTableProps }) {
      return <div style={{overflowX:'auto'}}>
        {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:tcss('--rk-text-base')}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'8px 12px',borderBottom:`2px solid ${tcss('--rk-border-subtle')}`,color:tcss('--rk-text-secondary')}}>Feature</th>
            {props.products.map(p => <th key={p} style={{textAlign:'center',padding:'8px 12px',borderBottom:`2px solid ${tcss('--rk-border-subtle')}`,color:tcss('--rk-text-primary')}}>{p}</th>)}
          </tr></thead>
          <tbody>{props.features.map((f,i) => <tr key={i} style={{borderBottom:`1px solid ${tcss('--rk-border')}`}}>
            <td style={{padding:'8px 12px',color:tcss('--rk-text-secondary')}}>{f.name}</td>
            {f.values.map((v,j) => <td key={j} style={{textAlign:'center',padding:'8px 12px'}}>
              {typeof v === 'boolean' ? (v ? <span style={{color:tcss('--rk-success'),fontWeight:tcss('--rk-weight-bold')}}>✓</span> : <span style={{color:tcss('--rk-text-tertiary')}}>—</span>) : <span style={{color:tcss('--rk-text-primary')}}>{String(v)}</span>}
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
}
