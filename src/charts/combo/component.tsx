import type { ComboChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function toFieldList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
  return typeof value === 'string' && value.length > 0 ? [value] : []
}

export function buildComboOption(props: ComboChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const yFields = toFieldList(props.y)
  if (yFields.length === 0) yFields.push('value')
  const barFields = toFieldList(props.bar)
  const lineFields = toFieldList(props.line)
  const resolvedBarFields = barFields.length > 0 ? barFields : [yFields[0]]
  const resolvedLineFields = lineFields.length > 0 ? lineFields : yFields.slice(1)
  const data = Array.isArray(props.data) ? props.data : []
  const categoryData = data.map(d => String((d as Record<string, unknown>)[x] ?? ''))

  const hasTitle = !!props.title
  const useDualAxis = resolvedLineFields.length > 0

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: { top: hasTitle ? 30 : 0, left: 'center' },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? 70 : 40,
      containLabel: true,
    },
    xAxis: { type: 'category', data: categoryData },
    yAxis: useDualAxis
      ? [
          { type: 'value' },
          { type: 'value', splitLine: { show: false } },
        ]
      : { type: 'value' },
    series: [
      ...resolvedBarFields.map(f => ({
        type: 'bar',
        name: f,
        data: data.map(d => Number((d as Record<string, unknown>)[f]) || 0),
        yAxisIndex: 0,
      })),
      ...resolvedLineFields.map(f => ({
        type: 'line',
        name: f,
        data: data.map(d => Number((d as Record<string, unknown>)[f]) || 0),
        smooth: true,
        yAxisIndex: useDualAxis ? 1 : 0,
      })),
    ],
  }
}

export const ComboChart = createEChartsBridge('combo', buildComboOption)
