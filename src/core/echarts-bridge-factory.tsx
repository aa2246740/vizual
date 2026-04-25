import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import { chartColors, tc } from './theme-colors'
import { useAnnotationContext } from '../docview/annotation-context'
import type { AnnotationTarget, ChartDataPoint } from '../docview/types'

type ChartProps = Record<string, unknown>

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(value, (_key, val) => {
    if (!val || typeof val !== 'object') return val
    if (seen.has(val)) return '[Circular]'
    seen.add(val)
    if (Array.isArray(val)) return val
    return Object.keys(val as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = (val as Record<string, unknown>)[key]
        return acc
      }, {})
  }) ?? ''
}

/**
 * Generic ECharts bridge factory.
 *
 * Uses Vizual-owned option builders from each chart component. Keeping the
 * option construction in this package gives us predictable AI-facing
 * contracts, no external chart-builder runtime dependency, and no generated
 * JavaScript formatter hydration surface.
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
) {
  function BridgeComponent({ props }: { props: ChartProps }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<echarts.ECharts | null>(null)
    const observerRef = useRef<ResizeObserver | null>(null)
    const dataPointClickedRef = useRef(false)

    // 批注上下文 — 在 DocView 内时有值，独立渲染时为 null
    const annotationCtx = useAnnotationContext()

    // Keep the expensive ECharts option stable across annotation popup state
    // changes. Parent DocView renders can recreate props objects even when the
    // chart data has not changed; rebuilding then calling setOption replays
    // ECharts animations.
    const propsKey = stableStringify(props)
    const option = useMemo(
      () => buildOption(chartType, props, buildFallbackOption),
      [propsKey],
    )

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
        const newOption = buildOption(chartType, props, buildFallbackOption)
        chartRef.current.setOption(newOption, true)
      }
      document.addEventListener('vizual-theme-change', handler)
      return () => document.removeEventListener('vizual-theme-change', handler)
    }, [propsKey])

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
          annotationCtx.onTargetClick?.(target, containerRef.current!)
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
        a.status !== 'orphaned' &&
        a.status !== 'resolved'
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
          maxWidth: '100%',
          minWidth: 0,
          margin: '0 auto',
          display: 'block',
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
 * Build ECharts option using the chart component's local option builder.
 * Returns a valid option object synchronously.
 */
function buildOption(
  chartType: string,
  props: ChartProps,
  fallback: (props: ChartProps) => Record<string, unknown>,
): Record<string, unknown> {
  let option: Record<string, unknown>

  try {
    option = fallback(props)
  } catch (e) {
    console.error(`[vizual] option builder for "${chartType}" failed:`, e)
    return { title: { text: `Error: ${(e as Error).message}` } }
  }

  // Inject theme chart palette — all charts follow DESIGN.md / theme colors
  const palette = chartColors(6)
  if (palette.length > 0) {
    option.color = palette
    // Override series-level hardcoded colors with palette colors
    // Only override when a builder set an explicit color, or for types where
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

  // Normalize text/axis/tooltip/splitLine colors with theme colors
  const textColor = tc('--rk-text-secondary')
  const primaryTextColor = tc('--rk-text-primary') || textColor
  const bgColor = tc('--rk-bg-secondary')
  const cellBgColor = tc('--rk-bg-tertiary') || bgColor
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

  if ((chartType === 'heatmap' || chartType === 'calendar') && cellBgColor) {
    const visualMaps = (Array.isArray(option.visualMap)
      ? option.visualMap
      : option.visualMap ? [option.visualMap] : []) as Record<string, unknown>[]
    const firstChartColor = palette[0] || tc('--rk-accent') || primaryTextColor
    const secondChartColor = palette[1] || firstChartColor
    for (const visualMap of visualMaps) {
      if (!visualMap || typeof visualMap !== 'object') continue
      visualMap.inRange = {
        ...((visualMap.inRange as Record<string, unknown> | undefined) ?? {}),
        color: chartType === 'calendar'
          ? [cellBgColor, firstChartColor, secondChartColor]
          : [cellBgColor, firstChartColor],
      }
    }
  }

  if (chartType === 'calendar') {
    const calendars = (Array.isArray(option.calendar)
      ? option.calendar
      : option.calendar ? [option.calendar] : []) as Record<string, unknown>[]
    for (const calendar of calendars) {
      if (!calendar || typeof calendar !== 'object') continue
      const itemStyle = (calendar.itemStyle && typeof calendar.itemStyle === 'object')
        ? calendar.itemStyle as Record<string, unknown>
        : {}
      itemStyle.color = cellBgColor
      if (borderColor) itemStyle.borderColor = borderColor
      calendar.itemStyle = itemStyle

      const splitLine = (calendar.splitLine && typeof calendar.splitLine === 'object')
        ? calendar.splitLine as Record<string, unknown>
        : {}
      const lineStyle = (splitLine.lineStyle && typeof splitLine.lineStyle === 'object')
        ? splitLine.lineStyle as Record<string, unknown>
        : {}
      if (borderColor) lineStyle.color = borderColor
      splitLine.lineStyle = lineStyle
      calendar.splitLine = splitLine

      for (const labelKey of ['dayLabel', 'monthLabel', 'yearLabel']) {
        const label = (calendar[labelKey] && typeof calendar[labelKey] === 'object')
          ? calendar[labelKey] as Record<string, unknown>
          : {}
        if (textColor) label.color = textColor
        calendar[labelKey] = label
      }
    }
  }

  if (chartType === 'heatmap') {
    const series = option.series as Record<string, unknown>[] | undefined
    if (Array.isArray(series)) {
      for (const s of series) {
        if (!s || typeof s !== 'object' || s.type !== 'heatmap') continue
        const label = (s.label && typeof s.label === 'object') ? s.label as Record<string, unknown> : {}
        if (primaryTextColor) label.color = primaryTextColor
        s.label = label
        const itemStyle = (s.itemStyle && typeof s.itemStyle === 'object') ? s.itemStyle as Record<string, unknown> : {}
        if (borderColor) itemStyle.borderColor = borderColor
        s.itemStyle = itemStyle
      }
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
