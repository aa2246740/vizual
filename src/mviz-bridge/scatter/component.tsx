import type { ScatterChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildScatterFallback(props: ScatterChartProps): Record<string, unknown> {
  const x = props.x ?? 'name'
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  const xValues = props.data.map(d => d[x])
  const numericX = xValues.every(v => Number.isFinite(Number(v)))
  const sizeValues = props.size
    ? props.data.map(d => Number(d[props.size!])).filter(Number.isFinite)
    : []
  const maxSize = Math.max(...sizeValues, 1)
  const minSize = Math.min(...sizeValues, maxSize)

  const symbolSize = props.size
    ? (value: unknown) => {
        const raw = Array.isArray(value) ? Number(value[2]) : 0
        if (!Number.isFinite(raw)) return 9
        if (maxSize === minSize) return 12
        return 8 + ((raw - minSize) / (maxSize - minSize)) * 18
      }
    : undefined

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    legend: yFields.length > 1 ? { top: 28 } : undefined,
    grid: { left: 50, right: 24, top: props.title ? 72 : 32, bottom: 40 },
    xAxis: numericX
      ? { type: 'value', name: x }
      : { type: 'category', name: x, data: props.data.map(d => String(d[x] ?? '')) },
    yAxis: { type: 'value' },
    series: yFields.map((f, index) => ({
      type: index === 0 ? 'scatter' : 'line',
      name: f,
      data: props.data.map(d => ({
        name: String((props.groupField ? d[props.groupField] : undefined) ?? d[x] ?? ''),
        value: [
          numericX ? Number(d[x]) || 0 : String(d[x] ?? ''),
          Number(d[f]) || 0,
          props.size ? Number(d[props.size]) || 0 : undefined,
        ],
      })),
      symbolSize: index === 0 ? symbolSize : undefined,
      showSymbol: index === 0,
      smooth: index > 0,
    })),
  }
}

export const ScatterChart = createEChartsBridge('scatter', buildScatterFallback)
