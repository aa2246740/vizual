import type { VizualSpec, VizualSpecElement } from '../core/artifact'
import type { VizualNativeInput } from './types'

/**
 * Deterministic, lossless input repair for weak / inconsistent agents.
 *
 * The native contract is strict on purpose: `ok: true` must mean a really
 * renderable surface. But a large share of real-world model output never even
 * reaches that contract because the model emits a *recognizable* foreign chart
 * dialect — an ECharts `option` object, a Chart.js config, or a JSON string —
 * instead of a Vizual native spec. Those shapes are unambiguously mappable to a
 * real native chart with the *same data*, so rejecting them outright just makes
 * weaker models loop.
 *
 * This module performs the only safe kind of repair:
 *   - It converts a dialect into native components **only when the mapping is
 *     unambiguous and preserves the original data** (no invented rows, labels,
 *     series, axes, thresholds, or values).
 *   - When a shape is ambiguous or its data cannot be recovered faithfully, it
 *     leaves the input untouched so the normal validator rejects it loudly with
 *     an actionable diagnostic. Repair never manufactures a fake success.
 *
 * It is intentionally host- and product-agnostic: it knows nothing about any
 * specific integration target. It only understands public chart dialects.
 */

export type VizualInputRepair = {
  code: string
  message: string
  detail?: Record<string, unknown>
}

export type VizualRepairResult = {
  input: VizualNativeInput
  /** Repairs applied, newest last. Empty when the input was already native. */
  repairs: VizualInputRepair[]
  /** True when at least one repair changed the input. */
  changed: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function hasAnyOwn(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some(key => hasOwn(record, key))
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return undefined
}

/** Number that may arrive as a string ("1,234", "12.5%") from formatted output. */
function coerceNumeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '').replace(/%$/, '')
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** A native spec / native operation / message already speaks the protocol. */
const NATIVE_HINT_KEYS = [
  'root', 'elements', 'components', 'component', 'createSurface', 'updateComponents',
  'updateDataModel', 'appendDataModel', 'deleteSurface', 'callFunction', 'actionResponse',
  'updateTheme', 'errorRecovery', 'a2ui_operations', 'a2uiMessages', 'input', 'envelope',
  'spec', 'surfaceUpdate', 'surfaceCreate',
]
const SEMANTIC_HINT_KEYS = ['kind', 'kpis', 'metrics', 'charts', 'visuals', 'tables', 'risks', 'forms']

function looksAlreadyNative(record: Record<string, unknown>): boolean {
  if (hasAnyOwn(record, NATIVE_HINT_KEYS) || hasAnyOwn(record, SEMANTIC_HINT_KEYS)) return true
  // A bare semantic chart record like { type: 'bar', data: [...] }.
  if (typeof record.type === 'string' && Array.isArray((record as { data?: unknown }).data)) return true
  return false
}

// ---------------------------------------------------------------------------
// ECharts option object  ->  native chart spec
// ---------------------------------------------------------------------------

function isEChartsOption(record: Record<string, unknown>): boolean {
  return Array.isArray(record.series)
    && hasAnyOwn(record, ['xAxis', 'yAxis', 'radar', 'angleAxis', 'radiusAxis', 'tooltip', 'legend', 'grid', 'polar'])
}

function firstAxisWithData(axis: unknown): { name?: string; data: unknown[] } | null {
  const axes = Array.isArray(axis) ? axis : [axis]
  for (const candidate of axes) {
    if (isRecord(candidate) && Array.isArray(candidate.data) && candidate.data.length > 0) {
      return { name: firstString(candidate.name), data: candidate.data }
    }
  }
  return null
}

function seriesNumericValues(series: Record<string, unknown>): number[] | null {
  if (!Array.isArray(series.data)) return null
  const values = series.data.map(item => {
    if (isRecord(item)) return coerceNumeric(item.value)
    return coerceNumeric(item)
  })
  if (values.some(v => v === null)) return null
  return values as number[]
}

/** Build a flat single-element spec wrapping one chart element. */
function wrapChartElement(element: VizualSpecElement): VizualSpec {
  return { root: 'chart-1', elements: { 'chart-1': element } }
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(record)) as Record<string, unknown>
}

function repairKpiDashboardProps(props: Record<string, unknown>): boolean {
  if (Array.isArray(props.metrics) && props.metrics.length > 0) return false

  if (Array.isArray(props.kpis) && props.kpis.length > 0) {
    props.metrics = props.kpis
    return true
  }

  const label = firstString(props.label, props.title, props.name)
  if (!label || !hasOwn(props, 'value')) return false

  const metric: Record<string, unknown> = { label, value: props.value }
  const description = firstString(props.subtext, props.description, props.subtitle)
  if (description) metric.description = description
  if (hasOwn(props, 'trend')) metric.trend = props.trend
  props.metrics = [metric]
  return true
}

