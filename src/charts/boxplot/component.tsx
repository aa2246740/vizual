import type { BoxplotChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

const PRECOMPUTED_FIELDS = ['min', 'q1', 'median', 'q3', 'max'] as const

function finiteNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function inferGroupField(data: Record<string, unknown>[], props: BoxplotChartProps): string {
  const candidates = [
    props.groupField,
    props.x,
    'name',
    'class',
    'group',
    'category',
    'label',
  ].filter(Boolean) as string[]
  const firstRow = data[0] ?? {}
  return candidates.find(key => key in firstRow) ?? 'name'
}

function inferValueField(data: Record<string, unknown>[], props: BoxplotChartProps): string {
  const explicit = props.valueField ?? (Array.isArray(props.y) ? props.y[0] : props.y)
  if (explicit) return explicit

  const groupField = inferGroupField(data, props)
  const firstRow = data[0] ?? {}
  const numericKey = Object.keys(firstRow).find(key =>
    key !== groupField &&
    !PRECOMPUTED_FIELDS.includes(key as typeof PRECOMPUTED_FIELDS[number]) &&
    finiteNumber(firstRow[key]) !== null
  )
  return numericKey ?? 'value'
}

function hasPrecomputedQuartiles(row: Record<string, unknown>): boolean {
  return PRECOMPUTED_FIELDS.every(key => finiteNumber(row[key]) !== null)
}

function getPrecomputedValues(row: Record<string, unknown>): number[] | null {
  if (hasPrecomputedQuartiles(row)) {
    return PRECOMPUTED_FIELDS.map(key => finiteNumber(row[key])!)
  }
  const value = row.value
  if (Array.isArray(value) && value.length >= 5) {
    const values = value.slice(0, 5).map(finiteNumber)
    if (values.every(v => v !== null)) return values as number[]
  }
  return null
}

function quartiles(values: number[]): number[] {
  const vals = values.filter(Number.isFinite).sort((a, b) => a - b)
  const len = vals.length
  if (len === 0) return [0, 0, 0, 0, 0]
  const min = vals[0]
  const max = vals[len - 1]
  const q1 = vals[Math.floor((len - 1) * 0.25)]
  const median = vals[Math.floor((len - 1) * 0.5)]
  const q3 = vals[Math.floor((len - 1) * 0.75)]
  return [min, q1, median, q3, max]
}

export function buildBoxplotFallback(props: BoxplotChartProps): Record<string, unknown> {
  const data = Array.isArray(props.data) ? props.data : []
  const groupField = inferGroupField(data, props)

  const precomputed = data
    .map((row, index) => {
      const values = getPrecomputedValues(row)
      if (!values) return null
      return {
        category: String(row[groupField] ?? row.name ?? row.class ?? row.group ?? row.category ?? `Group ${index + 1}`),
        values,
      }
    })
    .filter((row): row is { category: string; values: number[] } => Boolean(row))

  if (precomputed.length > 0 && precomputed.length === data.length) {
    return {
      title: props.title ? { text: props.title } : undefined,
      tooltip: { trigger: 'axis' },
      grid: { left: 54, right: 24, top: props.title ? 72 : 32, bottom: 44 },
      xAxis: { type: 'category', data: precomputed.map(row => row.category) },
      yAxis: { type: 'value', scale: true },
      series: [{
        type: 'boxplot',
        data: precomputed.map(row => row.values),
      }],
    }
  }

  const valueField = inferValueField(data, props)

  // Group data by category
  const groups: Record<string, number[]> = {}
  for (const d of data) {
    const cat = String(d[groupField] ?? 'unknown')
    const val = finiteNumber(d[valueField])
    if (val === null) continue
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(val)
  }
  const categories = Object.keys(groups).filter(cat => groups[cat].length > 0)
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: 54, right: 24, top: props.title ? 72 : 32, bottom: 44 },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value', scale: true },
    series: [{
      type: 'boxplot',
      data: categories.map(cat => quartiles(groups[cat])),
    }],
  }
}

export const BoxplotChart = createEChartsBridge('boxplot', buildBoxplotFallback)
