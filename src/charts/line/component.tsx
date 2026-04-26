import type { LineChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Build ECharts line option from schema props.
 */
function buildLineFallback(props: LineChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const y = props.y ?? 'value'
  const yFields = Array.isArray(y) ? y : [y]
  const data = Array.isArray(props.data) ? props.data : []
  const categoryData = data.map(d => String(d[x] ?? ''))

  const hasTitle = !!props.title
  const hasLegend = yFields.length > 1

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: hasLegend ? { top: hasTitle ? 30 : 0, left: 'center' } : undefined,
    grid: {
      left: '4%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? (hasLegend ? 70 : 40) : (hasLegend ? 30 : 30),
      containLabel: true,
    },
    xAxis: { type: 'category', data: categoryData, boundaryGap: false },
    yAxis: { type: 'value' },
    series: yFields.map(f => ({
      type: 'line',
      name: f,
      data: data.map(d => Number(d[f]) || 0),
      smooth: true,
    })),
  }
}

export const LineChart = createEChartsBridge('line', buildLineFallback)
