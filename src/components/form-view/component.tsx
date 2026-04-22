import type { FormViewProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Structured key-value data display
 */
export function FormView({ props }: { props: FormViewProps }) {
      const cols = props.columns ?? 2
      return <div>
        {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:'12px 24px'}}>
          {props.fields.map((f,i) => <div key={i}>
            <div style={{fontSize:tcss('--rk-text-xs'),color:tcss('--rk-text-secondary'),marginBottom:2}}>{f.label}</div>
            <div style={{fontSize:tcss('--rk-text-base'),color:tcss('--rk-text-primary')}}>
              {f.type === 'boolean' ? (f.value ? 'Yes' : 'No') :
               f.type === 'url' ? <a href={String(f.value)} style={{color:tcss('--rk-accent')}}>{String(f.value)}</a> :
               String(f.value ?? '—')}
            </div>
          </div>)}
        </div>
      </div>
}
