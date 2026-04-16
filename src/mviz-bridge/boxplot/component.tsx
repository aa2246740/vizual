import type { BoxplotChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildBoxplotFallback(props: BoxplotChartProps): Record<string, unknown> {
  const groupField = props.groupField ?? props.x ?? 'group'
  const valueField = props.valueField ?? (typeof props.y === 'string' ? props.y : 'value')

  // Group data and compute boxplot stats per group
  const groups = new Map<string, number[]>()
  props.data.forEach(d => {
    const g = String(d[groupField] ?? '')
    const v = Number(d[valueField]) || 0
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(v)
  })

  const categoryData = [...groups.keys()]
  // ECharts boxplot data: [min, Q1, median, Q3, max]
  const boxplotData = categoryData.map(g => {
    const vals = groups.get(g)!.sort((a, b) => a - b)
    const n = vals.length
    const min = vals[0]
    const max = vals[n - 1]
    const q1 = vals[Math.floor(n * 0.25)]
    const median = vals[Math.floor(n * 0.5)]
    const q3 = vals[Math.floor(n * 0.75)]
    return [min, q1, median, q3, max]
  })

  // Outlier points
  const outlierData: number[][] = []
  categoryData.forEach((g, gi) => {
    const [min, , , , max] = boxplotData[gi]
    const iqr = boxplotData[gi][3] - boxplotData[gi][1]
    const lower = boxplotData[gi][1] - 1.5 * iqr
    const upper = boxplotData[gi][3] + 1.5 * iqr
    groups.get(g)!.forEach(v => {
      if (v < lower || v > upper) outlierData.push([gi, v])
    })
  })

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: categoryData },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'boxplot',
        data: boxplotData,
      },
      {
        type: 'scatter',
        data: outlierData,
        symbolSize: 6,
      },
    ],
  }
}

export const BoxplotChart = createEChartsBridge('boxplot', buildBoxplotFallback)
