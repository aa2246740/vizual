import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { BarChartProps } from './schema'

/**
 * Build a minimal bar chart option from props directly.
 * Used when mviz buildBarOptions is unavailable (test env, browser without mviz).
 */
function buildFallbackOption(props: BarChartProps): Record<string, unknown> {
  const { x, y, data, title, stacked, horizontal } = props
  const yFields = Array.isArray(y) ? y : [y]
  const categoryData = data.map(d => String(d[x]))

  return {
    title: title ? { text: title } : undefined,
    tooltip: { trigger: 'axis' },
    xAxis: horizontal
      ? { type: 'value' }
      : { type: 'category', data: categoryData },
    yAxis: horizontal
      ? { type: 'category', data: categoryData }
      : { type: 'value' },
    series: yFields.map(field => ({
      type: 'bar',
      name: field,
      stack: stacked ? 'total' : undefined,
      data: data.map(d => Number(d[field]) || 0),
    })),
  }
}

/**
 * Build ECharts option using mviz if available, otherwise fallback
 */
async function buildOption(props: BarChartProps): Promise<Record<string, unknown>> {
  try {
    const { pathToFileURL } = await import('url')
    const { resolve } = await import('path')
    const barPath = resolve('node_modules/mviz/dist/charts/bar.js')
    const mod = await import(pathToFileURL(barPath).href)
    return mod.buildBarOptions(props)
  } catch {
    return buildFallbackOption(props)
  }
}

/**
 * BarChart bridge component — uses mviz buildBarOptions to generate ECharts option,
 * with a self-contained fallback if mviz is unavailable.
 */
export function BarChart({ props }: { props: BarChartProps }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [option, setOption] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    buildOption(props).then(setOption)
  }, [JSON.stringify(props)])

  useEffect(() => {
    if (!containerRef.current || !option) return

    let chart = chartRef.current
    if (!chart) {
      chart = echarts.init(containerRef.current)
      chartRef.current = chart
    }
    chart.setOption(option, true)

    const observer = new ResizeObserver(() => chart!.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [option])

  useEffect(() => {
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: props.title ? 320 : 300 }}
    />
  )
}
