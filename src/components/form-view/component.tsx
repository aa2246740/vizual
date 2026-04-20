import type { FormViewProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Structured key-value data display
 */
export function FormView({ props }: { props: FormViewProps }) {
      const cols = props.columns ?? 2
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:'12px 24px'}}>
          {props.fields.map((f,i) => <div key={i}>
            <div style={{fontSize:11,color:tc('--rk-text-secondary'),marginBottom:2}}>{f.label}</div>
            <div style={{fontSize:13,color:tc('--rk-text-primary')}}>
              {f.type === 'boolean' ? (f.value ? 'Yes' : 'No') :
               f.type === 'url' ? <a href={String(f.value)} style={{color:tc('--rk-accent')}}>{String(f.value)}</a> :
               String(f.value ?? '—')}
            </div>
          </div>)}
        </div>
      </div>
}
