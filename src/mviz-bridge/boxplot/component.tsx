import type { BoxplotChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map our Schema fields to mviz's expected format.
 * mviz uses groupField/valueField for raw data aggregation.
 */
function toMvizProps(props: BoxplotChartProps): Record<string, unknown> {
  return {
    ...props,
    groupField: props.groupField ?? props.x ?? 'name',
    valueField: props.valueField ?? (Array.isArray(props.y) ? props.y[0] : props.y) ?? 'value',
  }
}

function buildBoxplotFallback(props: BoxplotChartProps): Record<string, unknown> {
  const groupField = props.groupField ?? props.x ?? 'name'
  const valueField = props.valueField ?? (Array.isArray(props.y) ? props.y[0] : props.y) ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  // Group data by category
  const groups: Record<string, number[]> = {}
  for (const d of data) {
    const cat = String(d[groupField] ?? 'unknown')
    const val = Number(d[valueField]) || 0
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(val)
  }
  const categories = Object.keys(groups)
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [{
      type: 'boxplot',
      data: categories.map(cat => {
        const vals = groups[cat].sort((a, b) => a - b)
        const len = vals.length
        const min = vals[0]
        const max = vals[len - 1]
        const q1 = vals[Math.floor(len * 0.25)]
        const median = vals[Math.floor(len * 0.5)]
        const q3 = vals[Math.floor(len * 0.75)]
        return [min, q1, median, q3, max]
      }),
    }],
  }
}

export const BoxplotChart = createEChartsBridge('boxplot', buildBoxplotFallback, toMvizProps)
