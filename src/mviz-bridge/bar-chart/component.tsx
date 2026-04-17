import type { BarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildBarFallback(props: BarChartProps): Record<string, unknown> {
  const { x = 'name', y = 'value', data, title, stacked, horizontal } = props
  const yFields = Array.isArray(y) ? y : [y]
  const categoryData = (data ?? []).map((d: Record<string, unknown>) => String(d[x] ?? ''))

  return {
    title: title ? { text: title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: horizontal
      ? { type: 'value' }
      : { type: 'category', data: categoryData },
    yAxis: horizontal
      ? { type: 'category', data: categoryData }
      : { type: 'value' },
    series: yFields.map((field: string) => ({
      type: 'bar',
      name: field,
      stack: stacked ? 'total' : undefined,
      data: (data ?? []).map((d: Record<string, unknown>) => Number(d[field]) || 0),
    })),
  }
}

export const BarChart = createEChartsBridge('bar', buildBarFallback)
