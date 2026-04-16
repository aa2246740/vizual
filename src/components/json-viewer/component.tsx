/**
 * Syntax-highlighted collapsible JSON
 */
export function JsonViewer({ props }: { props: JsonViewerProps }) {
      const json = typeof props.data === 'string' ? props.data : JSON.stringify(props.data, null, 2)
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</h3>}
        <pre style={{background:'#0a0a0a',border:'1px solid #2a2a2a',borderRadius:8,padding:16,fontSize:12,fontFamily:'monospace',overflow:'auto',maxHeight:400,color:'#d1d5db',lineHeight:1.6}}>{json}</pre>
      </div>
}
