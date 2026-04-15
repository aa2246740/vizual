import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

export interface EChartsWrapperProps {
  option: Record<string, unknown>
  height?: number
  theme?: string | object
}

/**
 * ECharts React wrapper: useRef + useEffect init/dispose + ResizeObserver
 */
export function EChartsWrapper({ option, height = 300, theme }: EChartsWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = echarts.init(containerRef.current, theme)
    chartRef.current = chart
    chart.setOption(option)

    const observer = new ResizeObserver(() => {
      chart.resize()
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [option, theme])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
    />
  )
}
