import type { CalendarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function inferCalendarRange(values: string[]): string | string[] {
  const dates = values
    .map(v => new Date(v))
    .filter(d => !Number.isNaN(d.getTime()))
  if (dates.length === 0) return new Date().getFullYear().toString()
  const min = dates.reduce((a, b) => (a.getTime() < b.getTime() ? a : b))
  const max = dates.reduce((a, b) => (a.getTime() > b.getTime() ? a : b))
  const minYear = min.getFullYear()
  const maxYear = max.getFullYear()
  return minYear === maxYear ? String(minYear) : [String(minYear), String(maxYear)]
}

export function buildCalendarFallback(props: CalendarChartProps): Record<string, unknown> {
  const dateField = props.dateField ?? props.date ?? 'date'
  const valueField = props.valueField ?? props.value ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  const calData = data.map((d: Record<string, unknown>) => [
    String(d[dateField] ?? ''),
    Number(d[valueField]) || 0,
  ])
  const values = calData.map(d => Number(d[1]) || 0)
  const maxVal = Math.max(...values, 1)
  return {
    title: props.title ? { text: props.title, left: 'center' } : undefined,
    tooltip: {},
    visualMap: { min: 0, max: maxVal, type: 'piecewise', orient: 'horizontal', left: 'center', top: props.title ? 36 : 8 },
    calendar: {
      range: props.range ?? inferCalendarRange(calData.map(d => String(d[0]))),
      top: props.title ? 80 : 46,
      left: 64,
      right: 16,
      cellSize: ['auto', 16],
    },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: calData }],
  }
}

export const CalendarChart = createEChartsBridge('calendar', buildCalendarFallback)
