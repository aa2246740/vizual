import type { BubbleChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function groupRows(data: Array<Record<string, unknown>>, groupField: string | undefined) {
  if (!groupField) return [{ name: undefined as string | undefined, rows: data }]
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

function buildBubbleFallback(props: BubbleChartProps): Record<string, unknown> {
  const data = Array.isArray(props.data) ? props.data : []
  const x = props.x ?? 'x'
  const y = (Array.isArray(props.y) ? props.y[0] : props.y) ?? 'y'
  const sizeField = (props as Record<string, unknown>).size ?? (props as Record<string, unknown>).r ?? 'size'
  const labelField = props.label ?? props.groupField
  const maxSize = Math.max(...data.map(d => Number((d as Record<string, unknown>)[sizeField as string]) || 0), 1)
  const groupedRows = groupRows(data, props.groupField)
  return {
    title: props.title ? { text: props.title, left: 'center' } : undefined,
    tooltip: { trigger: 'item' },
    legend: props.groupField ? { top: props.title ? 28 : 0 } : undefined,
    grid: { left: '4%', right: '4%', bottom: '6%', top: props.title ? 50 : 20, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: groupedRows.map(group => ({
      type: 'scatter',
      name: group.name ?? props.title ?? 'bubble',
      data: group.rows.map((d: Record<string, unknown>) => [
        Number(d[x]) || 0,
        Number(d[y]) || 0,
        Number(d[sizeField as string]) || 0,
        labelField ? d[labelField] ?? '' : d.name ?? d.label ?? '',
      ]),
      symbolSize: (value: unknown) => {
        const row = Array.isArray(value) ? value : []
        const raw = Number(row[2]) || 0
        return 8 + (raw / maxSize) * 34
      },
      emphasis: { focus: 'series' },
      ...(seriesColor(group.rows) ? { itemStyle: { color: seriesColor(group.rows) } } : {}),
    })),
  }
}

export const BubbleChart = createEChartsBridge('bubble', buildBubbleFallback)
