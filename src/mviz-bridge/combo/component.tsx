import type { ComboChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz reads spec.bar and spec.line for the bar/line field names.
 * Our schema uses y (array of field names). Default: first field = bar, rest = line.
 */
function toMvizProps(props: ComboChartProps): Record<string, unknown> {
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  // Default: first field is bar, rest are line
  return {
    ...props,
    bar: props.bar ?? yFields[0],
    line: props.line ?? yFields.slice(1),
  }
}

function buildComboFallback(props: ComboChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  const data = Array.isArray(props.data) ? props.data : []
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    legend: {},
    xAxis: { type: 'category', data: data.map(d => String((d as Record<string, unknown>)[x] ?? '')) },
    yAxis: { type: 'value' },
    series: yFields.map((f, i) => ({
      type: i === 0 ? 'bar' : 'line',
      name: f,
      data: data.map(d => Number((d as Record<string, unknown>)[f]) || 0),
    })),
  }
}

export const ComboChart = createEChartsBridge('combo', buildComboFallback, toMvizProps)
