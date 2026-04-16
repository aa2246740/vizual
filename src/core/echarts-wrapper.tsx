import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

export interface EChartsWrapperProps {
  option: Record<string, unknown>
  height?: number
  theme?: string | object
}

/**
 * ECharts React wrapper: useRef + useEffect init/dispose + ResizeObserver
 *
 * Split into two effects to avoid destroying and recreating the chart
 * on every option change. Chart instance is created once and reused.
 */
export function EChartsWrapper({ option, height = 300, theme }: EChartsWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  // Effect 1: init chart on mount, dispose on unmount
  useEffect(() => {
    if (!containerRef.current) return

    const chart = echarts.init(containerRef.current, theme)
    chartRef.current = chart

    const observer = new ResizeObserver(() => {
      chart.resize()
    })
    observer.observe(containerRef.current)
    observerRef.current = observer

    return () => {
      observer.disconnect()
      observerRef.current = null
      chart.dispose()
      chartRef.current = null
    }
  }, [theme])

  // Effect 2: update option when it changes (does NOT recreate chart)
  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true)
    }
  }, [option])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
    />
  )
}
