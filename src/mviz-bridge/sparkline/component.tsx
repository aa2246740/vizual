import type { SparklineChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz reads spec.value (default 'value') for the numeric field.
 * Our schema uses y (or value) to specify the value field name.
 */
function toMvizProps(props: SparklineChartProps): Record<string, unknown> {
  const valueField = props.value ?? props.y ?? 'value'
  return {
    ...props,
    value: valueField,
  }
}

function buildSparklineFallback(props: SparklineChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const y = props.y ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: 0, right: 0, top: 5, bottom: 5 },
    xAxis: { type: 'category', show: false, data: data.map(d => String(d[x] ?? '')) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data: data.map(d => Number(d[y]) || 0),
      symbol: 'none',
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.15 },
    }],
  }
}

export const SparklineChart = createEChartsBridge('sparkline', buildSparklineFallback, toMvizProps)
