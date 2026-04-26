import type { BubbleChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildBubbleFallback(props: BubbleChartProps): Record<string, unknown> {
  const data = Array.isArray(props.data) ? props.data : []
  const x = props.x ?? 'x'
  const y = (Array.isArray(props.y) ? props.y[0] : props.y) ?? 'y'
  const sizeField = (props as Record<string, unknown>).size ?? (props as Record<string, unknown>).r ?? 'size'
  const maxSize = Math.max(...data.map(d => Number((d as Record<string, unknown>)[sizeField as string]) || 0), 1)
  return {
    title: props.title ? { text: props.title, left: 'center' } : undefined,
    tooltip: { trigger: 'item' },
    grid: { left: '4%', right: '4%', bottom: '6%', top: props.title ? 50 : 20, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [{
      type: 'scatter',
      name: props.title ?? 'bubble',
      data: data.map((d: Record<string, unknown>) => [
        Number(d[x]) || 0,
        Number(d[y]) || 0,
        Number(d[sizeField as string]) || 0,
        d.name ?? d.label ?? '',
      ]),
      symbolSize: (value: unknown) => {
        const row = Array.isArray(value) ? value : []
        const raw = Number(row[2]) || 0
        return 8 + (raw / maxSize) * 34
      },
      emphasis: { focus: 'series' },
    }],
  }
}

export const BubbleChart = createEChartsBridge('bubble', buildBubbleFallback)