function firstRowWithKeys(rows: unknown): Record<string, unknown> | null {
  if (!Array.isArray(rows)) return null
  return rows.find(isRecord) ?? null
}

function hasField(rows: unknown, field: string): boolean {
  const row = firstRowWithKeys(rows)
  return Boolean(row && hasOwn(row, field))
}

function chooseDataField(rows: unknown, preferred: unknown, fallbacks: string[]): string | undefined {
  const preferredField = firstString(preferred)
  if (preferredField && hasField(rows, preferredField)) return preferredField
  return fallbacks.find(field => hasField(rows, field))
}

function repairChartFieldAliases(props: Record<string, unknown>, componentType: unknown): boolean {
  if (typeof componentType !== 'string' || !componentType.endsWith('Chart')) return false
  const coordinateCharts = new Set([
    'BarChart',
    'LineChart',
    'AreaChart',
    'ScatterChart',
    'BubbleChart',
    'ComboChart',
    'DumbbellChart',
    'WaterfallChart',
    'SparklineChart',
  ])
  if (!coordinateCharts.has(componentType)) return false
  const rows = props.data
  const firstRow = firstRowWithKeys(rows)
  if (!firstRow) return false

  let changed = false
  if (typeof props.x !== 'string' || !hasField(rows, props.x)) {
    const field = chooseDataField(rows, props.xAxis ?? props.xField ?? props.labelField ?? props.x, ['x', 'name', 'label', 'category', 'branch'])
    if (field) {
      props.x = field
      changed = true
    }
  }
  if (typeof props.y !== 'string' || !hasField(rows, props.y)) {
    const field = chooseDataField(rows, props.yAxis ?? props.yField ?? props.valueField ?? props.y, ['y', 'value'])
    if (field) {
      props.y = field
      changed = true
    }
  }
  if (componentType === 'BubbleChart' && (typeof props.size !== 'string' || !hasField(rows, props.size))) {
    const field = chooseDataField(rows, props.sizeField ?? props.size, ['size', 'z'])
    if (field) {
      props.size = field
      changed = true
    }
  }
  if ((typeof props.color !== 'string' || !hasField(rows, props.color)) && typeof (props.colorField ?? props.color) === 'string') {
    const field = chooseDataField(rows, props.colorField ?? props.color, ['color'])
    if (field) {
      props.color = field
      changed = true
    }
  }
  return changed
}

function normalizeRadarIndicators(indicators: unknown): Array<{ name: string; max?: number }> | null {
  if (!Array.isArray(indicators) || indicators.length === 0) return null
  const normalized: Array<{ name: string; max?: number }> = []
  for (const indicator of indicators) {
    if (typeof indicator === 'string' && indicator.trim()) {
      normalized.push({ name: indicator.trim() })
      continue
    }
    if (isRecord(indicator)) {
      const name = firstString(indicator.name, indicator.label, indicator.key)
      if (!name) return null
      const max = coerceNumeric(indicator.max)
      normalized.push(max === null ? { name } : { name, max })
      continue
    }
    return null
  }
  return normalized
}

function normalizeRadarSeriesRows(rows: unknown, indicatorCount: number): Array<{ name: string; values: number[] }> | null {
  if (!Array.isArray(rows) || rows.length === 0 || indicatorCount <= 0) return null
  const series: Array<{ name: string; values: number[] }> = []
  for (const row of rows) {
    if (!isRecord(row) || !Array.isArray(row.values) || row.values.length !== indicatorCount) return null
    const values = row.values.map(coerceNumeric)
    if (values.some(value => value === null)) return null
    const name = firstString(row.name, row.label, row.branch, row['分行']) ?? `series-${series.length + 1}`
    series.push({ name, values: values as number[] })
  }
  return series
}

function repairRadarChartProps(props: Record<string, unknown>, componentType: unknown): boolean {
  if (componentType !== 'RadarChart') return false

  const indicators = normalizeRadarIndicators(props.indicators ?? props.categories)
  if (!indicators) return false

  let changed = false
  if (props.indicators !== indicators) {
    props.indicators = indicators
    if (hasOwn(props, 'categories')) delete props.categories
    changed = true
  }

  if (!Array.isArray(props.series) && Array.isArray(props.data)) {
    const series = normalizeRadarSeriesRows(props.data, indicators.length)
    if (series) {
      props.series = series
      delete props.data
      changed = true
    }
  }

  return changed
}

