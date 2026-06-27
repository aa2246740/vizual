import type { BarChartProps } from './schema'
import { chartCategoryLabels, chartNumberOrZero, hasCategoricalChartValue, hasNumericChartValue } from '../../core/chart-data'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Build ECharts bar option from schema props.
 */
export function buildBarFallback(props: BarChartProps): Record<string, unknown> {
  const { x = 'name', y = 'value', data, title, stacked, horizontal } = props
  const rows = Array.isArray(data) ? data : []
  const rawYFields = Array.isArray(y) ? y : [y]
  const xLooksNumeric = rows.length > 0 && hasNumericChartValue(rows, x)
  const singleYLooksCategorical = rawYFields.length === 1 && hasCategoricalChartValue(rows, rawYFields[0])
  const inferredHorizontal = xLooksNumeric && singleYLooksCategorical
  const isHorizontal = Boolean(horizontal || inferredHorizontal)
  const categoryField = inferredHorizontal ? rawYFields[0] : x
  const yFields = inferredHorizontal ? [x] : rawYFields
  const categoryData = chartCategoryLabels(rows, categoryField)

  const hasTitle = !!title
  const hasLegend = yFields.length > 1

  return {
    title: hasTitle ? { text: title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: hasLegend ? { top: hasTitle ? 30 : 0, left: 'center' } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? (hasLegend ? 70 : 40) : (hasLegend ? 30 : 30),
      containLabel: true,
    },
    xAxis: isHorizontal
      ? { type: 'value' }
      : { type: 'category', data: categoryData },
    yAxis: isHorizontal
      ? { type: 'category', data: categoryData }
      : { type: 'value' },
    series: yFields.map((field: string) => ({
      type: 'bar',
      name: field,
      stack: stacked ? 'total' : undefined,
      data: rows.map((d: Record<string, unknown>) => chartNumberOrZero(d[field])),
    })),
  }
}

export const BarChart = createEChartsBridge('bar', buildBarFallback)
