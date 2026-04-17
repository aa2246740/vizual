import type { HeatmapChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Map schema props to mviz format.
 * mviz expects data objects with {x, y, value} fields (hardcoded).
 * Our schema uses configurable x/y/value field names.
 * mviz also needs xCategories and yCategories arrays.
 */
function toMvizProps(props: HeatmapChartProps): Record<string, unknown> {
  const xField = props.x ?? 'x'
  const yField = props.y ?? 'y'
  const valueField = props.value ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  // Rename fields in data objects to match mviz's hardcoded {x, y, value}
  const mappedData = data.map((d: Record<string, unknown>) => ({
    x: d[xField],
    y: d[yField],
    value: d[valueField],
  }))
  // Extract unique categories for axes
  const xCategories = [...new Set(mappedData.map(d => String(d.x ?? '')))]
  const yCategories = [...new Set(mappedData.map(d => String(d.y ?? '')))]
  return {
    ...props,
    data: mappedData,
    xCategories,
    yCategories,
  }
}

function buildHeatmapFallback(props: HeatmapChartProps): Record<string, unknown> {
  const xField = props.x ?? 'x'
  const yField = props.y ?? 'y'
  const valueField = props.value ?? 'value'
  const data = Array.isArray(props.data) ? props.data : []
  const xCats = [...new Set(data.map(d => String((d as Record<string, unknown>)[xField] ?? '')))]
  const yCats = [...new Set(data.map(d => String((d as Record<string, unknown>)[yField] ?? '')))]
  const seriesData = data.map((d: Record<string, unknown>) => [
    xCats.indexOf(String(d[xField] ?? '')),
    yCats.indexOf(String(d[yField] ?? '')),
    Number(d[valueField]) || 0,
  ])
  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { position: 'top' },
    grid: { top: 30, right: 10, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: xCats, splitArea: { show: true } },
    yAxis: { type: 'category', data: yCats, splitArea: { show: true } },
    visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
    series: [{ type: 'heatmap', data: seriesData, label: { show: true } }],
  }
}

export const HeatmapChart = createEChartsBridge('heatmap', buildHeatmapFallback, toMvizProps)
