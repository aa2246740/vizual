/**
 * Syntax-highlighted collapsible JSON
 */
export function JsonViewer({ props }: { props: JsonViewerProps }) {
      let json = typeof props.data === 'string' ? props.data : JSON.stringify(props.data, null, 2)

      // Truncate depth if maxDepth is specified
      if (props.maxDepth && props.maxDepth > 0 && typeof props.data === 'object' && props.data !== null) {
        json = JSON.stringify(props.data, (key, value) => {
          // Track depth via stack
          return value
        }, 2)
        // Simple depth-based truncation
        const lines = json.split('\n')
        let depth = 0
        const filtered: string[] = []
        for (const line of lines) {
          const opens = (line.match(/[{[]/g) || []).length
          const closes = (line.match(/[}\]]/g) || []).length
          const prevDepth = depth
          depth += opens - closes
          if (prevDepth < props.maxDepth!) {
            filtered.push(line)
          } else if (prevDepth === props.maxDepth!) {
            // Replace nested content with "..."
            const trimmed = line.replace(/[{[].*/, '...')
            filtered.push(trimmed)
          }
        }
        if (filtered.length !== lines.length) {
          json = filtered.join('\n')
        }
      }

      const collapsed = props.expanded === false
      const maxH = collapsed ? 60 : 400

      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</h3>}
        <pre style={{background:'#0a0a0a',border:'1px solid #2a2a2a',borderRadius:8,padding:16,fontSize:12,fontFamily:'monospace',overflow:'auto',maxHeight:maxH,color:'#d1d5db',lineHeight:1.6,whiteSpace:collapsed?'nowrap':'pre-wrap'}}>{json}</pre>
      </div>
}
