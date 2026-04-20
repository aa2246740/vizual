import type { CodeBlockProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Syntax-highlighted code block
 */
export function CodeBlock({ props }: { props: CodeBlockProps }) {
      const lines = props.code.split('\n')
      return <div>
        {props.title && <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:12,color:tc('--rk-text-secondary')}}>{props.title}</span>
          {props.language && <span style={{fontSize:10,color:tc('--rk-text-tertiary'),background:tc('--rk-bg-secondary'),padding:'2px 6px',borderRadius:4}}>{props.language}</span>}
        </div>}
        <pre style={{background:tc('--rk-bg-primary'),border:`1px solid ${tc('--rk-border-subtle')}`,borderRadius:8,padding:16,fontSize:12,fontFamily:tc('--rk-font-mono'),overflow:'auto',maxHeight:400,lineHeight:1.6}}>
          {props.showLineNumbers ? lines.map((line, i) => <div key={i} style={{display:'flex'}}>
            <span style={{color:tc('--rk-text-tertiary'),minWidth:30,textAlign:'right',marginRight:16,userSelect:'none'}}>{i+1}</span>
            <span style={{color:tc('--rk-text-primary')}}>{line}</span>
          </div>) : <span style={{color:tc('--rk-text-primary')}}>{props.code}</span>}
        </pre>
      </div>
}
