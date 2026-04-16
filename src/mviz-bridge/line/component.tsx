import type { LineChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildLineFallback(props: LineChartProps): Record<string, unknown> {
  const xField = props.x ?? 'name'
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  const categoryData = props.data.map(d => String(d[xField] ?? ''))

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categoryData, boundaryGap: false },
    yAxis: { type: 'value' },
    series: yFields.map(field => ({
      type: 'line',
      name: field,
      smooth: props.smooth ?? false,
      data: props.data.map(d => Number(d[field]) || 0),
    })),
  }
}

export const LineChart = createEChartsBridge('line', buildLineFallback)
