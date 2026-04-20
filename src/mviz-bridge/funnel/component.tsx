import type { FunnelChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

/**
 * Build ECharts funnel option from schema props.
 *
 * ECharts funnel chart does NOT use xAxis/yAxis.
 * Data format: [{ name: string, value: number }]
 */
function buildFunnelFallback(props: FunnelChartProps): Record<string, unknown> {
  // Support both x/y and category/value field naming conventions
  const rawProps = props as Record<string, unknown>
  const x = (props.x ?? rawProps.category ?? 'name') as string
  const y = (props.y ?? rawProps.value ?? 'value') as string | string[]
  const yField = Array.isArray(y) ? y[0] : y
  const data = Array.isArray(props.data) ? props.data : []

  const funnelData = data.map(d => ({
    name: String(d[x] ?? ''),
    value: Number(d[yField]) || 0,
  }))

  const hasTitle = !!props.title

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'funnel',
      left: '10%',
      top: hasTitle ? 50 : 20,
      bottom: 20,
      width: '80%',
      min: 0,
      max: Math.max(...funnelData.map(d => d.value), 1),
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}',
        fontSize: 13,
      },
      emphasis: {
        label: {
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1,
      },
      data: funnelData,
    }],
  }
}

/**
 * Map schema props to mviz format.
 * mviz uses spec.name / spec.value for funnel dimension fields.
 * Our schema supports x/y and category/value as aliases.
 */
function toMvizProps(props: FunnelChartProps): Record<string, unknown> {
  const rawProps = props as Record<string, unknown>
  return {
    ...props,
    name: props.x ?? rawProps.category ?? rawProps.name ?? 'name',
    value: Array.isArray(props.y) ? props.y[0] : (props.y ?? rawProps.value ?? 'value'),
  }
}

export const FunnelChart = createEChartsBridge('funnel', buildFunnelFallback, toMvizProps)
