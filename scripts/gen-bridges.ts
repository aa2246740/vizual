/**
 * Generate all mviz chart bridge files (schema.ts + component.tsx + index.ts)
 * Run: npx tsx scripts/gen-bridges.ts
 */
import { writeFileSync, mkdirSync } from 'fs'

const charts = [
  { name: 'area', title: 'Area Chart', extra: 'stacked: z.boolean().optional(), smooth: z.boolean().optional(),' },
  { name: 'boxplot', title: 'Boxplot Chart', extra: 'valueField: z.string().optional(), groupField: z.string().optional(),' },
  { name: 'bubble', title: 'Bubble Chart', extra: 'size: z.string().optional(), groupField: z.string().optional(),' },
  { name: 'calendar', title: 'Calendar Heatmap', extra: 'dateField: z.string().optional(), valueField: z.string().optional(), range: z.string().optional(),' },
  { name: 'combo', title: 'Combo Chart', extra: 'series: z.array(z.object({ type: z.enum(["bar","line"]), y: z.string() })).optional(),' },
  { name: 'dumbbell', title: 'Dumbbell Chart', extra: 'low: z.string().optional(), high: z.string().optional(), groupField: z.string().optional(),' },
  { name: 'funnel', title: 'Funnel Chart', extra: 'value: z.string().optional(), label: z.string().optional(),' },
  { name: 'heatmap', title: 'Heatmap', extra: 'xField: z.string().optional(), yField: z.string().optional(), valueField: z.string().optional(),' },
  { name: 'histogram', title: 'Histogram', extra: 'value: z.string().optional(), bins: z.number().optional(),' },
  { name: 'line', title: 'Line Chart', extra: 'smooth: z.boolean().optional(), multiSeries: z.boolean().optional(),' },
  { name: 'pie', title: 'Pie/Donut Chart', extra: 'value: z.string().optional(), label: z.string().optional(), donut: z.boolean().optional(),' },
  { name: 'sankey', title: 'Sankey Diagram', extra: 'nodes: z.array(z.object({ name: z.string() })).optional(), links: z.array(z.object({ source: z.string(), target: z.string(), value: z.number() })).optional(),' },
  { name: 'scatter', title: 'Scatter Chart', extra: 'size: z.string().optional(), groupField: z.string().optional(),' },
  { name: 'sparkline', title: 'Sparkline', extra: 'sparkType: z.enum(["line","bar","pct_bar"]).optional(), value: z.string().optional(),' },
  { name: 'waterfall', title: 'Waterfall Chart', extra: 'label: z.string().optional(), value: z.string().optional(),' },
  { name: 'xmr', title: 'XMR Control Chart', extra: 'value: z.string().optional(),' },
]

const dir = 'src/mviz-bridge'

for (const chart of charts) {
  const { name, title, extra } = chart
  const schemaName = `${capitalize(name)}Schema`
  const propsName = `${capitalize(name)}Props`
  const componentName = capitalize(name) + 'Chart'
  const pascalName = capitalize(name)

  // schema.ts
  writeFileSync(`${dir}/${name}/schema.ts`, `import { z } from 'zod'

export const ${schemaName} = z.object({
  type: z.literal('${name}'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  ${extra}
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type ${propsName} = z.infer<typeof ${schemaName}>
`)

  // component.tsx with fallback option builder
  writeFileSync(`${dir}/${name}/component.tsx`, `import type { ${propsName} } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function build${pascalName}Fallback(props: ${propsName}): Record<string, unknown> {
  const x = props.x ?? 'name'
  const y = props.y ?? (Array.isArray(props.y) ? props.y[0] : 'value')
  const yFields = Array.isArray(y) ? y : [y]
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: props.data.map(d => String(d[x] ?? '')) },
    yAxis: { type: 'value' },
    series: yFields.map(f => ({
      type: '${name === 'area' ? 'line' : name === 'sparkline' ? 'line' : name}',
      name: f, data: props.data.map(d => Number(d[f]) || 0),
      ${name === 'area' ? 'areaStyle: {},' : ''}
    })),
  }
}

export const ${componentName} = createEChartsBridge('${name}', build${pascalName}Fallback)
`)

  // index.ts
  writeFileSync(`${dir}/${name}/index.ts`, `export { ${componentName} } from './component'
export { ${schemaName} } from './schema'
export type { ${propsName} } from './schema'
`)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

console.log(`Generated ${charts.length} chart bridges`)
