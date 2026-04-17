import type { XmrChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz reads spec.value (default 'value') for the measurement field.
 * mviz reads spec.label (default 'label') for the x-axis label field.
 * Our schema uses y for measurements, x for labels.
 */
function toMvizProps(props: XmrChartProps): Record<string, unknown> {
  const valueField = props.value ?? props.y ?? 'value'
  const labelField = props.label ?? props.x ?? 'label'
  return {
    ...props,
    value: valueField,
    label: labelField,
  }
}

function buildXmrFallback(props: XmrChartProps): Record<string, unknown> {
  const x = props.x ?? 'sample'
  const y = props.y ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  const labels = data.map(d => String((d as Record<string, unknown>)[x] ?? ''))
  const values = data.map(d => Number((d as Record<string, unknown>)[y]) || 0)
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length || 1))
  const ucl = mean + 3 * stdDev
  const lcl = mean - 3 * stdDev
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', min: lcl - stdDev },
    series: [
      { type: 'line', name: 'UCL', data: Array(values.length).fill(ucl), lineStyle: { type: 'dashed', color: '#ef4444' }, symbol: 'none' },
      { type: 'line', name: 'CL', data: Array(values.length).fill(mean), lineStyle: { type: 'dashed', color: '#f59e0b' }, symbol: 'none' },
      { type: 'line', name: 'LCL', data: Array(values.length).fill(lcl), lineStyle: { type: 'dashed', color: '#ef4444' }, symbol: 'none' },
      { type: 'line', name: '测量值', data: values, lineStyle: { color: '#3b82f6' }, itemStyle: { color: '#3b82f6' } },
    ],
  }
}

export const XmrChart = createEChartsBridge('xmr', buildXmrFallback, toMvizProps)
