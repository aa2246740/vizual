import type { ComboChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function toFieldList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
  return typeof value === 'string' && value.length > 0 ? [value] : []
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function buildComboOption(props: ComboChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const yFields = toFieldList(props.y)
  if (yFields.length === 0) yFields.push('value')
  const barFields = toFieldList(props.bar)
  const lineFields = toFieldList(props.line)
  const explicitSeries = Array.isArray(props.series)
    ? props.series.filter(series => series && (series.type === 'bar' || series.type === 'line') && typeof series.y === 'string' && series.y.length > 0)
    : []
  const resolvedBarFields = explicitSeries.length > 0
    ? explicitSeries.filter(series => series.type === 'bar').map(series => series.y)
    : barFields.length > 0 ? barFields : [yFields[0]]
  const resolvedLineFields = explicitSeries.length > 0
    ? explicitSeries.filter(series => series.type === 'line').map(series => series.y)
    : lineFields.length > 0 ? lineFields : yFields.slice(1)
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
        data: data.map(d => toNumber((d as Record<string, unknown>)[f])),
        yAxisIndex: 0,
      })),
      ...resolvedLineFields.map(f => ({
        type: 'line',
        name: f,
        data: data.map(d => toNumber((d as Record<string, unknown>)[f])),
        smooth: true,
        yAxisIndex: useDualAxis ? 1 : 0,
      })),
    ],
  }
}

export const ComboChart = createEChartsBridge('combo', buildComboOption)
