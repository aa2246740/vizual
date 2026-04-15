/**
 * Generate all 10 remaining business component files
 * Run: npx tsx scripts/gen-business.ts
 */
import { writeFileSync } from 'fs'

const components = [
  {
    dir: 'kanban', component: 'Kanban', desc: 'Kanban board with columns and cards',
    schema: `z.object({
      type: z.literal('kanban'),
      title: z.string().optional(),
      columns: z.array(z.object({
        id: z.string(), title: z.string(), color: z.string().optional(),
        cards: z.array(z.object({
          id: z.string(), title: z.string(),
          description: z.string().optional(),
          tags: z.array(z.string()).optional(),
          assignee: z.string().optional(),
          priority: z.enum(['low','medium','high']).optional(),
        })),
      })),
    })`,
    render: `(props) => {
      const colors = {low:'#22c55e',medium:'#f59e0b',high:'#ef4444'}
      return <div style={{width:'100%'}}>
        {props.title && <h3 style={{fontSize:16,fontWeight:600,marginBottom:12,color:'var(--rk-text-primary,#e5e5e5)'}}>{props.title}</h3>}
        <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}}>
          {props.columns.map(col => (
            <div key={col.id} style={{minWidth:250,flex:1,background:'#111',borderRadius:8,padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col.color??'#3b82f6'}} />
                <span style={{fontSize:13,fontWeight:600,color:'#aaa'}}>{col.title}</span>
                <span style={{fontSize:11,color:'#555',marginLeft:'auto'}}>{col.cards.length}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {col.cards.map(card => (
                  <div key={card.id} style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:6,padding:10}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4,color:'#e5e5e5'}}>{card.title}</div>
                    {card.description && <div style={{fontSize:12,color:'#888',lineHeight:1.4}}>{card.description}</div>}
                    {(card.tags?.length || card.assignee || card.priority) && <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
                      {card.tags?.map((t,i) => <span key={i} style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:'#1e293b',color:'#94a3b8'}}>{t}</span>)}
                      {card.priority && <span style={{width:6,height:6,borderRadius:'50%',background:colors[card.priority]}} />}
                      {card.assignee && <span style={{fontSize:10,color:'#666',marginLeft:'auto'}}>{card.assignee}</span>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    }`
  },
  {
    dir: 'gantt', component: 'GanttChart', desc: 'Gantt chart with task bars and date axis',
    schema: `z.object({
      type: z.literal('gantt'),
      title: z.string().optional(),
      tasks: z.array(z.object({
        id: z.string(), name: z.string(),
        start: z.string(), end: z.string(),
        progress: z.number().min(0).max(100).optional(),
        color: z.string().optional(),
        dependencies: z.array(z.string()).optional(),
      })),
    })`,
    render: `(props) => {
      if (props.tasks.length === 0) return <div style={{color:'#888',fontSize:13}}>No tasks</div>
      const starts = props.tasks.map(t => new Date(t.start).getTime())
      const ends = props.tasks.map(t => new Date(t.end).getTime())
      const minTime = Math.min(...starts), maxTime = Math.max(...ends)
      const range = maxTime - minTime || 1
      const barColors = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4']
      return <div style={{width:'100%'}}>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{position:'relative'}}>
          {props.tasks.map((task, i) => {
            const left = ((new Date(task.start).getTime() - minTime) / range * 100)
            const width = ((new Date(task.end).getTime() - new Date(task.start).getTime()) / range * 100)
            return <div key={task.id} style={{display:'flex',alignItems:'center',height:32,marginBottom:2}}>
              <div style={{width:120,flexShrink:0,fontSize:12,color:'#aaa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:8}}>{task.name}</div>
              <div style={{flex:1,position:'relative',height:20,background:'#111',borderRadius:4}}>
                <div style={{position:'absolute',left:left+'%',width:Math.max(width,1)+'%',height:'100%',background:task.color??barColors[i%barColors.length],borderRadius:4,opacity:0.8}} />
                {task.progress != null && <div style={{position:'absolute',left:left+'%',width:(width*task.progress/100)+'%',height:'100%',background:task.color??barColors[i%barColors.length],borderRadius:4}} />}
              </div>
            </div>
          })}
        </div>
      </div>
    }`
  },
  {
    dir: 'org-chart', component: 'OrgChart', desc: 'Organization chart with tree hierarchy',
    schema: `z.object({
      type: z.literal('org_chart'),
      title: z.string().optional(),
      nodes: z.array(z.object({
        id: z.string(), name: z.string(), role: z.string().optional(),
        parentId: z.string().nullable().optional(),
        avatar: z.string().optional(),
      })),
    })`,
    render: `(props) => {
      const roots = props.nodes.filter(n => !n.parentId)
      const getChildren = (id: string) => props.nodes.filter(n => n.parentId === id)
      const renderNode = (node: any, depth = 0) => {
        const children = getChildren(node.id)
        return <div key={node.id} style={{marginLeft: depth * 24}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#111',borderRadius:6,margin:'4px 0',borderLeft:'3px solid #3b82f6'}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#e5e5e5'}}>{node.name}</div>
              {node.role && <div style={{fontSize:11,color:'#888'}}>{node.role}</div>}
            </div>
          </div>
          {children.length > 0 && <div style={{borderLeft:'1px solid #2a2a2a',marginLeft:12}}>{children.map(c => renderNode(c, depth+1))}</div>}
        </div>
      }
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        {roots.map(r => renderNode(r))}
      </div>
    }`
  },
  {
    dir: 'kpi-dashboard', component: 'KpiDashboard', desc: 'Multi-metric KPI dashboard cards',
    schema: `z.object({
      type: z.literal('kpi_dashboard'),
      title: z.string().optional(),
      metrics: z.array(z.object({
        label: z.string(), value: z.union([z.string(), z.number()]),
        prefix: z.string().optional(), suffix: z.string().optional(),
        trend: z.enum(['up','down','flat']).optional(), trendValue: z.string().optional(),
        color: z.string().optional(),
      })),
      columns: z.number().optional(),
    })`,
    render: `(props) => {
      const cols = props.columns ?? Math.min(props.metrics.length, 4)
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:\`repeat(\${cols},1fr)\`,gap:12}}>
          {props.metrics.map((m, i) => {
            const isUp = m.trend === 'up', isDown = m.trend === 'down'
            return <div key={i} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:16}}>
              <div style={{fontSize:12,color:'#888',marginBottom:8}}>{m.label}</div>
              <div style={{fontSize:24,fontWeight:700,color:m.color??'#e5e5e5'}}>
                {m.prefix}{String(m.value)}{m.suffix && <span style={{fontSize:14,color:'#888'}}>{m.suffix}</span>}
              </div>
              {m.trendValue && <div style={{fontSize:12,marginTop:4,color:isUp?'#22c55e':isDown?'#ef4444':'#888'}}>
                {isUp?'↑':isDown?'↓':'→'} {m.trendValue}
              </div>}
            </div>
          })}
        </div>
      </div>
    }`
  },
  {
    dir: 'budget-report', component: 'BudgetReport', desc: 'Budget vs actual with variance',
    schema: `z.object({
      type: z.literal('budget_report'),
      title: z.string().optional(),
      categories: z.array(z.object({
        name: z.string(),
        budget: z.number(), actual: z.number(),
        color: z.string().optional(),
      })),
      showVariance: z.boolean().optional(),
    })`,
    render: `(props) => {
      const maxVal = Math.max(...props.categories.map(c => Math.max(c.budget, c.actual)))
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {props.categories.map((cat, i) => {
            const variance = cat.actual - cat.budget
            const isOver = variance > 0
            return <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,color:'#ddd'}}>{cat.name}</span>
                <div style={{display:'flex',gap:12,fontSize:12}}>
                  <span style={{color:'#888'}}>Budget: {cat.budget.toLocaleString()}</span>
                  <span style={{color:'#ddd'}}>Actual: {cat.actual.toLocaleString()}</span>
                  {props.showVariance !== false && <span style={{color:isOver?'#ef4444':'#22c55e'}}>{isOver?'+':''}{variance.toLocaleString()}</span>}
                </div>
              </div>
              <div style={{height:6,background:'#1a1a1a',borderRadius:3,position:'relative'}}>
                <div style={{position:'absolute',height:'100%',width:(cat.budget/maxVal*100)+'%',background:'#333',borderRadius:3}} />
                <div style={{position:'absolute',height:'100%',width:(cat.actual/maxVal*100)+'%',background:cat.color??(isOver?'#ef4444':'#3b82f6'),borderRadius:3,opacity:0.8}} />
              </div>
            </div>
          })}
        </div>
      </div>
    }`
  },
  {
    dir: 'feature-table', component: 'FeatureTable', desc: 'Product comparison matrix',
    schema: `z.object({
      type: z.literal('feature_table'),
      title: z.string().optional(),
      products: z.array(z.string()),
      features: z.array(z.object({
        name: z.string(), category: z.string().optional(),
        values: z.array(z.union([z.boolean(), z.string(), z.number()])),
      })),
    })`,
    render: `(props) => {
      return <div style={{overflowX:'auto'}}>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'8px 12px',borderBottom:'2px solid #2a2a2a',color:'#888'}}>Feature</th>
            {props.products.map(p => <th key={p} style={{textAlign:'center',padding:'8px 12px',borderBottom:'2px solid #2a2a2a',color:'#ddd'}}>{p}</th>)}
          </tr></thead>
          <tbody>{props.features.map((f,i) => <tr key={i} style={{borderBottom:'1px solid #1a1a1a'}}>
            <td style={{padding:'8px 12px',color:'#aaa'}}>{f.name}</td>
            {f.values.map((v,j) => <td key={j} style={{textAlign:'center',padding:'8px 12px'}}>
              {typeof v === 'boolean' ? (v ? <span style={{color:'#22c55e',fontWeight:700}}>✓</span> : <span style={{color:'#555'}}>—</span>) : <span style={{color:'#ddd'}}>{String(v)}</span>}
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
    }`
  },
  {
    dir: 'audit-log', component: 'AuditLog', desc: 'Operation log with timestamps',
    schema: `z.object({
      type: z.literal('audit_log'),
      title: z.string().optional(),
      entries: z.array(z.object({
        timestamp: z.string(), user: z.string(), action: z.string(),
        target: z.string().optional(), details: z.string().optional(),
        severity: z.enum(['info','warning','error']).optional(),
      })),
    })`,
    render: `(props) => {
      const sevColors = {info:'#3b82f6',warning:'#f59e0b',error:'#ef4444'}
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {props.entries.map((e,i) => <div key={i} style={{display:'flex',gap:12,padding:'6px 0',fontSize:12,borderBottom:'1px solid #1a1a1a',alignItems:'center'}}>
            <span style={{color:'#666',minWidth:140,fontFamily:'monospace'}}>{e.timestamp}</span>
            <span style={{color:'#888',minWidth:80}}>{e.user}</span>
            <span style={{color:sevColors[e.severity??'info'],fontWeight:500,minWidth:100}}>{e.action}</span>
            {e.target && <span style={{color:'#aaa'}}>{e.target}</span>}
            {e.details && <span style={{color:'#666',marginLeft:'auto'}}>{e.details}</span>}
          </div>)}
        </div>
      </div>
    }`
  },
  {
    dir: 'json-viewer', component: 'JsonViewer', desc: 'Syntax-highlighted collapsible JSON',
    schema: `z.object({
      type: z.literal('json_viewer'),
      title: z.string().optional(),
      data: z.unknown(),
      expanded: z.boolean().optional(),
      maxDepth: z.number().optional(),
    })`,
    render: `(props) => {
      const json = typeof props.data === 'string' ? props.data : JSON.stringify(props.data, null, 2)
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>{props.title}</h3>}
        <pre style={{background:'#0a0a0a',border:'1px solid #2a2a2a',borderRadius:8,padding:16,fontSize:12,fontFamily:'monospace',overflow:'auto',maxHeight:400,color:'#d1d5db',lineHeight:1.6}}>{json}</pre>
      </div>
    }`
  },
  {
    dir: 'code-block', component: 'CodeBlock', desc: 'Syntax-highlighted code block',
    schema: `z.object({
      type: z.literal('code_block'),
      title: z.string().optional(),
      code: z.string(),
      language: z.string().optional(),
      showLineNumbers: z.boolean().optional(),
    })`,
    render: `(props) => {
      const lines = props.code.split('\\n')
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
    }`
  },
  {
    dir: 'form-view', component: 'FormView', desc: 'Structured key-value data display',
    schema: `z.object({
      type: z.literal('form_view'),
      title: z.string().optional(),
      fields: z.array(z.object({
        label: z.string(), value: z.unknown(),
        type: z.enum(['text','number','date','email','url','boolean']).optional(),
      })),
      columns: z.number().optional(),
    })`,
    render: `(props) => {
      const cols = props.columns ?? 2
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'grid',gridTemplateColumns:\`repeat(\${cols},1fr)\`,gap:'12px 24px'}}>
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
    }`
  },
]

for (const comp of components) {
  const { dir, component, desc, schema, render } = comp

  writeFileSync(`src/components/${dir}/schema.ts`, `import { z } from 'zod'

export const ${component}Schema = ${schema}

export type ${component}Props = z.infer<typeof ${component}Schema>
`)

  writeFileSync(`src/components/${dir}/component.tsx`, `import type { ${component}Props } from './schema'

/**
 * ${desc}
 */
export function ${component}(props: ${component}Props) {
  return ${render}
}
`)

  writeFileSync(`src/components/${dir}/index.ts`, `export { ${component} } from './component'
export { ${component}Schema } from './schema'
export type { ${component}Props } from './schema'
`)
}

console.log(`Generated ${components.length} business components`)
