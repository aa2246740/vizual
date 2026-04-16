import type { HistogramChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildHistogramFallback(props: HistogramChartProps): Record<string, unknown> {
  const valueField = props.value ?? (typeof props.y === 'string' ? props.y : 'value')
  const values = props.data.map(d => Number(d[valueField]) || 0)

  if (values.length === 0) {
    return {
      title: props.title ? { text: props.title } : undefined,
      series: [{ type: 'bar', data: [] }],
    }
  }

  // Compute histogram bins
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = props.bins ?? Math.max(Math.ceil(Math.sqrt(values.length)), 5)
  const binWidth = (max - min) / binCount || 1

  const bins: { range: string; count: number }[] = []
  for (let i = 0; i < binCount; i++) {
    const lo = min + i * binWidth
    const hi = lo + binWidth
    const count = values.filter(v => i === binCount - 1 ? (v >= lo && v <= hi) : (v >= lo && v < hi)).length
    bins.push({
      range: `${lo.toFixed(1)}-${hi.toFixed(1)}`,
      count,
    })
  }

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: bins.map(b => b.range), name: valueField },
    yAxis: { type: 'value', name: 'Frequency' },
    series: [{
      type: 'bar',
      data: bins.map(b => b.count),
      barWidth: '95%',
      itemStyle: { color: '#6366f1' },
    }],
  }
}

export const HistogramChart = createEChartsBridge('histogram', buildHistogramFallback)
