import type { VizualSpec } from './artifact'

export type VizualRenderEvidenceMetrics = {
  width: number
  height: number
  visibleTextLength: number
  visibleControlCount: number
  visibleTableCount: number
  visibleSvgCount: number
  visibleImageCount: number
  chartHostCount: number
  canvasCount: number
  visibleCanvasCount: number
  nonEmptyCanvasCount: number
  expectedChartCount: number
  expectedEChartsCount: number
  paintedChartCount: number
}

export type VizualCanvasEvidence = {
  width: number
  height: number
  visible: boolean
  readable: boolean
  nonEmpty: boolean
  sampleCount: number
  nonTransparentSampleCount: number
  nonUniformSampleCount: number
  nonBackgroundSampleCount: number
  error?: string
}

export type VizualRenderReceipt = {
  accepted: boolean
  normalized: boolean
  mounted: boolean
  painted: boolean
  chartPainted?: boolean
  interactiveReady?: boolean
  status: 'accepted' | 'mounted' | 'painted' | 'blank' | 'incomplete' | 'error'
  errors: string[]
  warnings: string[]
  evidence: {
    componentTypes: string[]
    expectedCharts: string[]
    expectedECharts: string[]
    chartStatuses: string[]
    metrics: VizualRenderEvidenceMetrics
    canvases: VizualCanvasEvidence[]
  }
}

const ECHARTS_COMPONENTS = new Set([
  'AreaChart',
  'BarChart',
  'BoxplotChart',
  'BubbleChart',
  'CalendarChart',
  'ComboChart',
  'DumbbellChart',
  'FunnelChart',
  'HeatmapChart',
  'HistogramChart',
  'LineChart',
  'PieChart',
  'RadarChart',
  'SankeyChart',
  'ScatterChart',
  'SparklineChart',
  'WaterfallChart',
  'XmrChart',
])

