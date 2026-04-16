import type { FunnelChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildFunnelFallback(props: FunnelChartProps): Record<string, unknown> {
  const labelField = props.label ?? props.x ?? 'name'
  const valueField = props.value ?? (typeof props.y === 'string' ? props.y : 'value')

  const funnelData = props.data.map(d => ({
    name: String(d[labelField] ?? ''),
    value: Number(d[valueField]) || 0,
  }))

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'funnel',
      data: funnelData,
      top: '10%',
      bottom: '10%',
      width: '80%',
      min: 0,
      max: Math.max(...funnelData.map(d => d.value), 1),
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: { show: true, position: 'inside' },
      emphasis: { label: { fontSize: 16 } },
    }],
  }
}

export const FunnelChart = createEChartsBridge('funnel', buildFunnelFallback)
