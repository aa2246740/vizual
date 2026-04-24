import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { chartColors, tc } from './theme-colors'
import { useAnnotationContext } from '../docview/annotation-context'
import type { AnnotationTarget, ChartDataPoint } from '../docview/types'

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
  // waterfall: use custom fallback — mviz builder doesn't produce proper floating bars
  // waterfall: buildWaterfallOptions,
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
    const dataPointClickedRef = useRef(false)

    // 批注上下文 — 在 DocView 内时有值，独立渲染时为 null
    const annotationCtx = useAnnotationContext()

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

    // 主题切换时用最新 tc() 色值重建 option 并刷新图表
    useEffect(() => {
      const handler = () => {
        if (!chartRef.current) return
        const newOption = buildOption(chartType, props, buildFallbackOption, mapToMviz)
        chartRef.current.setOption(newOption, true)
      }
      document.addEventListener('vizual-theme-change', handler)
      return () => document.removeEventListener('vizual-theme-change', handler)
    }, [props])

    // 注册 ECharts 点击事件 — 数据点钻取批注
    useEffect(() => {
      const chart = chartRef.current
      if (!chart || !annotationCtx?.onTargetClick) return

      const handler = (params: any) => {
        if (params.componentType === 'series' && params.seriesIndex !== undefined && params.dataIndex !== undefined) {
          dataPointClickedRef.current = true
          const dp: ChartDataPoint = {
            seriesIndex: params.seriesIndex,
            dataIndex: params.dataIndex,
            name: params.name || '',
            value: params.value ?? '',
          }
          const si = annotationCtx.sectionIndex
          const targetId = `chart-${si}-${params.seriesIndex}-${params.dataIndex}`
          const label = `${annotationCtx.title || annotationCtx.componentType} › ${dp.name}: ${dp.value}`
          const target: AnnotationTarget = {
            sectionIndex: si,
            targetType: 'chart',
            label,
            targetId,
            chartDataPoint: dp,
          }
          annotationCtx.onTargetClick(target, containerRef.current!)
        }
      }
      chart.on('click', handler)
      return () => { chart.off('click', handler) }
    }, [annotationCtx])

    // 高亮已批注的数据点
    useEffect(() => {
      const chart = chartRef.current
      if (!chart || !annotationCtx?.annotations) return

      chart.dispatchAction({ type: 'downplay' })
      const chartAnns = annotationCtx.annotations.filter(a =>
        a.target?.targetType === 'chart' &&
        a.target?.sectionIndex === annotationCtx.sectionIndex &&
        a.target?.chartDataPoint &&
        a.status !== 'orphaned'
      )
      for (const ann of chartAnns) {
        const dp = ann.target!.chartDataPoint!
        chart.dispatchAction({
          type: 'highlight',
          seriesIndex: dp.seriesIndex,
          dataIndex: dp.dataIndex,
        })
      }
    }, [annotationCtx?.annotations, annotationCtx?.sectionIndex])

    // 整体图表点击 fallback（点击空白区域）
    const handleContainerClick = (e: React.MouseEvent) => {
      if (dataPointClickedRef.current) {
        dataPointClickedRef.current = false
        return
      }
      if (annotationCtx?.onTargetClick) {
        const si = annotationCtx.sectionIndex
        annotationCtx.onTargetClick({
          sectionIndex: si,
          targetType: 'chart',
          label: (annotationCtx.title || annotationCtx.componentType || chartType) as string,
          targetId: `chart-${si}`,
        }, e.currentTarget as HTMLElement)
      }
    }

    const height = typeof props.height === 'number' ? props.height : (props.title ? 320 : 300)
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height,
          ...(annotationCtx ? { cursor: 'pointer' } : {}),
        }}
        {...(annotationCtx ? {
          'data-docview-target': `chart-${annotationCtx.sectionIndex}`,
          'data-section-index': annotationCtx.sectionIndex,
          'data-target-type': 'chart',
          onClick: handleContainerClick,
        } : {})}
      />
    )
  }
  BridgeComponent.displayName = chartType
  return BridgeComponent
}

