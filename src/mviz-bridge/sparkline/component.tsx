import type { SparklineChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'

function buildSparklineFallback(props: SparklineChartProps): Record<string, unknown> {
  const valueField = props.value ?? (typeof props.y === 'string' ? props.y : 'value')
  const sparkType = props.sparkType ?? 'line'
  const values = props.data.map(d => Number(d[valueField]) || 0)

  const seriesType = sparkType === 'pct_bar' ? 'bar' : sparkType

  return {
    title: undefined, // sparklines should never show a title
    grid: { top: 2, bottom: 2, left: 2, right: 2, containLabel: false },
    xAxis: { show: false, type: 'category', data: values.map((_, i) => i) },
    yAxis: { show: false, type: 'value' },
    tooltip: { show: false },
    series: [{
      type: seriesType,
      data: values,
      ...(seriesType === 'line' ? {
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#6366f1' },
        areaStyle: { opacity: 0.2 },
      } : {
        barWidth: '60%',
        itemStyle: { color: '#6366f1' },
      }),
    }],
  }
}

export const SparklineChart = createEChartsBridge('sparkline', buildSparklineFallback)
