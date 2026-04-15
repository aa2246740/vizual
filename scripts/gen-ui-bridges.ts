/**
 * Generate all mviz UI component bridge files
 * Run: npx tsx scripts/gen-ui-bridges.ts
 */
import { writeFileSync } from 'fs'

const components = [
  {
    dir: 'big-value', type: 'big_value', component: 'BigValue', desc: 'Large metric display with optional subtitle',
    schema: `z.object({
      type: z.literal('big_value'),
      title: z.string().optional(),
      value: z.union([z.string(), z.number()]),
      subtitle: z.string().optional(),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      trend: z.enum(['up', 'down', 'flat']).optional(),
      trendValue: z.string().optional(),
    })`,
    render: `(props) => {
      const isUp = props.trend === 'up', isDown = props.trend === 'down'
      return <div style={{padding: '8px 0'}}>
        {props.title && <div style={{fontSize:12,color:'var(--rk-text-secondary,#888)',marginBottom:4}}>{props.title}</div>}
        <div style={{fontSize:32,fontWeight:700,color:'var(--rk-text-primary,#e5e5e5)',display:'flex',alignItems:'baseline',gap:4}}>
          {props.prefix && <span style={{fontSize:18}}>{props.prefix}</span>}
          <span>{String(props.value)}</span>
          {props.suffix && <span style={{fontSize:16,color:'var(--rk-text-secondary,#888)'}}>{props.suffix}</span>}
        </div>
        {(props.subtitle || props.trendValue) && <div style={{fontSize:13,marginTop:4,display:'flex',gap:8,alignItems:'center'}}>
          {props.trendValue && <span style={{color:isUp?'#22c55e':isDown?'#ef4444':'#888',fontWeight:600}}>
            {isUp?'↑':isDown?'↓':'→'} {props.trendValue}
          </span>}
          {props.subtitle && <span style={{color:'var(--rk-text-secondary,#888)'}}>{props.subtitle}</span>}
        </div>}
      </div>
    }`
  },
  {
    dir: 'delta', type: 'delta', component: 'Delta', desc: 'Value change indicator',
    schema: `z.object({
      type: z.literal('delta'),
      value: z.union([z.string(), z.number()]),
      previousValue: z.union([z.string(), z.number()]).optional(),
      label: z.string().optional(),
      direction: z.enum(['up', 'down', 'flat']).optional(),
      showPercentage: z.boolean().optional(),
    })`,
    render: `(props) => {
      const isUp = props.direction === 'up', isDown = props.direction === 'down'
      let pct = ''
      if (props.previousValue != null && props.previousValue !== 0) {
        pct = (((Number(props.value) - Number(props.previousValue)) / Number(props.previousValue)) * 100).toFixed(1) + '%'
      }
      return <div style={{padding: '8px 0',textAlign:'center'}}>
        {props.label && <div style={{fontSize:12,color:'var(--rk-text-secondary,#888)',marginBottom:4}}>{props.label}</div>}
        <div style={{fontSize:24,fontWeight:700,color:isUp?'#22c55e':isDown?'#ef4444':'var(--rk-text-primary,#e5e5e5)'}}>
          {isUp?'↑ ':isDown?'↓ ':'→ '}{String(props.value)}
          {props.showPercentage && pct && <span style={{fontSize:14,marginLeft:8}}>{pct}</span>}
        </div>
      </div>
    }`
  },
  {
    dir: 'alert', type: 'alert', component: 'Alert', desc: 'Alert banner with severity',
    schema: `z.object({
      type: z.literal('alert'),
      title: z.string().optional(),
      message: z.string(),
      severity: z.enum(['info', 'warning', 'error', 'success']).optional(),
    })`,
    render: `(props) => {
      const colors = {info:['#1e3a5f','#3b82f6'],warning:['#422006','#f59e0b'],error:['#450a0a','#ef4444'],success:['#052e16','#22c55e']}
      const [bg,accent] = colors[props.severity ?? 'info']
      return <div style={{padding:'12px 16px',borderRadius:8,borderLeft:\`4px solid \${accent}\`,background:bg,marginBottom:8}}>
        {props.title && <div style={{fontSize:14,fontWeight:600,color:accent,marginBottom:4}}>{props.title}</div>}
        <div style={{fontSize:13,color:'#d1d5db',lineHeight:1.5}}>{props.message}</div>
      </div>
    }`
  },
  {
    dir: 'note', type: 'note', component: 'Note', desc: 'Callout note with icon',
    schema: `z.object({
      type: z.literal('note'),
      title: z.string().optional(),
      content: z.string(),
      variant: z.enum(['info', 'tip', 'warning', 'important']).optional(),
    })`,
    render: `(props) => {
      const icons = {info:'ℹ️',tip:'💡',warning:'⚠️',important:'🔴'}
      const icon = icons[props.variant ?? 'info']
      return <div style={{padding:'12px 16px',borderRadius:8,background:'#1a1a2e',border:'1px solid #2a2a3e',marginBottom:8,display:'flex',gap:12}}>
        <span style={{fontSize:18}}>{icon}</span>
        <div>
          {props.title && <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{props.title}</div>}
          <div style={{fontSize:13,color:'#9ca3af',lineHeight:1.5}}>{props.content}</div>
        </div>
      </div>
    }`
  },
  {
    dir: 'text', type: 'text', component: 'TextBlock', desc: 'Styled text display',
    schema: `z.object({
      type: z.literal('text'),
      content: z.string(),
      fontSize: z.number().optional(),
      fontWeight: z.enum(['normal','bold','light']).optional(),
      align: z.enum(['left','center','right']).optional(),
      color: z.string().optional(),
    })`,
    render: `(props) => <div style={{
      fontSize: props.fontSize ?? 14,
      fontWeight: props.fontWeight ?? 'normal',
      textAlign: props.align ?? 'left',
      color: props.color ?? 'var(--rk-text-primary,#e5e5e5)',
      lineHeight: 1.6,
    }}>{props.content}</div>`
  },
  {
    dir: 'textarea', type: 'textarea', component: 'TextArea', desc: 'Multi-line text block',
    schema: `z.object({
      type: z.literal('textarea'),
      content: z.string(),
      title: z.string().optional(),
      maxLines: z.number().optional(),
    })`,
    render: `(props) => <div style={{
      padding: '12px 16px', borderRadius: 8, background: '#111', border: '1px solid #2a2a2a',
      fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6,
      whiteSpace: 'pre-wrap', maxHeight: props.maxLines ? props.maxLines * 22 : undefined,
      overflow: 'auto', color: '#d1d5db',
    }}>
      {props.title && <div style={{fontSize:12,color:'#888',marginBottom:8}}>{props.title}</div>}
      {props.content}
    </div>`
  },
  {
    dir: 'table', type: 'table', component: 'DataTable', desc: 'Data table with formatting',
    schema: `z.object({
      type: z.literal('table'),
      title: z.string().optional(),
      columns: z.array(z.object({ key: z.string(), label: z.string().optional(), align: z.enum(['left','center','right']).optional() })).optional(),
      data: z.array(z.record(z.unknown())),
      striped: z.boolean().optional(),
      compact: z.boolean().optional(),
    })`,
    render: `(props) => {
      const cols = props.columns ?? (props.data.length > 0 ? Object.keys(props.data[0]).map(k=>({key:k})) : [])
      return <div style={{width:'100%'}}>
        {props.title && <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</div>}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:props.compact?12:13}}>
          <thead><tr>{cols.map(c=><th key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:'2px solid #2a2a2a',color:'#888',fontWeight:600}}>{c.label??c.key}</th>)}</tr></thead>
          <tbody>{props.data.map((row,i)=><tr key={i} style={{background:props.striped&&i%2?'#111':'transparent'}}>
            {cols.map(c=><td key={c.key} style={{textAlign:c.align??'left',padding:props.compact?'4px 8px':'8px 12px',borderBottom:'1px solid #1a1a1a',color:'#d1d5db'}}>{String(row[c.key]??'')}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    }`
  },
  {
    dir: 'empty-space', type: 'empty_space', component: 'EmptySpace', desc: 'Spacer component',
    schema: `z.object({
      type: z.literal('empty_space'),
      height: z.number().optional(),
    })`,
    render: `(props) => <div style={{height: props.height ?? 24}} />`
  },
]

for (const comp of components) {
  const { dir, type, component, desc, schema, render } = comp

  writeFileSync(`src/mviz-bridge/${dir}/schema.ts`, `import { z } from 'zod'

export const ${component}Schema = ${schema}

export type ${component}Props = z.infer<typeof ${component}Schema>
`)

  writeFileSync(`src/mviz-bridge/${dir}/component.tsx`, `import type { ${component}Props } from './schema'

/**
 * ${desc}
 */
export function ${component}(props: ${component}Props) {
  return ${render}
}
`)

  writeFileSync(`src/mviz-bridge/${dir}/index.ts`, `export { ${component} } from './component'
export { ${component}Schema } from './schema'
export type { ${component}Props } from './schema'
`)
}

console.log(`Generated ${components.length} UI component bridges`)
