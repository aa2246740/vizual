import type { PieChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Build ECharts pie option from schema props.
 *
 * Pie charts do NOT use xAxis/yAxis.
 * Data format: [{ name: string, value: number }]
 */
function buildPieFallback(props: PieChartProps): Record<string, unknown> {
  // Support both x/y and category/value field naming conventions
  const rawProps = props as Record<string, unknown>
  const x = (props.x ?? rawProps.category ?? 'name') as string
  const y = (props.y ?? rawProps.value ?? 'value') as string | string[]
  const yField = Array.isArray(y) ? y[0] : y
  const data = Array.isArray(props.data) ? props.data : []

  const pieData = data.map(d => ({
    name: String(d[x] ?? ''),
    value: Number(d[yField]) || 0,
  }))

  const hasTitle = !!props.title

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      type: 'scroll',
    },
    series: [{
      type: 'pie',
      radius: ['0%', '65%'],
      center: ['50%', hasTitle ? '52%' : '48%'],
      top: hasTitle ? 40 : 10,
      bottom: 40,
      label: {
        show: true,
        formatter: '{b}: {d}%',
        fontSize:parseInt(tc('--rk-text-sm')),
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
      },
      data: pieData,
    }],
  }
}

export const PieChart = createEChartsBridge('pie', buildPieFallback)
