import type { BarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildBarFallback(props: BarChartProps): Record<string, unknown> {
  const { x, y, data, title, stacked, horizontal } = props
  const yFields = Array.isArray(y) ? y : [y]
  const categoryData = data.map(d => String(d[x]))

  return {
    title: title ? { text: title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: horizontal
      ? { type: 'value' }
      : { type: 'category', data: categoryData },
    yAxis: horizontal
      ? { type: 'category', data: categoryData }
      : { type: 'value' },
    series: yFields.map(field => ({
      type: 'bar',
      name: field,
      stack: stacked ? 'total' : undefined,
      data: data.map(d => Number(d[field]) || 0),
    })),
  }
}

/**
 * BarChart bridge component — uses createEChartsBridge factory
 * with a self-contained fallback if mviz is unavailable.
 */
export const BarChart = createEChartsBridge('bar', buildBarFallback)
