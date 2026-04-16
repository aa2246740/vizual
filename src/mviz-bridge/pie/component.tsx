import type { PieChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildPieFallback(props: PieChartProps): Record<string, unknown> {
  const labelField = props.label ?? props.x ?? 'name'
  const valueField = props.value ?? (typeof props.y === 'string' ? props.y : 'value')

  const pieData = props.data.map(d => ({
    name: String(d[labelField] ?? ''),
    value: Number(d[valueField]) || 0,
  }))

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: props.donut ? ['40%', '70%'] : '70%',
      center: ['60%', '50%'],
      data: pieData,
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
      },
      label: { show: true, formatter: '{b}: {d}%' },
    }],
  }
}

export const PieChart = createEChartsBridge('pie', buildPieFallback)
