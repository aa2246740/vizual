import type { PieChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Build ECharts pie option from schema props.
 *
 * Pie charts do NOT use xAxis/yAxis.
 * Data format: [{ name: string, value: number }]
 */
function firstExistingField(data: Record<string, unknown>[], candidates: string[], fallback: string): string {
  const first = data.find(row => row && typeof row === 'object')
  if (!first) return fallback
  return candidates.find(candidate => Object.prototype.hasOwnProperty.call(first, candidate)) ?? fallback
}

function stringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function buildPieFallback(props: PieChartProps): Record<string, unknown> {
  // Support both x/y and category/value field naming conventions
  const rawProps = props as Record<string, unknown>
  const data = Array.isArray(props.data) ? props.data : []
  const x = stringProp(props.x)
    ?? stringProp(props.label)
    ?? stringProp(rawProps.nameField)
    ?? stringProp(rawProps.categoryField)
    ?? stringProp(rawProps.category)
    ?? firstExistingField(data, ['label', 'name', 'category', 'factor'], 'name')
  const y = (props.y
    ?? stringProp(props.value)
    ?? stringProp(rawProps.valueField)
    ?? firstExistingField(data, ['value', 'amount', 'count'], 'value')) as string | string[]
  const yField = Array.isArray(y) ? y[0] : y

  const pieData = data.map(d => ({
    name: String(d[x] ?? ''),
    value: Number(d[yField]) || 0,
  }))
  const total = pieData.reduce((sum, item) => sum + item.value, 0)

  const hasTitle = !!props.title
  const innerRadius = typeof rawProps.innerRadius === 'number'
    ? rawProps.innerRadius
    : props.donut ? 0.42 : 0
  const innerRadiusValue = innerRadius > 0 && innerRadius <= 1
    ? `${Math.round(innerRadius * 100)}%`
    : `${Math.max(0, innerRadius)}%`
  const outerRadiusValue = innerRadius > 0 ? '72%' : '62%'

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      top: 'middle',
      right: 0,
      type: 'scroll',
      formatter: (name: string) => {
        const item = pieData.find(entry => entry.name === name)
        const percent = item && total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : ''
        return percent ? `${name} ${percent}` : name
      },
    },
    series: [{
      type: 'pie',
      radius: [innerRadiusValue, outerRadiusValue],
      center: ['36%', hasTitle ? '52%' : '48%'],
      top: hasTitle ? 40 : 10,
      bottom: 16,
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'inside',
        formatter: (params: { name?: string; percent?: number }) => {
          void params.name
          return `${Number(params.percent ?? 0).toFixed(1)}%`
        },
        fontSize:parseInt(tc('--rk-text-sm')),
        color: '#fff',
        lineHeight: 16,
      },
      labelLine: {
        show: false,
      },
      labelLayout: { hideOverlap: true },
      data: pieData,
    }],
  }
}

export const PieChart = createEChartsBridge('pie', buildPieFallback)
