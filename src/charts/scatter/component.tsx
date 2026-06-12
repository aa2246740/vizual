import type { ScatterChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function finiteNumber(value: unknown, fallback = 0): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function groupRows(data: Array<Record<string, unknown>>, groupField: string | undefined) {
  if (!groupField) return null
  const groups = new Map<string, Array<Record<string, unknown>>>()
  for (const row of data) {
    const key = String(row[groupField] ?? 'series')
    const rows = groups.get(key) ?? []
    rows.push(row)
    groups.set(key, rows)
  }
  return Array.from(groups.entries()).map(([name, rows]) => ({ name, rows }))
}

function seriesColor(rows: Array<Record<string, unknown>>): string | undefined {
  const color = rows.find(row => typeof row.color === 'string' && row.color.length > 0)?.color
  return typeof color === 'string' ? color : undefined
}

export function buildScatterFallback(props: ScatterChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  const labelField = props.label ?? props.groupField
  const data = Array.isArray(props.data) ? props.data : []
  const xValues = data.map(d => d[x])
  const numericX = xValues.every(v => Number.isFinite(Number(v)))
  const sizeValues = props.size
    ? data.map(d => Number(d[props.size!])).filter(Number.isFinite)
    : []
  const maxSize = Math.max(...sizeValues, 1)
  const minSize = Math.min(...sizeValues, maxSize)

  const symbolSize = props.size
    ? (value: unknown) => {
        const raw = Array.isArray(value) ? Number(value[2]) : 0
        if (!Number.isFinite(raw)) return 9
        if (maxSize === minSize) return 12
        return 8 + ((raw - minSize) / (maxSize - minSize)) * 18
      }
    : undefined
  const groupedRows = groupRows(data, props.groupField)

  const pointFor = (row: Record<string, unknown>, field: string) => {
    const y = finiteNumber(row[field], Number.NaN)
    if (!Number.isFinite(y)) return null
    const point: unknown[] = [
      numericX ? finiteNumber(row[x]) : String(row[x] ?? ''),
      y,
    ]
    if (props.size) point.push(finiteNumber(row[props.size]))
    if (!labelField) return point
    return {
      name: String(row[labelField] ?? ''),
      value: point,
      data: row,
    }
  }

  const groupedSeries = groupedRows
    ? groupedRows.flatMap(group => yFields.map(field => {
      const points = group.rows
        .map(row => pointFor(row, field))
        .filter((point): point is unknown[] | { name: string; value: unknown[]; data: Record<string, unknown> } => point !== null)
      return {
        type: 'scatter',
        name: yFields.length > 1 ? `${group.name} ${field}` : group.name,
        data: points,
        symbolSize: symbolSize ?? 10,
        showSymbol: true,
        ...(seriesColor(group.rows) ? { itemStyle: { color: seriesColor(group.rows) } } : {}),
      }
    }))
    : null

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    legend: groupedSeries || yFields.length > 1 ? { top: 28 } : undefined,
    grid: { left: 50, right: 24, top: props.title ? 72 : 32, bottom: 40 },
    xAxis: numericX
      ? { type: 'value', name: x }
      : { type: 'category', name: x, data: data.map(d => String(d[x] ?? '')) },
    yAxis: { type: 'value' },
    series: groupedSeries ?? yFields.map((f, index) => ({
      type: index === 0 ? 'scatter' : 'line',
      name: f,
      data: data.map(d => {
        const point: unknown[] = [
          numericX ? finiteNumber(d[x]) : String(d[x] ?? ''),
          finiteNumber(d[f]),
        ]
        if (props.size) point.push(finiteNumber(d[props.size]))
        if (!labelField) return point
        return {
          name: String(d[labelField] ?? ''),
          value: point,
          data: d,
        }
      }),
      symbolSize: index === 0 ? (symbolSize ?? 10) : undefined,
      showSymbol: index === 0,
      smooth: index > 0,
    })),
  }
}

export const ScatterChart = createEChartsBridge('scatter', buildScatterFallback)
