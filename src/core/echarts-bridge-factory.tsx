import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { useBoundProp } from '@json-render/react'
import { tc } from './theme-colors'

type ChartProps = Record<string, unknown>
const normalizedColorCache = new Map<string, string>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

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

function summarizeOption(option: Record<string, unknown>): { seriesCount: number; pointCount: number } {
  const rawSeries = option.series
  const seriesList = Array.isArray(rawSeries)
    ? rawSeries.filter(isRecord)
    : isRecord(rawSeries)
      ? [rawSeries]
      : []
  let pointCount = 0
  for (const series of seriesList) {
    const data = series.data
    if (Array.isArray(data)) pointCount += data.length
  }
  return { seriesCount: seriesList.length, pointCount }
}

function themeValue(varName: string, host?: HTMLElement | null): string {
  if (host && typeof getComputedStyle !== 'undefined') {
    const computed = getComputedStyle(host)
    const scoped = computed.getPropertyValue(varName).trim()
    if (scoped) return normalizeCssColor(scoped)
    if (varName.startsWith('--rk-text-')) {
      const inheritedColor = computed.color.trim()
      if (inheritedColor) return normalizeCssColor(inheritedColor)
    }
    if (varName.startsWith('--rk-bg-')) {
      const inheritedBackground = nearestOpaqueBackground(host)
      if (inheritedBackground) return normalizeCssColor(inheritedBackground)
    }
    if (varName.startsWith('--rk-border')) {
      const borderColor = computed.borderColor.trim()
      if (borderColor) return normalizeCssColor(borderColor)
    }
  }
  return tc(varName)
}

