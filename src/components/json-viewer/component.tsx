import type { JsonViewerProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Syntax-highlighted collapsible JSON
 */
export function JsonViewer({ props }: { props: JsonViewerProps }) {
      const json = typeof props.data === 'string' ? props.data : JSON.stringify(props.data, null, 2)
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</h3>}
        <pre style={{background:tc('--rk-bg-primary'),border:`1px solid ${tc('--rk-border-subtle')}`,borderRadius:8,padding:16,fontSize:12,fontFamily:tc('--rk-font-mono'),overflow:'auto',maxHeight:400,color:tc('--rk-text-primary'),lineHeight:1.6}}>{json}</pre>
      </div>
}
