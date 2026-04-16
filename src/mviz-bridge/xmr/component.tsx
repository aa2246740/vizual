import type { XmrChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildXmrFallback(props: XmrChartProps): Record<string, unknown> {
  const xField = props.x ?? 'name'
  const valueField = props.value ?? (typeof props.y === 'string' ? props.y : 'value')
  const categoryData = props.data.map(d => String(d[xField] ?? ''))
  const values = props.data.map(d => Number(d[valueField]) || 0)

  // Calculate control limits (X-chart: mean ± 3*sigma)
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const sigma = values.length > 1
    ? Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1))
    : 0
  const ucl = mean + 3 * sigma
  const lcl = mean - 3 * sigma

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categoryData },
    yAxis: { type: 'value', min: lcl - sigma },
    series: [{
      type: 'line',
      name: valueField,
      data: values,
      markLine: {
        silent: true,
        lineStyle: { type: 'dashed' },
        data: [
          { yAxis: mean, name: 'CL', lineStyle: { color: '#22c55e' } },
          { yAxis: ucl, name: 'UCL', lineStyle: { color: '#ef4444' } },
          { yAxis: lcl, name: 'LCL', lineStyle: { color: '#ef4444' } },
        ],
        label: { position: 'insideEndTop', formatter: '{b}: {c}' },
      },
    }],
  }
}

export const XmrChart = createEChartsBridge('xmr', buildXmrFallback)
