import type { FunnelChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Build ECharts funnel option from schema props.
 *
 * ECharts funnel chart does NOT use xAxis/yAxis.
 * Data format: [{ name: string, value: number }]
 */
/**
 * Resolve name/value field names from props.
 * Supports: x, label, category, name for name field; y, value for value field.
 * Auto-detects from data when no field specified.
 */
function resolveFunnelFields(props: FunnelChartProps) {
  const rawProps = props as Record<string, unknown>
  const data = Array.isArray(props.data) ? props.data : []
  const first = (data[0] as Record<string, unknown>) ?? {}

  // Name field: check x, label, category props; then auto-detect
  let nameField = (props.x ?? rawProps.label ?? rawProps.category ?? rawProps.name) as string | undefined
  if (!nameField) {
    // Auto-detect: first string-valued key in data
    for (const k of Object.keys(first)) {
      if (typeof first[k] === 'string') { nameField = k; break }
    }
    nameField ??= 'name'
  }
  // Value field: check y, value props; then auto-detect
  const yRaw = props.y ?? rawProps.value
  let valueField: string
  if (Array.isArray(yRaw)) {
    valueField = yRaw[0]
  } else if (typeof yRaw === 'string') {
    valueField = yRaw
  } else {
    // Auto-detect: first numeric key
    for (const k of Object.keys(first)) {
      if (typeof first[k] === 'number') { valueField = k; break }
    }
    valueField ??= 'value'
  }
  return { data, nameField, valueField }
}

function buildFunnelFallback(props: FunnelChartProps): Record<string, unknown> {
  const { data, nameField, valueField } = resolveFunnelFields(props)

  const funnelData = data.map(d => ({
    name: String(d[nameField] ?? ''),
    value: Number(d[valueField]) || 0,
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
        fontSize:parseInt(tc('--rk-text-base')),
      },
      emphasis: {
        label: {
          fontSize:parseInt(tc('--rk-text-md')),
          fontWeight: 'bold',
        },
      },
      itemStyle: {
        borderColor: tc('--rk-bg-primary'),
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
  const { nameField, valueField } = resolveFunnelFields(props)
  return { ...props, name: nameField, value: valueField }
}

export const FunnelChart = createEChartsBridge('funnel', buildFunnelFallback, toMvizProps)
