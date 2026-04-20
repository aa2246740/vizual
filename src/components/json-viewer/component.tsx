import type { JsonViewerProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Syntax-highlighted collapsible JSON
 */
export function JsonViewer({ props }: { props: JsonViewerProps }) {
      const json = typeof props.data === 'string' ? props.data : JSON.stringify(props.data, null, 2)
      return <div>
        {props.title && <h3 style={{fontSize:parseInt(tcss('--rk-text-md')),fontWeight:parseInt(tcss('--rk-weight-semibold')),marginBottom:8}}>{props.title}</h3>}
        <pre style={{background:tcss('--rk-bg-primary'),border:`1px solid ${tcss('--rk-border-subtle')}`,borderRadius:parseInt(tcss('--rk-radius-md')),padding:16,fontSize:parseInt(tcss('--rk-text-sm')),fontFamily:tcss('--rk-font-mono'),overflow:'auto',maxHeight:400,color:tcss('--rk-text-primary'),lineHeight:1.6}}>{json}</pre>
      </div>
}
