import type { SankeyChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildSankeyFallback(props: SankeyChartProps): Record<string, unknown> {
  let nodes = props.nodes
  let links = props.links

  if (!nodes || !links) {
    const sourceField = props.x ?? 'source'
    const targetField = typeof props.y === 'string' ? props.y : 'target'
    const valueField = props.valueField ?? 'value'

    const nodeNames = new Set<string>()
    props.data.forEach(d => {
      const s = String(d[sourceField] ?? '')
      const t = String(d[targetField] ?? '')
      if (s) nodeNames.add(s)
      if (t) nodeNames.add(t)
    })

    nodes = [...nodeNames].map(name => ({ name }))
    links = props.data.map(d => ({
      source: String(d[sourceField] ?? ''),
      target: String(d[targetField] ?? ''),
      value: Number(d[valueField]) || 0,
    })).filter(l => l.source && l.target)
  }

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      data: nodes,
      links: links,
      emphasis: { focus: 'adjacency' },
      lineStyle: { color: 'gradient', curveness: 0.5 },
      label: { color: '#aaa' },
    }],
  }
}

export const SankeyChart = createEChartsBridge('sankey', buildSankeyFallback)
