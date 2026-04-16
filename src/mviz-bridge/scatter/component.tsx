import type { ScatterChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildScatterFallback(props: ScatterChartProps): Record<string, unknown> {
  const xField = props.x ?? 'x'
  const yField = typeof props.y === 'string' ? props.y : (Array.isArray(props.y) ? props.y[0] : 'y')

  const scatterData = props.data.map(d => [
    Number(d[xField]) || 0,
    Number(d[yField]) || 0,
  ])

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: xField },
    yAxis: { type: 'value', name: yField },
    series: [{
      type: 'scatter',
      data: scatterData,
      symbolSize: 8,
      emphasis: { focus: 'series' },
    }],
  }
}

export const ScatterChart = createEChartsBridge('scatter', buildScatterFallback)
