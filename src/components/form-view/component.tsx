import type { FormViewProps } from './schema'

/**
 * Structured key-value data display
 */
export function FormView({ props }: { props: FormViewProps }) {
      const cols = props.columns ?? 2
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:'12px 24px'}}>
          {props.fields.map((f,i) => <div key={i}>
            <div style={{fontSize:11,color:'#888',marginBottom:2}}>{f.label}</div>
            <div style={{fontSize:13,color:'#e5e5e5'}}>
              {f.type === 'boolean' ? (f.value ? 'Yes' : 'No') :
               f.type === 'url' ? <a href={String(f.value)} style={{color:'#3b82f6'}}>{String(f.value)}</a> :
               String(f.value ?? '—')}
            </div>
          </div>)}
        </div>
      </div>
}
