import type { BubbleChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildBubbleFallback(props: BubbleChartProps): Record<string, unknown> {
  const xField = props.x ?? 'x'
  const yField = typeof props.y === 'string' ? props.y : 'y'
  const sizeField = props.size ?? 'size'

  const bubbleData = props.data.map(d => [
    Number(d[xField]) || 0,
    Number(d[yField]) || 0,
    Number(d[sizeField]) || 10,
  ])

  return {
    title: props.title ? { text: props.title } : undefined,
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: xField },
    yAxis: { type: 'value', name: yField },
    series: [{
      type: 'bubble',
      data: bubbleData,
      symbolSize: (val: number[]) => Math.max(val[2] / 2, 4),
      emphasis: { focus: 'series' },
    }],
  }
}

export const BubbleChart = createEChartsBridge('bubble', buildBubbleFallback)