function repairComponentObject(component: Record<string, unknown>): boolean {
  const componentType = component.type
  const props = isRecord(component.props) ? component.props : component

  let changed = false
  if (componentType === 'KpiDashboard') {
    changed = repairKpiDashboardProps(props) || changed
  }
  changed = repairRadarChartProps(props, componentType) || changed
  changed = repairChartFieldAliases(props, componentType) || changed
  return changed
}

function repairNativeSpecConventions(record: Record<string, unknown>): VizualRepairResult | null {
  if (!isRecord(record.elements) && !Array.isArray(record.components)) return null

  let repaired: Record<string, unknown> | null = null
  let repairedCount = 0

  if (isRecord(record.elements)) {
    for (const [elementId, element] of Object.entries(record.elements)) {
      if (!isRecord(element)) continue
      const working: Record<string, unknown> = repaired ?? cloneRecord(record)
      const workingElements = working.elements as Record<string, unknown>
      const workingElement = workingElements[elementId]
      if (!isRecord(workingElement)) continue
      if (repairComponentObject(workingElement)) {
        repaired = working
        repairedCount += 1
      }
    }
  }

  if (Array.isArray(record.components)) {
    for (let index = 0; index < record.components.length; index += 1) {
      const component = record.components[index]
      if (!isRecord(component)) continue
      const working: Record<string, unknown> = repaired ?? cloneRecord(record)
      const workingComponents = working.components as unknown[]
      const workingComponent = workingComponents[index]
      if (!isRecord(workingComponent)) continue
      if (repairComponentObject(workingComponent)) {
        repaired = working
        repairedCount += 1
      }
    }
  }

  if (!repaired) return null

  return {
    input: repaired as VizualNativeInput,
    changed: true,
    repairs: [{
      code: 'vizual.repair.native_component_props',
      message: 'Normalized common native component shorthand props into canonical Vizual props. Emit canonical props such as metrics, x, y, size, and color directly.',
      detail: { repairedComponents: repairedCount },
    }],
  }
}

function uniqueFieldName(base: string, used: Set<string>): string {
  let name = base || 'series'
  let i = 2
  while (used.has(name)) {
    name = `${base || 'series'}_${i}`
    i += 1
  }
  used.add(name)
  return name
}

function convertEChartsOption(record: Record<string, unknown>): VizualSpec | null {
  const series = (record.series as unknown[]).filter(isRecord) as Record<string, unknown>[]
  if (series.length === 0) return null
  const title = isRecord(record.title) ? firstString(record.title.text) : firstString(record.title)

  // --- Pie / doughnut ---
  const pieSeries = series.find(s => s.type === 'pie')
  if (pieSeries && series.every(s => s.type === 'pie')) {
    if (!Array.isArray(pieSeries.data)) return null
    const rows: Record<string, unknown>[] = []
    for (const item of pieSeries.data) {
      if (!isRecord(item)) return null
      const name = firstString(item.name)
      const value = coerceNumeric(item.value)
      if (!name || value === null) return null
      rows.push({ name, value })
    }
    if (rows.length === 0) return null
    return wrapChartElement({
      type: 'PieChart',
      props: { type: 'pie', ...(title ? { title } : {}), data: rows },
    })
  }

  // --- Cartesian (bar / line / scatter, single or mixed) ---
  const cartesianTypes = new Set(['bar', 'line', 'scatter', 'effectScatter', undefined])
  if (!series.every(s => cartesianTypes.has(s.type as string | undefined))) return null

  const categoryAxis = firstAxisWithData(record.xAxis) ?? firstAxisWithData(record.yAxis)
  const horizontal = !firstAxisWithData(record.xAxis) && Boolean(firstAxisWithData(record.yAxis))

  // Pure scatter without a category axis: data arrives as [[x, y], ...].
  if (!categoryAxis && series.every(s => s.type === 'scatter' || s.type === 'effectScatter')) {
    const first = series[0]
    if (!Array.isArray(first.data)) return null
    const rows: Record<string, unknown>[] = []
    for (const point of first.data) {
      if (!Array.isArray(point) || point.length < 2) return null
      const x = coerceNumeric(point[0])
      const y = coerceNumeric(point[1])
      if (x === null || y === null) return null
      rows.push({ x, y })
    }
    if (rows.length === 0) return null
    return wrapChartElement({
      type: 'ScatterChart',
      props: { type: 'scatter', ...(title ? { title } : {}), x: 'x', y: 'y', data: rows },
    })
  }

  if (!categoryAxis) return null
  const categories = categoryAxis.data
  const xField = categoryAxis.name && categoryAxis.name !== 'category' ? categoryAxis.name : 'category'

  const used = new Set<string>([xField])
  const seriesMeta: Array<{ field: string; type: string; values: number[] }> = []
  for (const s of series) {
    const values = seriesNumericValues(s)
    if (!values || values.length !== categories.length) return null
    const field = uniqueFieldName(firstString(s.name) ?? 'value', used)
    seriesMeta.push({ field, type: (s.type as string) || 'bar', values })
  }
  if (seriesMeta.length === 0) return null

  const rows: Record<string, unknown>[] = categories.map((label, idx) => {
    const row: Record<string, unknown> = { [xField]: label }
    for (const meta of seriesMeta) row[meta.field] = meta.values[idx]
    return row
  })

  const distinctTypes = new Set(seriesMeta.map(m => m.type))
  const yFields = seriesMeta.map(m => m.field)

  if (distinctTypes.size === 1) {
    const only = seriesMeta[0].type
    if (only === 'bar') {
      return wrapChartElement({
        type: 'BarChart',
        props: { type: 'bar', ...(title ? { title } : {}), x: xField, y: yFields.length === 1 ? yFields[0] : yFields, data: rows, ...(horizontal ? { horizontal: true } : {}) },
      })
    }
    if (only === 'line') {
      return wrapChartElement({
        type: 'LineChart',
        props: { type: 'line', ...(title ? { title } : {}), x: xField, y: yFields.length === 1 ? yFields[0] : yFields, data: rows },
      })
    }
  }

  // Mixed bar/line/scatter -> ComboChart with explicit series mapping.
  return wrapChartElement({
    type: 'ComboChart',
    props: {
      type: 'combo',
      ...(title ? { title } : {}),
      x: xField,
      data: rows,
      series: seriesMeta.map(m => ({
        name: m.field,
        type: m.type === 'effectScatter' ? 'scatter' : (m.type === 'scatter' ? 'scatter' : (m.type === 'line' ? 'line' : 'bar')),
        y: m.field,
      })),
    },
  })
}