const CHART_COMPONENTS = new Set([...ECHARTS_COMPONENTS, 'MermaidDiagram'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function visibleBox(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width > 4 && rect.height > 4
}

function collectComponentTypes(spec: VizualSpec | null | undefined): string[] {
  const elements = isRecord(spec?.elements) ? spec.elements : {}
  return Object.values(elements)
    .map(element => isRecord(element) && typeof element.type === 'string' ? element.type : undefined)
    .filter((type): type is string => Boolean(type))
}

function readCanvasEvidence(canvas: HTMLCanvasElement): VizualCanvasEvidence {
  const rect = canvas.getBoundingClientRect()
  const width = Math.round(rect.width || canvas.width || 0)
  const height = Math.round(rect.height || canvas.height || 0)
  const visible = width > 4 && height > 4
  const base: VizualCanvasEvidence = {
    width,
    height,
    visible,
    readable: false,
    nonEmpty: false,
    sampleCount: 0,
    nonTransparentSampleCount: 0,
    nonUniformSampleCount: 0,
    nonBackgroundSampleCount: 0,
  }
  if (!visible) return base

  try {
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return { ...base, error: 'canvas-context-unavailable' }
    const pixelWidth = canvas.width
    const pixelHeight = canvas.height
    if (pixelWidth <= 0 || pixelHeight <= 0) return { ...base, error: 'canvas-zero-pixel-size' }

    const sampleAxis = (size: number) => Array.from(new Set(
      Array.from({ length: 21 }, (_, index) => Math.max(0, Math.min(size - 1, Math.floor((size - 1) * (index / 20))))),
    ))
    const sampleX = sampleAxis(pixelWidth)
    const sampleY = sampleAxis(pixelHeight)

    let sampleCount = 0
    let nonTransparentSampleCount = 0
    let nonUniformSampleCount = 0
    let nonBackgroundSampleCount = 0
    let first: [number, number, number, number] | null = null

    for (const x of sampleX) {
      for (const y of sampleY) {
        const data = context.getImageData(x, y, 1, 1).data
        const pixel: [number, number, number, number] = [data[0], data[1], data[2], data[3]]
        first ??= pixel
        sampleCount += 1
        if (pixel[3] > 0) nonTransparentSampleCount += 1
        const delta = Math.abs(pixel[0] - first[0])
          + Math.abs(pixel[1] - first[1])
          + Math.abs(pixel[2] - first[2])
          + Math.abs(pixel[3] - first[3])
        if (delta > 16) nonUniformSampleCount += 1
        if (pixel[3] > 0 && !(pixel[0] > 248 && pixel[1] > 248 && pixel[2] > 248)) {
          nonBackgroundSampleCount += 1
        }
      }
    }

    return {
      ...base,
      readable: true,
      sampleCount,
      nonTransparentSampleCount,
      nonUniformSampleCount,
      nonBackgroundSampleCount,
      nonEmpty: nonUniformSampleCount > 0 || nonBackgroundSampleCount > 0,
    }
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function collectVizualRenderEvidence(
  container: Element | null | undefined,
  spec?: VizualSpec | null,
): VizualRenderReceipt {
  const componentTypes = collectComponentTypes(spec)
  const expectedCharts = componentTypes.filter(type => CHART_COMPONENTS.has(type))
  const expectedECharts = componentTypes.filter(type => ECHARTS_COMPONENTS.has(type))
  const accepted = Boolean(spec)
  const normalized = Boolean(spec?.root && spec.elements)

  if (!container) {
    return {
      accepted,
      normalized,
      mounted: false,
      painted: false,
      chartPainted: expectedCharts.length ? false : undefined,
      interactiveReady: false,
      status: 'blank',
      errors: ['missing-render-container'],
      warnings: [],
      evidence: {
        componentTypes,
        expectedCharts,
        expectedECharts,
        chartStatuses: [],
        metrics: emptyMetrics(expectedCharts.length, expectedECharts.length),
        canvases: [],
      },
    }
  }

  const rect = container.getBoundingClientRect()
  const mounted = rect.width > 0 && rect.height > 0
  const text = (container.textContent || '').trim()
  const controls = Array.from(container.querySelectorAll('button,input,textarea,select,[role="button"]')).filter(visibleBox)
  const tables = Array.from(container.querySelectorAll('table')).filter(visibleBox)
  const svgs = Array.from(container.querySelectorAll('svg')).filter(visibleBox)
  const images = Array.from(container.querySelectorAll('img,video,audio,[role="img"]')).filter(visibleBox)
  const chartHosts = Array.from(container.querySelectorAll('[data-vizual-chart]')).filter(visibleBox)
  const canvases = Array.from(container.querySelectorAll('canvas')) as HTMLCanvasElement[]
  const canvasEvidence = canvases.map(readCanvasEvidence)
  const nonEmptyCanvasCount = canvasEvidence.filter(canvas => canvas.nonEmpty).length
  const visibleCanvasCount = canvasEvidence.filter(canvas => canvas.visible).length
  const chartStatuses = chartHosts
    .map(chart => chart.getAttribute('data-vizual-chart-status') || '')
    .filter(Boolean)
  const paintedChartCount = nonEmptyCanvasCount

  const hasPrimitivePaint = Boolean(
    text.length > 0 ||
    controls.length > 0 ||
    tables.length > 0 ||
    svgs.length > 0 ||
    images.length > 0 ||
    nonEmptyCanvasCount > 0,
  )
  const chartPainted = expectedCharts.length
    ? expectedECharts.length
      ? paintedChartCount >= expectedECharts.length
      : svgs.length > 0 || nonEmptyCanvasCount > 0
    : undefined
  const painted = Boolean(mounted && hasPrimitivePaint && (expectedCharts.length === 0 || chartPainted))
  const interactiveReady = componentTypes.some(type => [
    'Button',
    'CheckBox',
    'ChoicePicker',
    'DateTimeInput',
    'FormBuilder',
    'Slider',
    'Tabs',
    'TextField',
  ].includes(type))
    ? controls.length > 0
    : undefined

  const errors: string[] = []
  const warnings: string[] = []
  if (!mounted) errors.push('render-container-not-visible')
  if (!hasPrimitivePaint) errors.push('no-visible-rendered-primitives')
  if (expectedECharts.length > 0 && chartHosts.length < expectedECharts.length) errors.push('expected-chart-host-missing')
  if (expectedECharts.length > 0 && visibleCanvasCount < expectedECharts.length) errors.push('expected-chart-canvas-missing')
  if (expectedECharts.length > 0 && paintedChartCount < expectedECharts.length) errors.push('expected-chart-not-painted')
  if (expectedECharts.length > 0 && canvasEvidence.some(canvas => canvas.visible && !canvas.readable)) warnings.push('chart-canvas-pixel-read-unavailable')
  if (interactiveReady === false) errors.push('expected-controls-missing')

  const status: VizualRenderReceipt['status'] = errors.length
    ? mounted && hasPrimitivePaint ? 'incomplete' : 'blank'
    : painted ? 'painted' : mounted ? 'mounted' : 'blank'

  return {
    accepted,
    normalized,
    mounted,
    painted,
    chartPainted,
    interactiveReady,
    status,
    errors,
    warnings,
    evidence: {
      componentTypes,
      expectedCharts,
      expectedECharts,
      chartStatuses,
      metrics: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visibleTextLength: text.length,
        visibleControlCount: controls.length,
        visibleTableCount: tables.length,
        visibleSvgCount: svgs.length,
        visibleImageCount: images.length,
        chartHostCount: chartHosts.length,
        canvasCount: canvases.length,
        visibleCanvasCount,
        nonEmptyCanvasCount,
        expectedChartCount: expectedCharts.length,
        expectedEChartsCount: expectedECharts.length,
        paintedChartCount,
      },
      canvases: canvasEvidence,
    },
  }
}

function emptyMetrics(expectedChartCount = 0, expectedEChartsCount = 0): VizualRenderEvidenceMetrics {
  return {
    width: 0,
    height: 0,
    visibleTextLength: 0,
    visibleControlCount: 0,
    visibleTableCount: 0,
    visibleSvgCount: 0,
    visibleImageCount: 0,
    chartHostCount: 0,
    canvasCount: 0,
    visibleCanvasCount: 0,
    nonEmptyCanvasCount: 0,
    expectedChartCount,
    expectedEChartsCount,
    paintedChartCount: 0,
  }
}
