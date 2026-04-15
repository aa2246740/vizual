import type { BoxplotChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildBoxplotFallback(props: BoxplotChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const y = props.y ?? (Array.isArray(props.y) ? props.y[0] : 'value')
  const yFields = Array.isArray(y) ? y : [y]
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: props.data.map(d => String(d[x] ?? '')) },
    yAxis: { type: 'value' },
    series: yFields.map(f => ({
      type: 'boxplot',
      name: f, data: props.data.map(d => Number(d[f]) || 0),
      
    })),
  }
}

export const BoxplotChart = createEChartsBridge('boxplot', buildBoxplotFallback)
