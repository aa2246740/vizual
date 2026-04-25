import type { HistogramChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildHistogramFallback(props: HistogramChartProps): Record<string, unknown> {
  const x = props.x ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  const values = data.map(d => Number(d[x]) || 0)
  // Manual binning
  if (values.length === 0) return { series: [] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = 10
  const binWidth = (max - min) / binCount || 1
  const bins = Array(binCount).fill(0)
  const labels: string[] = []
  for (let i = 0; i < binCount; i++) {
    labels.push((min + i * binWidth).toFixed(1))
  }
  values.forEach(v => {
    let idx = Math.floor((v - min) / binWidth)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx]++
  })
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: bins }],
  }
}

export const HistogramChart = createEChartsBridge('histogram', buildHistogramFallback)
