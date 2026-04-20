import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { chartColors, tc } from './theme-colors'

// Static imports from mviz — bundled by esbuild, works in browser
import {
  buildBarOptions,
  buildLineOptions,
  buildPieOptions,
  buildScatterOptions,
  buildAreaOptions,
  buildSparklineOptions,
  buildHistogramOptions,
  buildHeatmapOptions,
  buildBubbleOptions,
  buildCalendarOptions,
  buildFunnelOptions,
  buildSankeyOptions,
  buildComboOptions,
  buildWaterfallOptions,
  buildXmrOptions,
  buildDumbbellOptions,
} from 'mviz/charts/index'

// NOTE: buildBoxplotOptions excluded — mviz's boxplot builder has a bug where
// series[0].data is always empty. BoxplotChart uses its fallback builder instead.

type ChartProps = Record<string, unknown>

/**
 * Map chartType to mviz build function.
 * Key = the chartType string used in createEChartsBridge('bar', ...)
 * Value = the statically imported mviz function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mvizBuilders: Record<string, (props: any) => any> = {
  bar: buildBarOptions,
  line: buildLineOptions,
  pie: buildPieOptions,
  scatter: buildScatterOptions,
  area: buildAreaOptions,
  sparkline: buildSparklineOptions,
  histogram: buildHistogramOptions,
  heatmap: buildHeatmapOptions,
  bubble: buildBubbleOptions,
  // boxplot: skipped — mviz builder produces empty series data
  calendar: buildCalendarOptions,
  funnel: buildFunnelOptions,
  sankey: buildSankeyOptions,
  combo: buildComboOptions,
  waterfall: buildWaterfallOptions,
  xmr: buildXmrOptions,
  dumbbell: buildDumbbellOptions,
}

/**
 * Generic ECharts bridge factory.
 *
 * Uses mviz's build*Options function (statically imported) to generate
 * ECharts options from chart props. Falls back to the provided fallback
 * builder if mviz doesn't support the chart type or throws.
 *
 * Chart lifecycle:
 * - Effect 1 (mount): init ECharts + ResizeObserver
 * - Effect 2 (option): build options from props and setOption
 * - Cleanup: dispose chart + observer
 */
export function createEChartsBridge(
  chartType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildFallbackOption: (props: any) => Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapToMviz?: (props: any) => any,
) {
  function BridgeComponent({ props }: { props: ChartProps }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<echarts.ECharts | null>(null)
    const observerRef = useRef<ResizeObserver | null>(null)

    // Build option synchronously from props (mviz is statically bundled)
    const option = buildOption(chartType, props, buildFallbackOption, mapToMviz)

    // Init chart on mount, dispose on unmount
    useEffect(() => {
      if (!containerRef.current) return
      const chart = echarts.init(containerRef.current)
      chartRef.current = chart

      const observer = new ResizeObserver(() => chart.resize())
      observer.observe(containerRef.current)
      observerRef.current = observer

      return () => {
        observer.disconnect()
        observerRef.current = null
        chart.dispose()
        chartRef.current = null
      }
    }, [])

    // Update chart option when props change
    useEffect(() => {
      if (chartRef.current && option) {
        chartRef.current.setOption(option, true)
      }
    }, [option])

    const height = typeof props.height === 'number' ? props.height : (props.title ? 320 : 300)
    return <div ref={containerRef} style={{ width: '100%', height }} />
  }
  BridgeComponent.displayName = chartType
  return BridgeComponent
}

/**
 * Recursively convert mviz's `_js_` pseudo-functions to real JS functions.
 *
 * mviz serializes functions as `{ "_js_": "function(x){...}" }` objects.
 * ECharts needs actual callable functions for formatters, renderItems, etc.
 * This walks the option tree and evaluates every `_js_` value into a Function.
 */
function hydrateJsFunctions(obj: unknown): unknown {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const rec = obj as Record<string, unknown>
    if (typeof rec._js_ === 'string') {
      try {
        return new Function('return (' + rec._js_ + ')')()
      } catch {
        return rec._js_
      }
    }
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(rec)) {
      result[key] = hydrateJsFunctions(rec[key])
    }
    return result
  }
  if (Array.isArray(obj)) {
    return obj.map(hydrateJsFunctions)
  }
  return obj
}