// ---------------------------------------------------------------------------
// Chart.js config  ->  native chart spec
// ---------------------------------------------------------------------------

function isChartJsConfig(record: Record<string, unknown>): boolean {
  if (typeof record.type !== 'string') return false
  const data = isRecord(record.data) ? record.data : null
  return Boolean(data && Array.isArray(data.datasets) && Array.isArray(data.labels))
}

function convertChartJsConfig(record: Record<string, unknown>): VizualSpec | null {
  const type = String(record.type).toLowerCase()
  const data = record.data as Record<string, unknown>
  const labels = data.labels as unknown[]
  const datasets = (data.datasets as unknown[]).filter(isRecord) as Record<string, unknown>[]
  if (datasets.length === 0) return null
  const title = chartJsTitle(record)

  if (type === 'pie' || type === 'doughnut') {
    const dataset = datasets[0]
    if (!Array.isArray(dataset.data)) return null
    const rows: Record<string, unknown>[] = []
    for (let i = 0; i < labels.length; i += 1) {
      const name = firstString(labels[i])
      const value = coerceNumeric((dataset.data as unknown[])[i])
      if (!name || value === null) return null
      rows.push({ name, value })
    }
    if (rows.length === 0) return null
    return wrapChartElement({
      type: 'PieChart',
      props: { type: 'pie', ...(title ? { title } : {}), data: rows, ...(type === 'doughnut' ? { donut: true } : {}) },
    })
  }

  if (type === 'scatter' || type === 'bubble') {
    const dataset = datasets[0]
    if (!Array.isArray(dataset.data)) return null
    const rows: Record<string, unknown>[] = []
    for (const point of dataset.data) {
      if (!isRecord(point)) return null
      const x = coerceNumeric(point.x)
      const y = coerceNumeric(point.y)
      if (x === null || y === null) return null
      rows.push({ x, y })
    }
    if (rows.length === 0) return null
    return wrapChartElement({
      type: 'ScatterChart',
      props: { type: 'scatter', ...(title ? { title } : {}), x: 'x', y: 'y', data: rows },
    })
  }

  if (type !== 'bar' && type !== 'line') return null

  const used = new Set<string>(['category'])
  const seriesMeta: Array<{ field: string; type: string; values: number[] }> = []
  for (const dataset of datasets) {
    if (!Array.isArray(dataset.data) || dataset.data.length !== labels.length) return null
    const values = (dataset.data as unknown[]).map(coerceNumeric)
    if (values.some(v => v === null)) return null
    const field = uniqueFieldName(firstString(dataset.label) ?? 'value', used)
    const datasetType = firstString(dataset.type) ?? type
    seriesMeta.push({ field, type: datasetType, values: values as number[] })
  }

  const rows: Record<string, unknown>[] = labels.map((label, idx) => {
    const row: Record<string, unknown> = { category: label }
    for (const meta of seriesMeta) row[meta.field] = meta.values[idx]
    return row
  })
  const yFields = seriesMeta.map(m => m.field)
  const distinctTypes = new Set(seriesMeta.map(m => m.type))

  if (distinctTypes.size > 1) {
    return wrapChartElement({
      type: 'ComboChart',
      props: {
        type: 'combo', ...(title ? { title } : {}), x: 'category', data: rows,
        series: seriesMeta.map(m => ({ name: m.field, type: m.type === 'line' ? 'line' : 'bar', y: m.field })),
      },
    })
  }

  return wrapChartElement({
    type: type === 'line' ? 'LineChart' : 'BarChart',
    props: { type, ...(title ? { title } : {}), x: 'category', y: yFields.length === 1 ? yFields[0] : yFields, data: rows },
  })
}

