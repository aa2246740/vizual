import type { HeatmapChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Resolve x/y/value field names from props or auto-detect from data.
 * When props.x / props.y are not specified, pick the first non-numeric
 * string key for each axis from the data items.
 */
function resolveFields(props: HeatmapChartProps) {
  const data = Array.isArray(props.data) ? props.data : []
  const first = (data[0] as Record<string, unknown>) ?? {}
  const keys = Object.keys(first)

  // Auto-detect: first string key = x (categories), second string key = y, first numeric key = value
  let xField = (props.xField as string | undefined) ?? (props.x as string | undefined)
  let yField = (props.yField as string | undefined) ?? (props.y as string | undefined) ?? (Array.isArray(props.y) ? props.y[0] : undefined)
  let valueField = (props.valueField as string | undefined) ?? (props.value as string | undefined)

  if (!xField && keys.length > 0) {
    // Prefer first key that has non-numeric values in the data
    for (const k of keys) {
      if (typeof first[k] === 'string' || typeof first[k] === 'number' && k !== 'value') {
        xField = k; break
      }
    }
    xField ??= keys[0]
  }
  if (!yField && keys.length > 1) {
    // Second string key that isn't x
    for (const k of keys) {
      if (k !== xField && (typeof first[k] === 'string' || (typeof first[k] === 'number' && k !== 'value'))) {
        yField = k; break
      }
    }
    yField ??= keys.find(k => k !== xField) ?? 'y'
  }
  if (!valueField) {
    valueField = keys.find(k => k === 'value')
  }
  if (!valueField) {
    // First numeric key that is not already used as an axis
    for (const k of keys) {
      if (k !== xField && k !== yField && typeof first[k] === 'number') { valueField = k; break }
    }
    valueField ??= 'value'
  }

  return {
    xField: xField ?? 'x',
    yField: yField ?? 'y',
    valueField: valueField ?? 'value',
    data,
  }
}

function toMvizProps(props: HeatmapChartProps): Record<string, unknown> {
  const { xField, yField, valueField, data } = resolveFields(props)
  const mappedData = data.map((d: Record<string, unknown>) => ({
    x: String(d[xField] ?? ''), y: String(d[yField] ?? ''), value: d[valueField],
  }))
  const xCategories = [...new Set(mappedData.map(d => String(d.x ?? '')))]
  const yCategories = [...new Set(mappedData.map(d => String(d.y ?? '')))]
  return { ...props, theme: props.theme ?? 'dark', data: mappedData, xCategories, yCategories }
}

function buildHeatmapFallback(props: HeatmapChartProps): Record<string, unknown> {
  const { xField, yField, valueField, data } = resolveFields(props)
  const xCats = [...new Set(data.map(d => String((d as Record<string, unknown>)[xField] ?? '')))]
  const yCats = [...new Set(data.map(d => String((d as Record<string, unknown>)[yField] ?? '')))]
  const seriesData = data.map((d: Record<string, unknown>) => [
    xCats.indexOf(String(d[xField] ?? '')),
    yCats.indexOf(String(d[yField] ?? '')),
    Number(d[valueField]) || 0,
  ])
  const maxVal = Math.max(...seriesData.map(d => d[2] as number), 1)
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { position: 'top' },
    grid: { top: 30, right: 10, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: xCats, splitArea: { show: true } },
    yAxis: { type: 'category', data: yCats, splitArea: { show: true } },
    visualMap: { min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
    series: [{ type: 'heatmap', data: seriesData, label: { show: true } }],
  }
}

export const HeatmapChart = createEChartsBridge('heatmap', buildHeatmapFallback, toMvizProps)