/**
 * Build ECharts option using mviz (primary) or fallback (safety net).
 * Returns a valid option object synchronously.
 */
function buildOption(
  chartType: string,
  props: ChartProps,
  fallback: (props: ChartProps) => Record<string, unknown>,
  mapToMviz?: (props: ChartProps) => ChartProps,
): Record<string, unknown> {
  let option: Record<string, unknown>

  const builder = mvizBuilders[chartType]
  if (builder) {
    try {
      const mvizProps = mapToMviz ? mapToMviz(props) : props
      const rawOption = builder(mvizProps)
      option = hydrateJsFunctions(rawOption) as Record<string, unknown>
    } catch (e) {
      console.warn(`[vizual] mviz builder for "${chartType}" failed, using fallback:`, e)
      option = fallback(props)
    }
  } else {
    try {
      option = fallback(props)
    } catch (e) {
      console.error(`[vizual] Fallback builder for "${chartType}" also failed:`, e)
      return { title: { text: `Error: ${(e as Error).message}` } }
    }
  }

  // Inject theme chart palette — all charts follow DESIGN.md / theme colors
  const palette = chartColors(6)
  if (palette.length > 0) {
    option.color = palette
    // Override series-level hardcoded colors with palette colors
    // Only override when mviz builder set an explicit color, or for types where
    // ECharts defaults to white (#fff) which would be invisible on light themes.
    // Don't add itemStyle.color to pie/funnel etc. — they need per-data-point color cycling.
    const whiteDefaultTypes = new Set(['boxplot', 'candlestick'])
    const series = option.series as Record<string, unknown>[] | undefined
    if (series && Array.isArray(series)) {
      for (let i = 0; i < series.length; i++) {
        const s = series[i] as Record<string, unknown>
        if (!s || typeof s !== 'object') continue
        if ('color' in s) s.color = undefined
        const is = s.itemStyle as Record<string, unknown> | undefined
        const sType = s.type as string | undefined
        if (is && typeof is === 'object' && 'color' in is) {
          is.color = palette[i % palette.length]
        } else if (sType && whiteDefaultTypes.has(sType)) {
          if (!s.itemStyle || typeof s.itemStyle !== 'object') s.itemStyle = {}
          ;(s.itemStyle as Record<string, unknown>).color = palette[i % palette.length]
        }
      }
    }
  }

  // Override mviz hardcoded text/axis/tooltip/splitLine colors with theme colors
  const textColor = tc('--rk-text-secondary')
  const bgColor = tc('--rk-bg-secondary')
  const borderColor = tc('--rk-border-subtle')

  // Axis labels
  // Axis labels, splitLines, axisLines
  for (const key of ['xAxis', 'yAxis']) {
    const raw = option[key]
    const axes = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[]
    for (const axis of axes) {
      if (!axis || typeof axis !== 'object') continue
      const label = axis.axisLabel as Record<string, unknown> | undefined
      if (label && textColor) label.color = textColor
      const splitLine = axis.splitLine as Record<string, unknown> | undefined
      if (splitLine && borderColor) {
        const lineStyle = splitLine.lineStyle as Record<string, unknown> | undefined
        if (lineStyle) lineStyle.color = borderColor
      }
      const axisLine = axis.axisLine as Record<string, unknown> | undefined
      if (axisLine && borderColor) {
        const lineStyle = axisLine.lineStyle as Record<string, unknown> | undefined
        if (lineStyle) lineStyle.color = borderColor
      }
    }
  }

  // Tooltip
  if (textColor && bgColor) {
    const tooltip = option.tooltip as Record<string, unknown> | undefined
    if (tooltip) {
      tooltip.backgroundColor = bgColor
      tooltip.borderColor = borderColor || bgColor
      const ts = tooltip.textStyle as Record<string, unknown> | undefined
      if (ts) ts.color = textColor
    }
  }

  // Legend text
  const legends = option.legend as Record<string, unknown>[] | undefined
  if (legends && Array.isArray(legends) && textColor) {
    for (const leg of legends) {
      const ts = leg.textStyle as Record<string, unknown> | undefined
      if (ts) ts.color = textColor
    }
  }

  return option
}
