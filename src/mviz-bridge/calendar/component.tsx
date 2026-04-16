import type { CalendarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildCalendarFallback(props: CalendarChartProps): Record<string, unknown> {
  const dateField = props.dateField ?? props.x ?? 'date'
  const valueField = props.valueField ?? (typeof props.y === 'string' ? props.y : 'value')

  // Determine calendar range from data or prop
  const dates = props.data.map(d => String(d[dateField] ?? '')).filter(Boolean).sort()
  const range = props.range ?? (dates.length > 0 ? dates[0].substring(0, 4) : String(new Date().getFullYear()))

  const seriesData = props.data.map(d => [
    String(d[dateField] ?? ''),
    Number(d[valueField]) || 0,
  ])

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { position: 'top' },
    visualMap: {
      min: 0,
      max: seriesData.length ? Math.max(...seriesData.map(d => d[1] as number)) : 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
    },
    calendar: {
      range: range,
      cellSize: ['auto', 20],
      left: 50,
      right: 30,
      top: 50,
      bottom: 50,
      dayLabel: { nameMap: 'en' },
      monthLabel: { nameMap: 'en' },
      yearLabel: { show: true },
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: seriesData,
    }],
  }
}

export const CalendarChart = createEChartsBridge('calendar', buildCalendarFallback)
