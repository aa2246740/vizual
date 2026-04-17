import type { SankeyChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz reads spec.data for the links array.
 * Our schema uses links for the connections.
 */
function toMvizProps(props: SankeyChartProps): Record<string, unknown> {
  return {
    ...props,
    data: props.links ?? [],
  }
}

function buildSankeyFallback(props: SankeyChartProps): Record<string, unknown> {
  const links = Array.isArray(props.links) ? props.links : []
  const nodes = Array.isArray(props.nodes) ? props.nodes : []
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