function normalizeCssColor(color: string): string {
  if (!color || typeof document === 'undefined') return color
  const lower = color.toLowerCase()
  if (lower.startsWith('#') || lower.startsWith('rgb(') || lower.startsWith('rgba(')) return color
  const cached = normalizedColorCache.get(color)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return color
  try {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, alpha] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
    const normalized = alpha === 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${(alpha / 255).toFixed(3)})`
    normalizedColorCache.set(color, normalized)
    return normalized
  } catch {
    return color
  }
}

function nearestOpaqueBackground(host: HTMLElement): string | undefined {
  let node: HTMLElement | null = host
  while (node) {
    const background = getComputedStyle(node).backgroundColor.trim()
    if (background && background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)') {
      return background
    }
    node = node.parentElement
  }
  return undefined
}

function chartColorsFromHost(count: number, host?: HTMLElement | null): string[] {
  const colors: string[] = []
  for (let i = 1; i <= count; i += 1) {
    const color = themeValue(`--rk-chart-${i}`, host)
    if (color) colors.push(color)
  }
  return colors
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
  function BridgeComponent({
    props,
    bindings,
    emit = () => undefined,
  }: {
    props: ChartProps
    bindings?: Record<string, string>
    emit?: (event: string) => void
  }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<echarts.ECharts | null>(null)
    const observerRef = useRef<ResizeObserver | null>(null)
    const dataPointClickedRef = useRef(false)
    const [chartStatus, setChartStatus] = useState<'mounting' | 'mounted' | 'option-set' | 'finished' | 'error'>('mounting')
    const [chartMeta, setChartMeta] = useState({ seriesCount: 0, pointCount: 0 })
    const [chartError, setChartError] = useState('')
    const [, setSelectedPoint] = useBoundProp<Record<string, unknown> | undefined>(
      undefined,
      bindings?.selectedPoint,
    )

    // Keep the expensive ECharts option stable across parent re-renders.
    const propsKey = stableStringify(props)
    const actionName = typeof props.action === 'string' && props.action.trim()
      ? props.action.trim()
      : undefined
    // Init chart on mount, dispose on unmount
    useEffect(() => {
      if (!containerRef.current) return
      const chart = echarts.init(containerRef.current)
      chartRef.current = chart
      setChartStatus('mounted')

      const finished = () => {
        setChartStatus('finished')
        containerRef.current?.dispatchEvent(new CustomEvent('vizual-chart-finished', {
          bubbles: true,
          detail: { chartType, ...chartMeta },
        }))
      }
      chart.on('finished', finished)

      const observer = new ResizeObserver(() => chart.resize())
      observer.observe(containerRef.current)
      observerRef.current = observer

      return () => {
        chart.off('finished', finished)
        observer.disconnect()
        observerRef.current = null
        chart.dispose()
        chartRef.current = null
      }
    }, [])

    // Update chart option when props change
    useEffect(() => {
      if (chartRef.current) {
        try {
          const option = buildOption(chartType, props, buildFallbackOption, containerRef.current)
          const meta = summarizeOption(option)
          setChartMeta(meta)
          setChartError('')
          setChartStatus('option-set')
          chartRef.current.setOption(option, true)
        } catch (error) {
          setChartError(error instanceof Error ? error.message : String(error))
          setChartStatus('error')
        }
      }
    }, [propsKey])

    // 主题切换时用最新 tc() 色值重建 option 并刷新图表
    useEffect(() => {
      const handler = (event: Event) => {
        const target = (event as CustomEvent<{ target?: EventTarget | null }>).detail?.target
        if (
          target instanceof HTMLElement &&
          containerRef.current &&
          !target.contains(containerRef.current)
        ) {
          return
        }
        if (!chartRef.current) return
        try {
          const newOption = buildOption(chartType, props, buildFallbackOption, containerRef.current)
          const meta = summarizeOption(newOption)
          setChartMeta(meta)
          setChartError('')
          setChartStatus('option-set')
          chartRef.current.setOption(newOption, true)
        } catch (error) {
          setChartError(error instanceof Error ? error.message : String(error))
          setChartStatus('error')
        }
      }
      document.addEventListener('vizual-theme-change', handler)
      return () => document.removeEventListener('vizual-theme-change', handler)
    }, [propsKey])

    // 注册 ECharts 点击事件 — host/Agent 钻取回流
    useEffect(() => {
      const chart = chartRef.current
      if (!chart || !actionName) return

      const handler = (params: any) => {
        if (params.componentType === 'series' && params.seriesIndex !== undefined && params.dataIndex !== undefined) {
          dataPointClickedRef.current = true
          setSelectedPoint({
            chartType,
            seriesIndex: params.seriesIndex,
            dataIndex: params.dataIndex,
            seriesName: params.seriesName ?? '',
            name: params.name || '',
            value: params.value ?? '',
            data: params.data ?? undefined,
          })
          emit(actionName)
        }
      }
      chart.on('click', handler)
      return () => { chart.off('click', handler) }
    }, [emit, actionName, setSelectedPoint])

    // 整体图表点击 fallback（点击空白区域）
    const handleContainerClick = (e: React.MouseEvent<HTMLElement>) => {
      if (dataPointClickedRef.current) {
        dataPointClickedRef.current = false
        return
      }
      if (actionName) {
        const fallbackPoint = inferNearestPointFromClick(chartRef.current, e, chartType)
        if (fallbackPoint) setSelectedPoint(fallbackPoint)
        emit(actionName)
        return
      }
    }

    const height = typeof props.height === 'number' ? props.height : (props.title ? 320 : 300)
    return (
      <div
        ref={containerRef}
        data-vizual-chart={chartType}
        data-vizual-chart-status={chartStatus}
        data-vizual-chart-series-count={chartMeta.seriesCount}
        data-vizual-chart-point-count={chartMeta.pointCount}
        data-vizual-chart-error={chartError || undefined}
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          margin: '0 auto',
          display: 'block',
          height,
          ...(actionName ? { cursor: 'pointer' } : {}),
        }}
        {...(actionName ? {
          onClick: handleContainerClick,
        } : {})}
      />
    )
  }
  BridgeComponent.displayName = chartType
  return BridgeComponent
}

function inferNearestPointFromClick(
  chart: echarts.ECharts | null,
  event: React.MouseEvent<HTMLElement>,
  chartType: string,
): Record<string, unknown> | undefined {
  if (!chart) return undefined

  const option = chart.getOption() as Record<string, unknown>
  const rawSeries = option.series
  const seriesList = Array.isArray(rawSeries)
    ? rawSeries.filter(isRecord)
    : isRecord(rawSeries)
      ? [rawSeries]
      : []
  if (!seriesList.length) return undefined

  const seriesIndex = 0
  const series = seriesList[seriesIndex]
  const seriesData = Array.isArray(series.data) ? series.data : []
  if (!seriesData.length) return undefined

  const rect = event.currentTarget.getBoundingClientRect()
  const pixel: [number, number] = [
    Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
  ]

  let dataIndex: number | undefined
  try {
    const converted = chart.convertFromPixel({ seriesIndex }, pixel) as unknown
    const xValue = Array.isArray(converted) ? converted[0] : converted
    if (typeof xValue === 'number' && Number.isFinite(xValue)) dataIndex = Math.round(xValue)
    else if (typeof xValue === 'string') {
      const axisData = getAxisData(option, 'xAxis')
      const index = axisData.findIndex(item => String(item) === xValue)
      if (index >= 0) dataIndex = index
    }
  } catch {
    dataIndex = undefined
  }

  if (dataIndex === undefined) {
    const leftPad = rect.width * 0.08
    const rightPad = rect.width * 0.04
    const plotWidth = Math.max(1, rect.width - leftPad - rightPad)
    const ratio = Math.max(0, Math.min(1, (pixel[0] - leftPad) / plotWidth))
    dataIndex = Math.round(ratio * Math.max(0, seriesData.length - 1))
  }
  dataIndex = Math.max(0, Math.min(seriesData.length - 1, dataIndex))

  const rawPoint = seriesData[dataIndex]
  const axisData = getAxisData(option, 'xAxis')
  const name = inferPointName(rawPoint, axisData[dataIndex], dataIndex)
  const value = inferPointValue(rawPoint)

  return {
    chartType,
    seriesIndex,
    dataIndex,
    seriesName: typeof series.name === 'string' ? series.name : '',
    name,
    value,
    data: rawPoint,
  }
}

function getAxisData(option: Record<string, unknown>, key: 'xAxis' | 'yAxis'): unknown[] {
  const axis = option[key]
  const firstAxis = Array.isArray(axis) ? axis.find(isRecord) : axis
  if (!isRecord(firstAxis) || !Array.isArray(firstAxis.data)) return []
  return firstAxis.data
}

function inferPointName(rawPoint: unknown, axisValue: unknown, dataIndex: number): string {
  if (isRecord(rawPoint)) {
    const rawName = rawPoint.name ?? rawPoint.x ?? rawPoint.category ?? rawPoint.label
    if (rawName !== undefined) return String(rawName)
  }
  if (axisValue !== undefined) return String(axisValue)
  return String(dataIndex)
}

function inferPointValue(rawPoint: unknown): unknown {
  if (isRecord(rawPoint) && 'value' in rawPoint) return rawPoint.value
  if (Array.isArray(rawPoint)) return rawPoint[rawPoint.length - 1]
  return rawPoint
}

/**
 * Build ECharts option using the chart component's local option builder.
 * Returns a valid option object synchronously.
 */
function buildOption(
  chartType: string,
  props: ChartProps,
  fallback: (props: ChartProps) => Record<string, unknown>,
  themeHost?: HTMLElement | null,
): Record<string, unknown> {
  let option: Record<string, unknown>

  try {
    option = fallback(props)
  } catch (e) {
    console.error(`[vizual] option builder for "${chartType}" failed:`, e)
    return { title: { text: `Error: ${(e as Error).message}` } }
  }

  // Inject theme chart palette — all charts follow DESIGN.md / theme colors
  const palette = chartColorsFromHost(6, themeHost)
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
  const tv = (name: string) => themeValue(name, themeHost)
  const textColor = tv('--rk-text-secondary')
  const primaryTextColor = tv('--rk-text-primary') || textColor
  const bgColor = tv('--rk-bg-secondary')
  const cellBgColor = tv('--rk-bg-tertiary') || bgColor
  const borderColor = tv('--rk-border-subtle')
  const displayFont = tv('--rk-font-display') || tv('--rk-font-sans')
  const uiFont = tv('--rk-font-ui') || tv('--rk-font-sans')

  if (option.title && typeof option.title === 'object') {
    const title = option.title as Record<string, unknown>
    const textStyle = (title.textStyle && typeof title.textStyle === 'object')
      ? title.textStyle as Record<string, unknown>
      : {}
    if (primaryTextColor) textStyle.color = primaryTextColor
    if (displayFont) textStyle.fontFamily = displayFont
    title.textStyle = textStyle
  }
  option.textStyle = {
    ...((option.textStyle as Record<string, unknown> | undefined) ?? {}),
    ...(uiFont ? { fontFamily: uiFont } : {}),
  }

  // Axis labels
  // Axis labels, splitLines, axisLines
  for (const key of ['xAxis', 'yAxis']) {
    const raw = option[key]
    const axes = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[]
    for (const axis of axes) {
      if (!axis || typeof axis !== 'object') continue
      const label = axis.axisLabel && typeof axis.axisLabel === 'object'
        ? axis.axisLabel as Record<string, unknown>
        : {}
      if (textColor) {
        label.color = textColor
      }
      if (uiFont) label.fontFamily = uiFont
      axis.axisLabel = label
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
      const ts = (tooltip.textStyle && typeof tooltip.textStyle === 'object')
        ? tooltip.textStyle as Record<string, unknown>
        : {}
      ts.color = textColor
      if (uiFont) ts.fontFamily = uiFont
      tooltip.textStyle = ts
    }
  }

  if ((chartType === 'heatmap' || chartType === 'calendar') && cellBgColor) {
    const visualMaps = (Array.isArray(option.visualMap)
      ? option.visualMap
      : option.visualMap ? [option.visualMap] : []) as Record<string, unknown>[]
    const firstChartColor = palette[0] || tv('--rk-accent') || primaryTextColor
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
        if (uiFont) label.fontFamily = uiFont
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
        if (uiFont) label.fontFamily = uiFont
        s.label = label
        const itemStyle = (s.itemStyle && typeof s.itemStyle === 'object') ? s.itemStyle as Record<string, unknown> : {}
        if (borderColor) itemStyle.borderColor = borderColor
        s.itemStyle = itemStyle
      }
    }
  }

  // Legend text
  const legends = (Array.isArray(option.legend)
    ? option.legend
    : option.legend ? [option.legend] : []) as Record<string, unknown>[]
  if (legends.length > 0 && textColor) {
    for (const leg of legends) {
      const ts = (leg.textStyle && typeof leg.textStyle === 'object')
        ? leg.textStyle as Record<string, unknown>
        : {}
      ts.color = textColor
      if (uiFont) ts.fontFamily = uiFont
      leg.textStyle = ts
    }
  }

  return option
}
