import type { SparklineChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function resolveFields(props: SparklineChartProps) {
  const data = Array.isArray(props.data) ? props.data : []
  const first = (data[0] as Record<string, unknown>) ?? {}
  const keys = Object.keys(first)
  // Value field: y, value, or first numeric key
  let yField = (props.y as string | undefined) ?? props.value
  if (!yField) {
    for (const k of keys) { if (typeof first[k] === 'number') { yField = k; break } }
    yField ??= 'value'
  }
  // X field: x or first non-numeric key
  let xField = props.x
  if (!xField) {
    for (const k of keys) { if (k !== yField) { xField = k; break } }
    xField ??= keys[0] ?? 'name'
  }
  return { data, xField, yField }
}

function buildSparklineFallback(props: SparklineChartProps): Record<string, unknown> {
  const { data, xField, yField } = resolveFields(props)
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: 0, right: 0, top: 5, bottom: 5 },
    xAxis: { type: 'category', show: false, data: data.map(d => String((d as Record<string, unknown>)[xField] ?? '')) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data: data.map(d => Number((d as Record<string, unknown>)[yField]) || 0),
      symbol: 'none',
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.15 },
    }],
  }
}

export const SparklineChart = createEChartsBridge('sparkline', buildSparklineFallback)
