import type { DumbbellChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Resolve low/high fields from props.
 * Supports: explicit low/high, or y as [low, high] array field names.
 */
function resolveFields(props: DumbbellChartProps) {
  const data = Array.isArray(props.data) ? props.data : []
  const categoryField = props.x ?? 'name'
  let lowField = props.low
  let highField = props.high
  // When y is an array like ["s2023","s2024"], use first as low, second as high
  if (!lowField && !highField && Array.isArray(props.y)) {
    lowField = props.y[0]
    highField = props.y[1]
  }
  const first = (data[0] as Record<string, unknown>) ?? {}
  // Auto-detect from data if still not set
  if (!lowField || !highField) {
    const numericKeys = Object.keys(first).filter(k => typeof first[k] === 'number' && k !== categoryField)
    lowField ??= numericKeys[0] ?? 'low'
    highField ??= numericKeys[1] ?? numericKeys[0] ?? 'high'
  }
  return { data, categoryField, lowField, highField }
}

function toMvizProps(props: DumbbellChartProps): Record<string, unknown> {
  const { categoryField, lowField, highField } = resolveFields(props)
  return {
    ...props,
    category: categoryField,
    start: lowField,
    end: highField,
  }
}

function buildDumbbellFallback(props: DumbbellChartProps): Record<string, unknown> {
  const { data, categoryField, lowField, highField } = resolveFields(props)
  const categories = data.map((d: Record<string, unknown>) => String(d[categoryField] ?? ''))
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [{
      type: 'custom',
      renderItem: (_params: unknown, api: any) => {
        const idx = api.value(0)
        const low = api.coord([idx, api.value(1)])
        const high = api.coord([idx, api.value(2)])
        if (!low || !high) return {}
        const height = 6
        return {
          type: 'group',
          children: [
            { type: 'rect', shape: { x: low[0], y: low[1] - height / 2, width: high[0] - low[0], height }, style: { fill: api.visual('color'), opacity: 0.3 } },
            { type: 'circle', shape: { cx: low[0], cy: low[1], r: 5 }, style: { fill: api.visual('color') } },
            { type: 'circle', shape: { cx: high[0], cy: high[1], r: 5 }, style: { fill: api.visual('color') } },
          ],
        }
      },
      data: data.map((d: Record<string, unknown>, i: number) => [
        i, Number(d[lowField]) || 0, Number(d[highField]) || 0,
      ]),
      encode: { x: 0, y: [1, 2] },
    }],
  }
}

export const DumbbellChart = createEChartsBridge('dumbbell', buildDumbbellFallback, toMvizProps)
