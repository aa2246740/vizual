import type { CalendarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz reads d.date and d.value from data objects (hardcoded).
 * Our schema uses configurable date/value field names.
 */
function toMvizProps(props: CalendarChartProps): Record<string, unknown> {
  const dateField = props.date ?? 'date'
  const valueField = props.value ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  // Rename fields to match mviz's hardcoded {date, value}
  const mappedData = data.map((d: Record<string, unknown>) => ({
    date: d[dateField],
    value: d[valueField],
  }))
  return {
    ...props,
    data: mappedData,
  }
}

function buildCalendarFallback(props: CalendarChartProps): Record<string, unknown> {
  const dateField = props.date ?? 'date'
  const valueField = props.value ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  const calData = data.map((d: Record<string, unknown>) => [
    String(d[dateField] ?? ''),
    Number(d[valueField]) || 0,
  ])
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: {},
    visualMap: { min: 0, max: 100, type: 'piecewise', orient: 'horizontal', left: 'center', top: 30 },
    calendar: { range: '2024', cellSize: ['auto', 13] },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: calData }],
  }
}

export const CalendarChart = createEChartsBridge('calendar', buildCalendarFallback, toMvizProps)
