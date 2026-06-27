import type { ComboChartProps } from './schema'
import { chartNumberOrZero } from '../../core/chart-data'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function toFieldList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
  return typeof value === 'string' && value.length > 0 ? [value] : []
}

type ComboSeriesSpec = {
  field: string
  type?: 'bar' | 'line' | 'scatter'
  name?: string
  size?: string
  yAxisIndex?: number
}

function toSeriesSpecList(value: unknown): ComboSeriesSpec[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): ComboSeriesSpec | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const field = [record.field, record.y, record.yField, record.key]
        .find((entry): entry is string => typeof entry === 'string' && entry.length > 0)
      if (!field) return null
      const type = record.type === 'bar' || record.type === 'line' || record.type === 'scatter' ? record.type : undefined
      const name = typeof record.name === 'string' && record.name.length > 0 ? record.name : undefined
      const size = [record.size, record.sizeField, record.r]
        .find((entry): entry is string => typeof entry === 'string' && entry.length > 0)
      const yAxisIndex = typeof record.yAxisIndex === 'number' && Number.isFinite(record.yAxisIndex)
        ? record.yAxisIndex
        : undefined
      return { field, type, name, size, yAxisIndex }
    })
    .filter((item): item is ComboSeriesSpec => Boolean(item))
}

export function buildComboOption(props: ComboChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const yFields = toFieldList(props.y)
  const ySeries = toSeriesSpecList(props.y)
  if (yFields.length === 0) yFields.push('value')
  const barFields = toFieldList(props.bar)
  const lineFields = toFieldList(props.line)
  const explicitSeries = Array.isArray(props.series)
    ? props.series
      .map((series): ComboSeriesSpec | null => {
        if (!series || typeof series !== 'object') return null
        const record = series as Record<string, unknown>
        const field = [record.y, record.field, record.yField, record.key]
          .find((entry): entry is string => typeof entry === 'string' && entry.length > 0)
        if (!field || (record.type !== 'bar' && record.type !== 'line' && record.type !== 'scatter')) return null
        const size = [record.size, record.sizeField, record.r]
          .find((entry): entry is string => typeof entry === 'string' && entry.length > 0)
        return {
          field,
          type: record.type,
          name: typeof record.name === 'string' && record.name.length > 0 ? record.name : undefined,
          size,
          yAxisIndex: typeof record.yAxisIndex === 'number' && Number.isFinite(record.yAxisIndex)
            ? record.yAxisIndex
            : undefined,
        }
      })
      .filter((series): series is ComboSeriesSpec => Boolean(series))
    : []
  const typedYSeries = ySeries.filter(series => series.type === 'bar' || series.type === 'line' || series.type === 'scatter')
  const resolvedSeries = explicitSeries.length > 0 ? explicitSeries : typedYSeries
  const resolvedBarFields = resolvedSeries.length > 0
    ? resolvedSeries.filter(series => series.type === 'bar').map(series => series.field)
    : barFields.length > 0 ? barFields : [yFields[0]]
  const resolvedLineFields = resolvedSeries.length > 0
    ? resolvedSeries.filter(series => series.type === 'line').map(series => series.field)
    : lineFields.length > 0 ? lineFields : yFields.slice(1)
  const scatterFields = [...toFieldList(props.scatter), ...toFieldList((props as Record<string, unknown>).scatterFields)]
  const resolvedScatterSeries: ComboSeriesSpec[] = resolvedSeries.length > 0
    ? resolvedSeries.filter(series => series.type === 'scatter')
    : scatterFields.map(field => ({ field, type: 'scatter' as const }))
  const seriesNameByField = new Map(resolvedSeries.map(series => [series.field, series.name ?? series.field]))
  const data = Array.isArray(props.data) ? props.data : []
  const categoryData = data.map(d => String((d as Record<string, unknown>)[x] ?? ''))

  const hasTitle = !!props.title
  const useDualAxis = resolvedLineFields.length > 0 || resolvedScatterSeries.length > 0
  const leftAxisName = (props as Record<string, unknown>).leftAxisName
  const rightAxisName = (props as Record<string, unknown>).rightAxisName

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
          { type: 'value', name: typeof leftAxisName === 'string' ? leftAxisName : undefined },
          { type: 'value', name: typeof rightAxisName === 'string' ? rightAxisName : undefined, splitLine: { show: false } },
        ]
      : { type: 'value', name: typeof leftAxisName === 'string' ? leftAxisName : undefined },
    series: [
      ...resolvedBarFields.map(f => ({
        type: 'bar',
        name: seriesNameByField.get(f) ?? f,
        data: data.map(d => chartNumberOrZero((d as Record<string, unknown>)[f])),
        yAxisIndex: 0,
      })),
      ...resolvedLineFields.map(f => ({
        type: 'line',
        name: seriesNameByField.get(f) ?? f,
        data: data.map(d => chartNumberOrZero((d as Record<string, unknown>)[f])),
        smooth: true,
        yAxisIndex: useDualAxis ? 1 : 0,
      })),
      ...resolvedScatterSeries.map(series => {
        const sizeField = series.size
        const sizeValues = sizeField
          ? data.map(d => chartNumberOrZero((d as Record<string, unknown>)[sizeField]))
          : []
        const maxSize = Math.max(...sizeValues, 1)
        const minSize = Math.min(...sizeValues, maxSize)
        return {
          type: 'scatter',
          name: series.name ?? sizeField ?? series.field,
          data: data.map(d => [
            String((d as Record<string, unknown>)[x] ?? ''),
            chartNumberOrZero((d as Record<string, unknown>)[series.field]),
            sizeField ? chartNumberOrZero((d as Record<string, unknown>)[sizeField]) : undefined,
          ]),
          symbolSize: sizeField
            ? (value: unknown) => {
                const raw = Array.isArray(value) ? Number(value[2]) : 0
                if (!Number.isFinite(raw)) return 10
                if (maxSize === minSize) return 14
                return 8 + ((raw - minSize) / (maxSize - minSize)) * 24
              }
            : 10,
          yAxisIndex: series.yAxisIndex ?? (useDualAxis ? 1 : 0),
        }
      }),
    ],
  }
}

export const ComboChart = createEChartsBridge('combo', buildComboOption)
