import type { HistogramChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function finiteNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function clampBinCount(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 10
  return Math.max(1, Math.min(100, Math.round(num)))
}

function inferLabelField(data: Record<string, unknown>[], props: HistogramChartProps): string | undefined {
  const firstRow = data[0] ?? {}
  const candidates = [
    props.x,
    'range',
    'bin',
    'bucket',
    'interval',
    'label',
    'name',
    'category',
  ].filter(Boolean) as string[]
  return candidates.find(key => key in firstRow)
}

function inferCountField(data: Record<string, unknown>[], props: HistogramChartProps): string | undefined {
  const firstRow = data[0] ?? {}
  const y = Array.isArray(props.y) ? props.y[0] : props.y
  const candidates = [
    y,
    'count',
    'frequency',
    'freq',
    'n',
    'value',
  ].filter(Boolean) as string[]
  return candidates.find(key => key in firstRow && finiteNumber(firstRow[key]) !== null)
}

function inferRawValueField(data: Record<string, unknown>[], props: HistogramChartProps): string {
  const firstRow = data[0] ?? {}
  const explicit = props.value ?? props.x ?? (Array.isArray(props.y) ? props.y[0] : props.y)
  if (explicit) return explicit
  return Object.keys(firstRow).find(key => finiteNumber(firstRow[key]) !== null) ?? 'value'
}

function formatBinLabel(start: number, end: number, isLast: boolean): string {
  const left = Number.isInteger(start) ? String(start) : start.toFixed(1)
  const right = Number.isInteger(end) ? String(end) : end.toFixed(1)
  return isLast ? `${left}-${right}` : `${left}-${right}`
}

export function buildHistogramFallback(props: HistogramChartProps): Record<string, unknown> {
  const data = Array.isArray(props.data) ? props.data : []

  const explicitRawField = props.value !== undefined
  const labelField = inferLabelField(data, props)
  const countField = inferCountField(data, props)
  if (!explicitRawField && labelField && countField) {
    const labels = data.map((row, index) => String(row[labelField] ?? `Bin ${index + 1}`))
    const counts = data.map(row => finiteNumber(row[countField]) ?? 0)
    return {
      title: props.title ? { text: props.title } : undefined,
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 24, top: props.title ? 72 : 32, bottom: 44 },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: counts, barGap: '8%' }],
    }
  }

  const valueField = inferRawValueField(data, props)
  const values = data
    .map(d => finiteNumber(d[valueField]))
    .filter((value): value is number => value !== null)
  // Manual binning
  if (values.length === 0) return { series: [] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = clampBinCount(props.bins)
  const binWidth = (max - min) / binCount || 1
  const bins = Array(binCount).fill(0)
  const labels: string[] = []
  for (let i = 0; i < binCount; i++) {
    labels.push(formatBinLabel(min + i * binWidth, min + (i + 1) * binWidth, i === binCount - 1))
  }
  values.forEach(v => {
    let idx = Math.floor((v - min) / binWidth)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx]++
  })
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 24, top: props.title ? 72 : 32, bottom: 44 },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: bins }],
  }
}

export const HistogramChart = createEChartsBridge('histogram', buildHistogramFallback)
