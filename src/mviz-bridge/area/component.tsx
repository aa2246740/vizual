import type { AreaChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildAreaFallback(props: AreaChartProps): Record<string, unknown> {
  const xField = props.x ?? 'name'
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  const categoryData = props.data.map(d => String(d[xField] ?? ''))

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categoryData, boundaryGap: false },
    yAxis: { type: 'value' },
    series: yFields.map((field, i) => ({
      type: 'line',
      name: field,
      smooth: props.smooth ?? false,
      stack: props.stacked ? 'total' : undefined,
      areaStyle: props.stacked ? { opacity: 0.6 } : {},
      data: props.data.map(d => Number(d[field]) || 0),
    })),
  }
}

export const AreaChart = createEChartsBridge('area', buildAreaFallback)
