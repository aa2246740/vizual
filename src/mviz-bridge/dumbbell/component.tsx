import type { DumbbellChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildDumbbellFallback(props: DumbbellChartProps): Record<string, unknown> {
  const xField = props.x ?? 'name'
  const lowField = props.low ?? 'low'
  const highField = props.high ?? 'high'
  const categoryData = props.data.map(d => String(d[xField] ?? ''))

  // Dumbbell = line connecting low and high values, rendered via markLine on a scatter
  // Using custom series with markPoint approach for visual dumbbell shape
  const lowData = props.data.map(d => Number(d[lowField]) || 0)
  const highData = props.data.map(d => Number(d[highField]) || 0)

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categoryData },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        name: 'range',
        data: highData.map((h, i) => [lowData[i], h]),
        itemStyle: { color: 'transparent' },
        barWidth: 2,
        encode: { y: [0, 1] },
      },
      {
        type: 'scatter',
        name: 'high',
        data: highData,
        symbolSize: 10,
        itemStyle: { color: '#f59e0b' },
      },
      {
        type: 'scatter',
        name: 'low',
        data: lowData,
        symbolSize: 10,
        itemStyle: { color: '#3b82f6' },
      },
    ],
  }
}

export const DumbbellChart = createEChartsBridge('dumbbell', buildDumbbellFallback)
