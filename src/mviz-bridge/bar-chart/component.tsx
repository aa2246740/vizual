import type { BarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Build ECharts bar option from schema props.
 */
function buildBarFallback(props: BarChartProps): Record<string, unknown> {
  const { x = 'name', y = 'value', data, title, stacked, horizontal } = props
  const yFields = Array.isArray(y) ? y : [y]
  const categoryData = (data ?? []).map((d: Record<string, unknown>) => String(d[x] ?? ''))

  const hasTitle = !!title
  const hasLegend = yFields.length > 1

  return {
    title: hasTitle ? { text: title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: hasLegend ? { top: hasTitle ? 30 : 0, left: 'center' } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? (hasLegend ? 70 : 40) : (hasLegend ? 30 : 30),
      containLabel: true,
    },
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
