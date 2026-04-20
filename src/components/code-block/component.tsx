import type { CodeBlockProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Syntax-highlighted code block
 */
export function CodeBlock({ props }: { props: CodeBlockProps }) {
      const lines = props.code.split('\n')
      return <div>
        {props.title && <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:parseInt(tcss('--rk-text-sm')),color:tcss('--rk-text-secondary')}}>{props.title}</span>
          {props.language && <span style={{fontSize:parseInt(tcss('--rk-text-xs')),color:tcss('--rk-text-tertiary'),background:tcss('--rk-bg-secondary'),padding:'2px 6px',borderRadius:parseInt(tcss('--rk-radius-sm'))}}>{props.language}</span>}
        </div>}
        <pre style={{background:tcss('--rk-bg-primary'),border:`1px solid ${tcss('--rk-border-subtle')}`,borderRadius:parseInt(tcss('--rk-radius-md')),padding:16,fontSize:parseInt(tcss('--rk-text-sm')),fontFamily:tcss('--rk-font-mono'),overflow:'auto',maxHeight:400,lineHeight:1.6}}>
          {props.showLineNumbers ? lines.map((line, i) => <div key={i} style={{display:'flex'}}>
            <span style={{color:tcss('--rk-text-tertiary'),minWidth:30,textAlign:'right',marginRight:16,userSelect:'none'}}>{i+1}</span>
            <span style={{color:tcss('--rk-text-primary')}}>{line}</span>
          </div>) : <span style={{color:tcss('--rk-text-primary')}}>{props.code}</span>}
        </pre>
      </div>
}
