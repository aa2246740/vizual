import type { ComboChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildComboFallback(props: ComboChartProps): Record<string, unknown> {
  const xField = props.x ?? 'name'
  const categoryData = props.data.map(d => String(d[xField] ?? ''))

  // Use props.series if available, otherwise fall back to simple y fields
  let series: unknown[]
  if (props.series && props.series.length > 0) {
    series = props.series.map(s => ({
      type: s.type,
      name: s.y,
      data: props.data.map(d => Number(d[s.y]) || 0),
      ...(s.type === 'line' ? { smooth: true } : {}),
    }))
  } else {
    const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
    series = yFields.map((field, i) => ({
      type: i === 0 ? 'bar' : 'line',
      name: field,
      data: props.data.map(d => Number(d[field]) || 0),
    }))
  }

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categoryData },
    yAxis: { type: 'value' },
    series,
  }
}

export const ComboChart = createEChartsBridge('combo', buildComboFallback)
