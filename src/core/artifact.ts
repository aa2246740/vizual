export type VizualSpecElement = {
  type?: string
  props?: Record<string, unknown>
  children?: unknown
  [key: string]: unknown
}

export type VizualSpec = {
  root?: string
  elements?: Record<string, VizualSpecElement>
  state?: Record<string, unknown>
  [key: string]: unknown
}

export type VizualArtifactKind = 'spec' | 'docview' | 'interactive'
export type VizualArtifactStatus = 'draft' | 'rendered' | 'updated' | 'error' | 'exported'

export type VizualArtifactSource = {
  messageId?: string
  conversationId?: string
  prompt?: string
  createdBy?: string
}

export type VizualArtifactTheme = {
  name?: string
  designMd?: string
  mode?: 'dark' | 'light'
}

export type VizualTargetType =
  | 'element'
  | 'section'
  | 'metric'
  | 'table-column'
  | 'table-cell'
  | 'chart-series'

export type VizualTarget = {
  id: string
  type: VizualTargetType
  path: string
  elementId?: string
  componentType?: string
  label?: string
  summary?: string
  propsPath?: string
  dataPath?: string
  meta?: Record<string, unknown>
}

export type VizualArtifactVersion = {
  id: string
  artifactId: string
  createdAt: string
  reason?: string
  spec: VizualSpec
  data?: unknown
  state?: Record<string, unknown>
  theme?: VizualArtifactTheme
  patch?: unknown
}

export type VizualExportFormat = 'png' | 'pdf' | 'pptx' | 'xlsx' | 'csv' | string

export type VizualExportRecord = {
  id: string
  artifactId: string
  format: VizualExportFormat
  createdAt: string
  targetId?: string
  width?: number
  height?: number
  url?: string
  filename?: string
  status?: 'requested' | 'success' | 'error'
  error?: string
  meta?: Record<string, unknown>
}

export type VizualArtifact = {
  id: string
  kind: VizualArtifactKind
  status: VizualArtifactStatus
  spec: VizualSpec
  data?: unknown
  theme?: VizualArtifactTheme
  state?: Record<string, unknown>
  source?: VizualArtifactSource
  targetMap: VizualTarget[]
  versions: VizualArtifactVersion[]
  exports: VizualExportRecord[]
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  lastError?: string
}

export type CreateVizualArtifactInput = {
  id?: string
  kind?: VizualArtifactKind
  status?: VizualArtifactStatus
  spec: VizualSpec
  data?: unknown
  theme?: VizualArtifactTheme
  state?: Record<string, unknown>
  source?: VizualArtifactSource
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
  versions?: VizualArtifactVersion[]
  exports?: VizualExportRecord[]
}

export type VizualArtifactPatch =
  | {
      type: 'replaceSpec'
      spec: VizualSpec
      reason?: string
    }
  | {
      type: 'mergeSpec'
      spec: Partial<VizualSpec>
      reason?: string
    }
  | {
      type: 'replaceElement'
      targetId?: string
      elementId?: string
      element: VizualSpecElement
      reason?: string
    }
  | {
      type: 'updateElementProps'
      targetId?: string
      elementId?: string
      props: Record<string, unknown>
      reason?: string
    }
  | {
      type: 'changeChartType'
      targetId?: string
      elementId?: string
      chartType: string
      reason?: string
    }
  | {
      type: 'filterData'
      targetId?: string
      elementId?: string
      field: string
      values: unknown[] | unknown
      reason?: string
    }
  | {
      type: 'limitData'
      targetId?: string
      elementId?: string
      limit: number
      reason?: string
    }
  | {
      type: 'mergeState'
      state: Record<string, unknown>
      reason?: string
    }
  | {
      type: 'setTheme'
      theme: VizualArtifactTheme
      reason?: string
    }
  | {
      type: 'addExportRecord'
      export: Omit<Partial<VizualExportRecord>, 'artifactId' | 'createdAt'> & {
        format: VizualExportFormat
      }
      reason?: string
    }

let idSeq = 0

