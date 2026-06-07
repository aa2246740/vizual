import type { LineChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Build ECharts line option from schema props.
 */
export function buildLineFallback(props: LineChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const y = props.y ?? 'value'
  const yFields = Array.isArray(y) ? y : [y]
  const data = Array.isArray(props.data) ? props.data : []
  const categoryData = data.map(d => String(d[x] ?? ''))
  const axisByField = inferAxisByField(data, yFields)
  const useDualAxis = Array.from(axisByField.values()).some(axis => axis === 1)

  const hasTitle = !!props.title
  const hasLegend = yFields.length > 1

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: hasLegend ? { top: hasTitle ? 30 : 0, left: 'center' } : undefined,
    grid: {
      left: '4%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? (hasLegend ? 70 : 40) : (hasLegend ? 30 : 30),
      containLabel: true,
    },
    xAxis: { type: 'category', data: categoryData, boundaryGap: false },
    yAxis: useDualAxis
      ? [
          { type: 'value' },
          { type: 'value', splitLine: { show: false } },
        ]
      : { type: 'value' },
    series: yFields.map(f => ({
      type: 'line',
      name: f,
      data: data.map(d => toNumber(d[f])),
      smooth: true,
      yAxisIndex: axisByField.get(f) ?? 0,
    })),
  }
}

function inferAxisByField(data: Array<Record<string, unknown>>, fields: string[]) {
  const axisByField = new Map<string, number>()
  for (const field of fields) axisByField.set(field, 0)
  if (fields.length < 2 || data.length === 0) return axisByField

  const maxima = fields
    .map(field => ({
      field,
      max: Math.max(...data.map(row => Math.abs(toNumber(row[field]))), 0),
    }))
    .filter(item => item.max > 0)
    .sort((a, b) => a.max - b.max)

  if (maxima.length < 2) return axisByField
  const min = maxima[0].max
  const max = maxima[maxima.length - 1].max
  if (max / min < 20) return axisByField

  const split = Math.sqrt(min * max)
  for (const item of maxima) {
    if (item.max >= split) axisByField.set(item.field, 1)
  }
  return axisByField
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export const LineChart = createEChartsBridge('line', buildLineFallback)
