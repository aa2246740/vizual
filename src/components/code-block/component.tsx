/**
 * Syntax-highlighted code block
 */
export function CodeBlock({ props }: { props: CodeBlockProps }) {
      const lines = props.code.split('\n')
      return <div>
        {props.title && <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:12,color:'#888'}}>{props.title}</span>
          {props.language && <span style={{fontSize:10,color:'#555',background:'#1a1a1a',padding:'2px 6px',borderRadius:4}}>{props.language}</span>}
        </div>}
        <pre style={{background:'#0a0a0a',border:'1px solid #2a2a2a',borderRadius:8,padding:16,fontSize:12,fontFamily:'monospace',overflow:'auto',maxHeight:400,lineHeight:1.6}}>
          {props.showLineNumbers ? lines.map((line, i) => <div key={i} style={{display:'flex'}}>
            <span style={{color:'#444',minWidth:30,textAlign:'right',marginRight:16,userSelect:'none'}}>{i+1}</span>
            <span style={{color:'#d1d5db'}}>{line}</span>
          </div>) : <span style={{color:'#d1d5db'}}>{props.code}</span>}
        </pre>
      </div>
}