const CHART_TYPE_MAP: Record<string, string> = {
  area: 'AreaChart',
  areachart: 'AreaChart',
  bar: 'BarChart',
  barchart: 'BarChart',
  boxplot: 'BoxplotChart',
  boxplotchart: 'BoxplotChart',
  bubble: 'BubbleChart',
  bubblechart: 'BubbleChart',
  calendar: 'CalendarChart',
  calendarchart: 'CalendarChart',
  combo: 'ComboChart',
  combochart: 'ComboChart',
  dumbbell: 'DumbbellChart',
  dumbbellchart: 'DumbbellChart',
  funnel: 'FunnelChart',
  funnelchart: 'FunnelChart',
  heatmap: 'HeatmapChart',
  heatmapchart: 'HeatmapChart',
  histogram: 'HistogramChart',
  histogramchart: 'HistogramChart',
  line: 'LineChart',
  linechart: 'LineChart',
  mermaid: 'MermaidDiagram',
  mermaiddiagram: 'MermaidDiagram',
  pie: 'PieChart',
  piechart: 'PieChart',
  radar: 'RadarChart',
  radarchart: 'RadarChart',
  sankey: 'SankeyChart',
  sankeychart: 'SankeyChart',
  scatter: 'ScatterChart',
  scatterchart: 'ScatterChart',
  sparkline: 'SparklineChart',
  sparklinechart: 'SparklineChart',
  waterfall: 'WaterfallChart',
  waterfallchart: 'WaterfallChart',
  xmr: 'XmrChart',
  xmrchart: 'XmrChart',
}

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix: string) {
  idSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${idSeq.toString(36)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function cloneJson<T>(value: T): T {
  if (value == null) return value
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Fall through to JSON clone for function-free Vizual artifacts.
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function escapePointerSegment(segment: string) {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1')
}

function decodePointerSegment(segment: string) {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

function getByPointer(target: unknown, pointer: string): unknown {
  if (!pointer || pointer === '/') return target
  const parts = pointer.replace(/^\//, '').split('/').map(decodePointerSegment)
  let current: unknown = target
  for (const part of parts) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setByPointer(target: unknown, pointer: string, value: unknown) {
  if (!isRecord(target) && !Array.isArray(target)) return target
  if (!pointer || pointer === '/') return value
  const parts = pointer.replace(/^\//, '').split('/').map(decodePointerSegment)
  let current = target as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    const nextKey = parts[i + 1]
    const existing = current[key]
    if (!isRecord(existing) && !Array.isArray(existing)) {
      current[key] = /^\d+$/.test(nextKey) ? [] : {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
  return target
}

function pathJoin(...parts: Array<string | number>) {
  return `/${parts.map(part => escapePointerSegment(String(part))).join('/')}`
}

function readLabel(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback
  for (const key of ['title', 'label', 'name', 'metric', 'field', 'id']) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }
  return fallback
}

function summarizeValue(value: unknown, max = 96) {
  if (value == null) return ''
  if (typeof value === 'string') return value.length > max ? `${value.slice(0, max)}...` : value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    const text = JSON.stringify(value)
    return text.length > max ? `${text.slice(0, max)}...` : text
  } catch {
    return ''
  }
}

export function isVizualSpec(value: unknown): value is VizualSpec {
  return isRecord(value) && typeof value.root === 'string' && isRecord(value.elements)
}

export function isVizualArtifact(value: unknown): value is VizualArtifact {
  return isRecord(value) && typeof value.id === 'string' && isVizualSpec(value.spec)
}

function inferArtifactKind(spec: VizualSpec): VizualArtifactKind {
  const elements = Object.values(spec.elements || {})
  if (elements.some(element => element?.type === 'DocView')) return 'docview'
  return 'spec'
}

export function summarizeSpec(spec: VizualSpec) {
  const elements = spec.elements || {}
  return {
    root: spec.root || null,
    elementCount: Object.keys(elements).length,
    elementTypes: Object.fromEntries(
      Object.entries(elements).map(([key, element]) => [key, element?.type || null]),
    ),
  }
}

export function extractTargetMap(spec: VizualSpec): VizualTarget[] {
  const targets: VizualTarget[] = []
  const elements = spec.elements || {}

  for (const [elementId, element] of Object.entries(elements)) {
    const elementPath = pathJoin('elements', elementId)
    const propsPath = pathJoin('elements', elementId, 'props')
    const props = isRecord(element.props) ? element.props : {}
    const componentType = typeof element.type === 'string' ? element.type : 'Unknown'
    targets.push({
      id: `element:${elementId}`,
      type: 'element',
      path: elementPath,
      propsPath,
      dataPath: pathJoin('elements', elementId, 'props', 'data'),
      elementId,
      componentType,
      label: readLabel(props, elementId),
      summary: summarizeValue(props),
    })

    if (componentType === 'DocView' && Array.isArray(props.sections)) {
      props.sections.forEach((section, index) => {
        if (!isRecord(section)) return
        const sectionId = typeof section.id === 'string' && section.id
          ? section.id
          : String(index)
        const sectionPath = pathJoin('elements', elementId, 'props', 'sections', index)
        targets.push({
          id: `section:${sectionId}`,
          type: 'section',
          path: sectionPath,
          elementId,
          componentType: typeof section.type === 'string' ? section.type : 'section',
          label: readLabel(section, `Section ${index + 1}`),
          summary: summarizeValue(section.content ?? section.data ?? section.title),
          meta: { sectionId, sectionIndex: index },
        })
      })
    }

    if (componentType === 'KpiDashboard' && Array.isArray(props.metrics)) {
      props.metrics.forEach((metric, index) => {
        if (!isRecord(metric)) return
        const metricId = typeof metric.id === 'string' && metric.id ? metric.id : String(index)
        targets.push({
          id: `metric:${metricId}`,
          type: 'metric',
          path: pathJoin('elements', elementId, 'props', 'metrics', index),
          elementId,
          componentType,
          label: readLabel(metric, `Metric ${index + 1}`),
          summary: summarizeValue(metric),
          meta: { metricId, metricIndex: index },
        })
      })
    }

    if (componentType === 'DataTable' && Array.isArray(props.columns)) {
      props.columns.forEach((column, index) => {
        if (!isRecord(column)) return
        const key = typeof column.key === 'string' && column.key
          ? column.key
          : typeof column.field === 'string' && column.field
            ? column.field
            : String(index)
        targets.push({
          id: `column:${key}`,
          type: 'table-column',
          path: pathJoin('elements', elementId, 'props', 'columns', index),
          elementId,
          componentType,
          label: readLabel(column, key),
          summary: summarizeValue(column),
          meta: { columnKey: key, columnIndex: index },
        })
      })
    }
  }

  return targets
}

export function createArtifact(input: CreateVizualArtifactInput): VizualArtifact {
  const at = input.createdAt || nowIso()
  const spec = cloneJson(input.spec)
  const id = input.id || createId('viz')
  return {
    id,
    kind: input.kind || inferArtifactKind(spec),
    status: input.status || 'draft',
    spec,
    data: cloneJson(input.data),
    theme: cloneJson(input.theme),
    state: cloneJson(input.state || spec.state || {}),
    source: cloneJson(input.source),
    targetMap: extractTargetMap(spec),
    versions: cloneJson(input.versions || []),
    exports: cloneJson(input.exports || []),
    createdAt: at,
    updatedAt: input.updatedAt || at,
    metadata: cloneJson(input.metadata),
  }
}

export function normalizeArtifact(
  value: VizualSpec | VizualArtifact | CreateVizualArtifactInput,
  defaults: Partial<CreateVizualArtifactInput> = {},
): VizualArtifact {
  if (isVizualArtifact(value)) {
    const artifact = cloneJson(value)
    artifact.targetMap = extractTargetMap(artifact.spec)
    artifact.versions = artifact.versions || []
    artifact.exports = artifact.exports || []
    artifact.state = artifact.state || artifact.spec.state || {}
    artifact.updatedAt = artifact.updatedAt || nowIso()
    artifact.createdAt = artifact.createdAt || artifact.updatedAt
    artifact.kind = artifact.kind || inferArtifactKind(artifact.spec)
    artifact.status = artifact.status || 'draft'
    return artifact
  }

  if (isVizualSpec(value)) {
    return createArtifact({
      ...defaults,
      spec: value,
      kind: defaults.kind,
      status: defaults.status,
    })
  }

  if (isRecord(value) && isVizualSpec(value.spec)) {
    return createArtifact({
      ...defaults,
      ...(value as CreateVizualArtifactInput),
      spec: value.spec,
    })
  }

  throw new Error('Invalid Vizual artifact: expected a Vizual spec or artifact')
}

function snapshotVersion(artifact: VizualArtifact, patch: unknown, reason?: string): VizualArtifactVersion {
  return {
    id: createId('version'),
    artifactId: artifact.id,
    createdAt: nowIso(),
    reason,
    spec: cloneJson(artifact.spec),
    data: cloneJson(artifact.data),
    state: cloneJson(artifact.state),
    theme: cloneJson(artifact.theme),
    patch: cloneJson(patch),
  }
}

function resolveTarget(artifact: VizualArtifact, targetId?: string, elementId?: string) {
  if (elementId) {
    return artifact.targetMap.find(target => target.elementId === elementId && target.type === 'element')
      || artifact.targetMap.find(target => target.elementId === elementId)
  }
  if (!targetId) return undefined
  return artifact.targetMap.find(target => target.id === targetId)
    || artifact.targetMap.find(target => target.elementId === targetId)
}

function resolveElementId(artifact: VizualArtifact, targetId?: string, elementId?: string) {
  if (elementId) return elementId
  const target = resolveTarget(artifact, targetId)
  return target?.elementId || targetId?.replace(/^element:/, '')
}

function normalizeChartType(chartType: string) {
  const key = chartType.replace(/\s+/g, '').toLowerCase()
  return CHART_TYPE_MAP[key] || chartType
}

function patchDocViewChartSection(
  artifact: VizualArtifact,
  patch: Extract<VizualArtifactPatch, { type: 'changeChartType' }>,
) {
  if (!patch.targetId?.startsWith('section:')) return false
  const target = resolveTarget(artifact, patch.targetId)
  if (!target) return false
  const section = getByPointer(artifact.spec, target.path)
  if (!isRecord(section) || section.type !== 'chart') return false
  const data = isRecord(section.data) ? { ...section.data } : {}
  data.chartType = normalizeChartType(patch.chartType)
  setByPointer(artifact.spec, `${target.path}/data`, data)
  return true
}

function applySinglePatch(artifact: VizualArtifact, patch: VizualArtifactPatch): VizualArtifact {
  if (patch.type === 'replaceSpec') {
    artifact.spec = cloneJson(patch.spec)
    artifact.state = cloneJson(patch.spec.state || artifact.state || {})
    return artifact
  }

  if (patch.type === 'mergeSpec') {
    artifact.spec = { ...artifact.spec, ...cloneJson(patch.spec) }
    if (patch.spec.elements) {
      artifact.spec.elements = {
        ...(artifact.spec.elements || {}),
        ...cloneJson(patch.spec.elements),
      }
    }
    return artifact
  }

  if (patch.type === 'replaceElement') {
    const elementId = resolveElementId(artifact, patch.targetId, patch.elementId)
    if (!elementId) throw new Error('replaceElement requires targetId or elementId')
    artifact.spec.elements = artifact.spec.elements || {}
    artifact.spec.elements[elementId] = cloneJson(patch.element)
    return artifact
  }

  if (patch.type === 'updateElementProps') {
    const elementId = resolveElementId(artifact, patch.targetId, patch.elementId)
    if (!elementId) throw new Error('updateElementProps requires targetId or elementId')
    const element = artifact.spec.elements?.[elementId]
    if (!element) throw new Error(`Cannot find Vizual element: ${elementId}`)
    element.props = {
      ...(isRecord(element.props) ? element.props : {}),
      ...cloneJson(patch.props),
    }
    return artifact
  }

  if (patch.type === 'changeChartType') {
    if (patchDocViewChartSection(artifact, patch)) return artifact
    const elementId = resolveElementId(artifact, patch.targetId, patch.elementId)
    if (!elementId) throw new Error('changeChartType requires targetId or elementId')
    const element = artifact.spec.elements?.[elementId]
    if (!element) throw new Error(`Cannot find Vizual element: ${elementId}`)
    element.type = normalizeChartType(patch.chartType)
    return artifact
  }

  if (patch.type === 'filterData') {
    const elementId = resolveElementId(artifact, patch.targetId, patch.elementId)
    if (!elementId) throw new Error('filterData requires targetId or elementId')
    const element = artifact.spec.elements?.[elementId]
    if (!element) throw new Error(`Cannot find Vizual element: ${elementId}`)
    const props = isRecord(element.props) ? element.props : {}
    const data = Array.isArray(props.data) ? props.data : Array.isArray(artifact.data) ? artifact.data : []
    const values = Array.isArray(patch.values) ? patch.values : [patch.values]
    const nextData = data.filter(row => isRecord(row) && values.includes(row[patch.field]))
    element.props = { ...props, data: nextData }
    return artifact
  }

  if (patch.type === 'limitData') {
    const elementId = resolveElementId(artifact, patch.targetId, patch.elementId)
    if (!elementId) throw new Error('limitData requires targetId or elementId')
    const element = artifact.spec.elements?.[elementId]
    if (!element) throw new Error(`Cannot find Vizual element: ${elementId}`)
    const props = isRecord(element.props) ? element.props : {}
    const data = Array.isArray(props.data) ? props.data : []
    element.props = { ...props, data: data.slice(0, Math.max(0, patch.limit)) }
    return artifact
  }

  if (patch.type === 'mergeState') {
    artifact.state = {
      ...(artifact.state || {}),
      ...cloneJson(patch.state),
    }
    return artifact
  }

  if (patch.type === 'setTheme') {
    artifact.theme = {
      ...(artifact.theme || {}),
      ...cloneJson(patch.theme),
    }
    return artifact
  }

  if (patch.type === 'addExportRecord') {
    artifact.exports = [
      ...(artifact.exports || []),
      {
        id: patch.export.id || createId('export'),
        artifactId: artifact.id,
        createdAt: nowIso(),
        status: patch.export.status || 'requested',
        ...cloneJson(patch.export),
      },
    ]
    artifact.status = 'exported'
    return artifact
  }

  return artifact
}

export function applyArtifactPatch(
  input: VizualArtifact,
  patchOrPatches: VizualArtifactPatch | VizualArtifactPatch[],
): VizualArtifact {
  const artifact = normalizeArtifact(input)
  const patches = Array.isArray(patchOrPatches) ? patchOrPatches : [patchOrPatches]
  if (!patches.length) return artifact
  const reason = patches.map(patch => patch.reason).filter(Boolean).join('; ') || undefined
  artifact.versions = [
    ...(artifact.versions || []),
    snapshotVersion(artifact, patchOrPatches, reason),
  ]
  for (const patch of patches) {
    applySinglePatch(artifact, patch)
  }
  artifact.targetMap = extractTargetMap(artifact.spec)
  artifact.status = artifact.status === 'exported' ? 'exported' : 'updated'
  artifact.updatedAt = nowIso()
  delete artifact.lastError
  return artifact
}

export function createExportRecord(
  artifact: VizualArtifact,
  input: Omit<Partial<VizualExportRecord>, 'artifactId' | 'createdAt'> & {
    format: VizualExportFormat
  },
): VizualExportRecord {
  return {
    id: input.id || createId('export'),
    artifactId: artifact.id,
    format: input.format,
    createdAt: nowIso(),
    targetId: input.targetId,
    width: input.width,
    height: input.height,
    url: input.url,
    filename: input.filename,
    status: input.status || 'requested',
    error: input.error,
    meta: cloneJson(input.meta),
  }
}

export function markArtifactRendered(input: VizualArtifact): VizualArtifact {
  const artifact = normalizeArtifact(input)
  artifact.status = 'rendered'
  artifact.updatedAt = nowIso()
  delete artifact.lastError
  return artifact
}

export function markArtifactError(input: VizualArtifact, error: unknown): VizualArtifact {
  const artifact = normalizeArtifact(input)
  artifact.status = 'error'
  artifact.lastError = error instanceof Error ? error.message : String(error)
  artifact.updatedAt = nowIso()
  return artifact
}

export function getArtifactTarget(artifact: VizualArtifact, targetId: string): VizualTarget | undefined {
  return normalizeArtifact(artifact).targetMap.find(target => target.id === targetId)
}

export function getArtifactElement(artifact: VizualArtifact, elementIdOrTargetId: string): VizualSpecElement | undefined {
  const normalized = normalizeArtifact(artifact)
  const elementId = resolveElementId(normalized, elementIdOrTargetId)
  return elementId ? normalized.spec.elements?.[elementId] : undefined
}
