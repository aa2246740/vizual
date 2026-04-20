import type { FeatureTableProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Product comparison matrix
 */
export function FeatureTable({ props }: { props: FeatureTableProps }) {
      return <div style={{overflowX:'auto'}}>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'8px 12px',borderBottom:`2px solid ${tc('--rk-border-subtle')}`,color:tc('--rk-text-secondary')}}>Feature</th>
            {props.products.map(p => <th key={p} style={{textAlign:'center',padding:'8px 12px',borderBottom:`2px solid ${tc('--rk-border-subtle')}`,color:tc('--rk-text-primary')}}>{p}</th>)}
          </tr></thead>
          <tbody>{props.features.map((f,i) => <tr key={i} style={{borderBottom:`1px solid ${tc('--rk-border')}`}}>
            <td style={{padding:'8px 12px',color:tc('--rk-text-secondary')}}>{f.name}</td>
            {f.values.map((v,j) => <td key={j} style={{textAlign:'center',padding:'8px 12px'}}>
              {typeof v === 'boolean' ? (v ? <span style={{color:tc('--rk-success'),fontWeight:700}}>✓</span> : <span style={{color:tc('--rk-text-tertiary')}}>—</span>) : <span style={{color:tc('--rk-text-primary')}}>{String(v)}</span>}
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
}