function chartJsTitle(record: Record<string, unknown>): string | undefined {
  const options = isRecord(record.options) ? record.options : null
  const plugins = options && isRecord(options.plugins) ? options.plugins : null
  const titlePlugin = plugins && isRecord(plugins.title) ? plugins.title : null
  if (titlePlugin) {
    if (typeof titlePlugin.text === 'string') return titlePlugin.text
    if (Array.isArray(titlePlugin.text)) return titlePlugin.text.filter(t => typeof t === 'string').join(' ')
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

/**
 * Repair recognizable foreign dialects into native input. Idempotent: native
 * input is returned unchanged with no repairs.
 */
export function repairAgentInput(input: VizualNativeInput): VizualRepairResult {
  try {
    return repairAgentInputUnsafe(input)
  } catch {
    // A hostile/malformed payload (e.g. a throwing property getter) must not
    // break the pipeline. Leave it untouched so normalization reports the error.
    return { input, repairs: [], changed: false }
  }
}

function repairAgentInputUnsafe(input: VizualNativeInput): VizualRepairResult {
  const repairs: VizualInputRepair[] = []

  // 1. A JSON string instead of a parsed object/array.
  let current: unknown = input
  if (typeof current === 'string') {
    const trimmed = current.trim()
    if (/^[\[{]/.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object') {
          current = parsed
          repairs.push({
            code: 'vizual.repair.parsed_json_string',
            message: 'Parsed a JSON string into a structured object. Prefer passing the object directly, not a stringified JSON blob.',
          })
        }
      } catch {
        /* leave as-is; the validator reports the opaque-input issue */
      }
    }
  }

  if (!isRecord(current)) {
    return { input: current as VizualNativeInput, repairs, changed: repairs.length > 0 }
  }
  if (looksAlreadyNative(current)) {
    const nativeRepair = repairNativeSpecConventions(current)
    if (nativeRepair) {
      return {
        input: nativeRepair.input,
        repairs: [...repairs, ...nativeRepair.repairs],
        changed: true,
      }
    }
    return { input: current as VizualNativeInput, repairs, changed: repairs.length > 0 }
  }

  // 2. ECharts option object.
  if (isEChartsOption(current)) {
    const spec = convertEChartsOption(current)
    if (spec) {
      const el = spec.elements?.['chart-1']
      repairs.push({
        code: 'vizual.repair.echarts_option',
        message: `Converted a raw ECharts option object into a native ${el?.type ?? 'chart'} with the same data. Emit native chart components directly (BarChart / LineChart / PieChart / ScatterChart / ComboChart), not ECharts options.`,
        detail: { component: el?.type },
      })
      return { input: spec, repairs, changed: true }
    }
  }

  // 3. Chart.js config.
  if (isChartJsConfig(current)) {
    const spec = convertChartJsConfig(current)
    if (spec) {
      const el = spec.elements?.['chart-1']
      repairs.push({
        code: 'vizual.repair.chartjs_config',
        message: `Converted a raw Chart.js config into a native ${el?.type ?? 'chart'} with the same data. Emit native chart components directly, not Chart.js configs.`,
        detail: { component: el?.type },
      })
      return { input: spec, repairs, changed: true }
    }
  }

  return { input: current as VizualNativeInput, repairs, changed: repairs.length > 0 }
}
