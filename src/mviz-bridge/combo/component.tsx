import type { ComboChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz reads spec.bar and spec.line for the bar/line field names.
 * Our schema uses y (array of field names). Default: first field = bar, rest = line.
 */
function toMvizProps(props: ComboChartProps): Record<string, unknown> {
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
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
  const categoryData = data.map(d => String((d as Record<string, unknown>)[x] ?? ''))

  const hasTitle = !!props.title

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: { top: hasTitle ? 30 : 0, left: 'center' },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? 70 : 40,
      containLabel: true,
    },
    xAxis: { type: 'category', data: categoryData },
    yAxis: { type: 'value' },
    series: yFields.map((f, i) => ({
      type: i === 0 ? 'bar' : 'line',
      name: f,
      data: data.map(d => Number((d as Record<string, unknown>)[f]) || 0),
      smooth: i > 0,
    })),
  }
}

export const ComboChart = createEChartsBridge('combo', buildComboFallback, toMvizProps)
