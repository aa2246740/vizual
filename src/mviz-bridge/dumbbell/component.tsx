import type { DumbbellChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map our Schema props to mviz's expected format.
 * mviz uses: category, start, end, startLabel, endLabel
 * Our schema uses: x (category field), data with low/high fields
 */
function toMvizProps(props: DumbbellChartProps): Record<string, unknown> {
  const categoryField = props.x ?? 'name'
  const startField = props.low ?? 'low'
  const endField = props.high ?? 'high'
  return {
    ...props,
    category: categoryField,
    start: startField,
    end: endField,
  }
}

function buildDumbbellFallback(props: DumbbellChartProps): Record<string, unknown> {
  const data = Array.isArray(props.data) ? props.data : []
  const categoryField = props.x ?? 'name'
  const lowField = props.low ?? 'low'
  const highField = props.high ?? 'high'
  const categories = data.map((d: Record<string, unknown>) => String(d[categoryField] ?? ''))
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [{
      type: 'custom',
      renderItem: () => ({}),
      data: data.map((d: Record<string, unknown>) => [Number(d[lowField]) || 0, Number(d[highField]) || 0]),
    }],
  }
}

export const DumbbellChart = createEChartsBridge('dumbbell', buildDumbbellFallback, toMvizProps)
