import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'

type ChartProps = Record<string, unknown> & { type: string }

/**
 * Generic ECharts bridge factory.
 * Tries to load mviz build function dynamically; falls back to a minimal manual option builder.
 */
export function createEChartsBridge(
  chartType: string,
  buildFallbackOption: (props: ChartProps) => Record<string, unknown>,
) {
  function BridgeComponent(props: ChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<echarts.ECharts | null>(null)
    const [option, setOption] = useState<Record<string, unknown> | null>(null)

    useEffect(() => {
      buildOption(props, chartType, buildFallbackOption).then(setOption)
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
      return () => { observer.disconnect() }
    }, [option])

    useEffect(() => {
      return () => { chartRef.current?.dispose(); chartRef.current = null }
    }, [])

    const height = typeof props.height === 'number' ? props.height : (props.title ? 320 : 300)
    return <div ref={containerRef} style={{ width: '100%', height }} />
  }
  BridgeComponent.displayName = chartType
  return BridgeComponent
}

async function buildOption(
  props: ChartProps,
  chartType: string,
  fallback: (props: ChartProps) => Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    const { pathToFileURL } = await import('url')
    const { resolve } = await import('path')
    const filePath = resolve(`node_modules/mviz/dist/charts/${chartType}.js`)
    const mod = await import(pathToFileURL(filePath).href)
    const fn = mod[`build${capitalize(chartType)}Options`]
    if (fn) return fn(props)
  } catch { /* mviz unavailable, use fallback */ }
  return fallback(props)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