/**
 * Identifiers that must never appear in a hydrated mviz formatter.
 *
 * mviz builds `_js_` strings by concatenating caller-supplied values
 * (e.g. `spec.currency.symbol`, `spec.locale`) into plain JS source. When
 * a schema prop reaches mviz unsanitized, an attacker-controlled string
 * can break out of the surrounding single-quoted literal and inject
 * arbitrary code, which then executes via `new Function(...)`.
 *
 * mviz's legitimate formatter output only references a tiny identifier
 * set (Math, Array.isArray, toFixed, toLocaleString,
 * minimumFractionDigits, maximumFractionDigits, etc.), so a conservative
 * denylist covers all realistic exploitation vectors without breaking
 * existing charts.
 */
const FORBIDDEN_JS_IDENTIFIERS = [
  'eval', 'Function', 'constructor', 'prototype', '__proto__',
  'import', 'require', 'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker', 'SharedWorker',
  'globalThis', 'window', 'document', 'self', 'top', 'parent', 'frames',
  'location', 'history', 'navigator',
  'setTimeout', 'setInterval', 'setImmediate', 'queueMicrotask', 'postMessage',
  'alert', 'prompt', 'confirm', 'open', 'close',
  'localStorage', 'sessionStorage', 'indexedDB', 'cookie',
  'WebAssembly', 'atob', 'btoa', 'crypto',
]
const FORBIDDEN_JS_PATTERN = new RegExp(
  '\\b(?:' + FORBIDDEN_JS_IDENTIFIERS.join('|') + ')\\b',
)
const MAX_JS_LENGTH = 4096
const FUNCTION_PREFIX = /^\s*function\s*\(/

/**
 * Validate that a `_js_` payload looks like a trusted mviz formatter
 * before compiling it. Returns false for any string that could plausibly
 * be an injection rather than mviz's own output.
 */
export function isSafeMvizJs(src: string): boolean {
  if (src.length > MAX_JS_LENGTH) return false
  if (!FUNCTION_PREFIX.test(src)) return false
  // mviz never emits template literals or comments; reject them as
  // obfuscation channels for the denylist below.
  if (src.indexOf('`') !== -1) return false
  if (src.indexOf('//') !== -1) return false
  if (src.indexOf('/*') !== -1) return false
  if (FORBIDDEN_JS_PATTERN.test(src)) return false
  return true
}

/**
 * Recursively convert mviz's `_js_` pseudo-functions to real JS functions.
 *
 * mviz serializes functions as `{ "_js_": "function(x){...}" }` objects.
 * ECharts needs actual callable functions for formatters, renderItems, etc.
 * This walks the option tree and compiles every `_js_` value into a Function,
 * gated by `isSafeMvizJs` to prevent RCE when attacker-controlled props
 * (e.g. `currency.symbol`) get interpolated into mviz's string-built code.
 * Rejected payloads resolve to `undefined`, which lets ECharts fall back to
 * its default formatter/renderItem rather than rendering broken output.
 */
export function hydrateJsFunctions(obj: unknown): unknown {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const rec = obj as Record<string, unknown>
    if (typeof rec._js_ === 'string') {
      const src = rec._js_
      if (!isSafeMvizJs(src)) {
        console.warn('[vizual] rejected unsafe _js_ payload from mviz; using default formatter')
        return undefined
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        return new Function('return (' + src + ')')()
      } catch {
        return undefined
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
          // Skip override when series data has per-item itemStyle (e.g. waterfall)
          const data = s.data as Record<string, unknown>[] | undefined
          const hasPerItemStyle = Array.isArray(data) && data.some(d => d && typeof d === 'object' && d.itemStyle && typeof d.itemStyle === 'object')
          if (!hasPerItemStyle) {
            is.color = palette[i % palette.length]
          }
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
