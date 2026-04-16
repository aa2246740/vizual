import type { HeatmapChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildHeatmapFallback(props: HeatmapChartProps): Record<string, unknown> {
  const xField = props.xField ?? props.x ?? 'x'
  const yField = props.yField ?? 'y'
  const valueField = props.valueField ?? 'value'

  const xCategories = [...new Set(props.data.map(d => String(d[xField] ?? '')))]
  const yCategories = [...new Set(props.data.map(d => String(d[yField] ?? '')))]

  const seriesData = props.data.map(d => {
    const xi = xCategories.indexOf(String(d[xField] ?? ''))
    const yi = yCategories.indexOf(String(d[yField] ?? ''))
    return [xi, yi, Number(d[valueField]) || 0]
  })

  const values = seriesData.map(d => d[2] as number)
  const minVal = values.length ? Math.min(...values) : 0
  const maxVal = values.length ? Math.max(...values) : 1

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { position: 'top' },
    grid: { top: '10%', bottom: '20%', left: '15%', right: '10%' },
    xAxis: { type: 'category', data: xCategories, splitArea: { show: true } },
    yAxis: { type: 'category', data: yCategories, splitArea: { show: true } },
    visualMap: {
      min: minVal, max: maxVal, calculable: true,
      orient: 'horizontal', left: 'center', bottom: '2%',
      inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027'] },
    },
    series: [{
      type: 'heatmap', data: seriesData,
      label: { show: true },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  }
}

export const HeatmapChart = createEChartsBridge('heatmap', buildHeatmapFallback)
