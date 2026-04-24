import type { SankeyChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Extract links and nodes from props.
 * Supports two formats:
 *   1. Explicit `links` + `nodes` arrays
 *   2. Flat `data` array with source/target/value objects (nodes inferred)
 */
function extractSankeyData(props: SankeyChartProps) {
  let links = Array.isArray(props.links) ? props.links : []
  if (links.length === 0 && Array.isArray(props.data)) {
    links = props.data.filter(
      (d: Record<string, unknown>) => d.source && d.target
    ) as SankeyChartProps['links']
  }
  let nodes = Array.isArray(props.nodes) ? props.nodes : []
  if (nodes.length === 0 && links.length > 0) {
    const names = new Set<string>()
    for (const l of links) {
      if (l.source) names.add(String(l.source))
      if (l.target) names.add(String(l.target))
    }
    nodes = [...names].map(n => ({ name: n }))
  }
  return { links, nodes }
}

function toMvizProps(props: SankeyChartProps): Record<string, unknown> {
  const { links } = extractSankeyData(props)
  return { ...props, data: links }
}

function buildSankeyFallback(props: SankeyChartProps): Record<string, unknown> {
  const { links, nodes } = extractSankeyData(props)
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      data: nodes.map((n: Record<string, unknown>) => ({ name: n.name })),
      links: links.map((l: Record<string, unknown>) => ({
        source: l.source, target: l.target, value: l.value,
      })),
    }],
  }
}

export const SankeyChart = createEChartsBridge('sankey', buildSankeyFallback, toMvizProps)
