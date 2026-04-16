import type { WaterfallChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildWaterfallFallback(props: WaterfallChartProps): Record<string, unknown> {
  const labelField = props.label ?? props.x ?? 'name'
  const valueField = props.value ?? (typeof props.y === 'string' ? props.y : 'value')
  const categoryData = props.data.map(d => String(d[labelField] ?? ''))
  const rawValues = props.data.map(d => Number(d[valueField]) || 0)

  // Waterfall: stacked bar with invisible base + visible delta
  let cumulative = 0
  const helperData: number[] = [] // invisible base
  const positiveData: (number | null)[] = [] // positive bars
  const negativeData: (number | null)[] = [] // negative bars

  rawValues.forEach(val => {
    if (val >= 0) {
      helperData.push(cumulative)
      positiveData.push(val)
      negativeData.push(null)
    } else {
      helperData.push(cumulative + val)
      positiveData.push(null)
      negativeData.push(-val)
    }
    cumulative += val
  })

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const idx = params[0].dataIndex
        return `${categoryData[idx]}: ${rawValues[idx] > 0 ? '+' : ''}${rawValues[idx]}`
      },
    },
    xAxis: { type: 'category', data: categoryData },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'base',
        type: 'bar',
        stack: 'waterfall',
        data: helperData,
        itemStyle: { color: 'transparent' },
        barWidth: '50%',
      },
      {
        name: 'positive',
        type: 'bar',
        stack: 'waterfall',
        data: positiveData,
        itemStyle: { color: '#22c55e' },
      },
      {
        name: 'negative',
        type: 'bar',
        stack: 'waterfall',
        data: negativeData,
        itemStyle: { color: '#ef4444' },
      },
    ],
  }
}

export const WaterfallChart = createEChartsBridge('waterfall', buildWaterfallFallback)
