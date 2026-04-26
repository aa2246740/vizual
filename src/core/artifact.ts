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

export type VizualArtifactKind = 'spec' | 'docview' | 'liveControl' | 'interactive'
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
  | 'data-row'
  | 'chart-data-point'

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

export type VizualExportFormat = 'png' | 'pdf' | 'xlsx' | 'csv' | string

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
      spec: unknown
      reason?: string
    }
  | {
      type: 'mergeSpec'
      spec: Partial<VizualSpec>
      reason?: string
    }
  | {
      op: 'add' | 'replace' | 'remove' | 'test'
      path: string
      value?: unknown
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

function normalizeArtifactPatchPath(pointer: string) {
  let next = pointer || ''
  if (!next.startsWith('/')) next = `/${next}`
  next = next.replace(
    /^\/elements\/([^/]+)\/component(?=\/|$)/,
    (_match, elementId: string) => `/elements/${elementId}/type`,
  )
  next = next.replace(
    /^\/spec\/elements\/([^/]+)\/component(?=\/|$)/,
    (_match, elementId: string) => `/spec/elements/${elementId}/type`,
  )
  return next
}

function setByPointer(target: unknown, pointer: string, value: unknown) {
  if (!isRecord(target) && !Array.isArray(target)) return target
  if (!pointer || pointer === '/') return value
  const parts = pointer.replace(/^\//, '').split('/').map(decodePointerSegment)
  let current = target as Record<string, unknown> | unknown[]
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    const nextKey = parts[i + 1]
    const existing = (current as Record<string, unknown>)[key]
    if (!isRecord(existing) && !Array.isArray(existing)) {
      ;(current as Record<string, unknown>)[key] = /^\d+$/.test(nextKey) ? [] : {}
    }
    current = (current as Record<string, unknown>)[key] as Record<string, unknown> | unknown[]
  }
  const last = parts[parts.length - 1]
  if (Array.isArray(current)) {
    if (last === '-') current.push(value)
    else current[Number(last)] = value
  } else {
    ;(current as Record<string, unknown>)[last] = value
  }
  return target
}

function removeByPointer(target: unknown, pointer: string) {
  if (!isRecord(target) && !Array.isArray(target)) return target
  if (!pointer || pointer === '/') return undefined
  const parts = pointer.replace(/^\//, '').split('/').map(decodePointerSegment)
  let current: unknown = target
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!isRecord(current) && !Array.isArray(current)) return target
    current = (current as Record<string, unknown>)[parts[i]]
  }
  if (!isRecord(current) && !Array.isArray(current)) return target
  const last = parts[parts.length - 1]
  if (Array.isArray(current)) current.splice(Number(last), 1)
  else delete (current as Record<string, unknown>)[last]
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

function normalizeFieldList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && !!item)
  if (typeof value === 'string' && value) return [value]
  return []
}

function collectChartSeriesFields(props: Record<string, unknown>, componentType: string): string[] {
  const fields = new Set<string>()
  for (const field of normalizeFieldList(props.y)) fields.add(field)
  for (const key of ['value', 'valueField', 'low', 'high', 'size', 'label', 'dateField', 'xField', 'yField']) {
    const value = props[key]
    if (typeof value === 'string' && value) fields.add(value)
  }
  if (componentType === 'RadarChart' && Array.isArray(props.series)) {
    props.series.forEach((series, index) => {
      if (isRecord(series)) fields.add(typeof series.name === 'string' && series.name ? series.name : `series-${index}`)
    })
  }
  return Array.from(fields)
}

function isChartComponent(componentType: string) {
  return /Chart$/.test(componentType) || componentType === 'MermaidDiagram'
}

export function isVizualSpec(value: unknown): value is VizualSpec {
  return isRecord(value) && typeof value.root === 'string' && isRecord(value.elements)
}

export function isVizualArtifact(value: unknown): value is VizualArtifact {
  return isRecord(value) && typeof value.id === 'string' && isVizualSpec(value.spec)
}

function normalizeSpecElement(element: VizualSpecElement): VizualSpecElement {
  const explicitProps = isRecord(element.props) ? cloneJson(element.props) : undefined
  const rawType = typeof element.type === 'string' ? element.type : undefined
  const rawComponent = typeof element.component === 'string' ? element.component : undefined
  const mappedType = rawType ? normalizeChartType(rawType) : undefined
  const type = rawComponent || mappedType

  const structuralKeys = new Set(['type', 'component', 'props', 'children'])
  const looseProps: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(element)) {
    if (!structuralKeys.has(key)) looseProps[key] = value
  }

  const props = {
    ...(rawComponent && rawType ? { type: rawType } : {}),
    ...(!rawComponent && rawType && mappedType !== rawType ? { type: rawType } : {}),
    ...(Object.keys(looseProps).length ? looseProps : {}),
    ...(explicitProps || {}),
  }

  const normalized: VizualSpecElement = {
    ...cloneJson(element),
    ...(type ? { type } : {}),
    props,
  }
  delete normalized.component
  for (const key of Object.keys(looseProps)) delete normalized[key]
  if (Object.keys(normalized.props || {}).length === 0) delete normalized.props
  return normalized
}

function normalizeSpecShape(spec: VizualSpec): VizualSpec {
  const next = cloneJson(spec)
  if (next.elements) {
    next.elements = Object.fromEntries(
      Object.entries(next.elements).map(([elementId, element]) => [
        elementId,
        normalizeSpecElement(element),
      ]),
    )
  }
  return next
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

    if (isChartComponent(componentType)) {
      const seriesFields = collectChartSeriesFields(props, componentType)
      seriesFields.forEach((field, index) => {
        targets.push({
          id: `series:${elementId}:${field}`,
          type: 'chart-series',
          path: pathJoin('elements', elementId, 'props'),
          elementId,
          componentType,
          label: field,
          summary: `${componentType} series ${field}`,
          meta: { field, seriesIndex: index },
        })
      })

      if (Array.isArray(props.data)) {
        props.data.forEach((row, index) => {
          if (!isRecord(row)) return
          const rowPath = pathJoin('elements', elementId, 'props', 'data', index)
          targets.push({
            id: `row:${elementId}:${index}`,
            type: 'data-row',
            path: rowPath,
            elementId,
            componentType,
            label: readLabel(row, `Row ${index + 1}`),
            summary: summarizeValue(row),
            meta: { rowIndex: index },
          })
          seriesFields.forEach((field) => {
            if (!(field in row)) return
            targets.push({
              id: `point:${elementId}:${index}:${field}`,
              type: 'chart-data-point',
              path: `${rowPath}/${escapePointerSegment(field)}`,
              elementId,
              componentType,
              label: `${field} @ ${readLabel(row, `Row ${index + 1}`)}`,
              summary: summarizeValue(row[field]),
              meta: { rowIndex: index, field },
            })
          })
        })
      }
    }

    if (componentType === 'DataTable' && Array.isArray(props.columns)) {
      const columns = props.columns
        .map((column, index) => ({ column, index }))
        .filter((entry): entry is { column: Record<string, unknown>; index: number } => isRecord(entry.column))

      columns.forEach(({ column, index }) => {
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

      if (Array.isArray(props.data)) {
        props.data.forEach((row, rowIndex) => {
          if (!isRecord(row)) return
          const rowPath = pathJoin('elements', elementId, 'props', 'data', rowIndex)
          targets.push({
            id: `row:${elementId}:${rowIndex}`,
            type: 'data-row',
            path: rowPath,
            elementId,
            componentType,
            label: readLabel(row, `Row ${rowIndex + 1}`),
            summary: summarizeValue(row),
            meta: { rowIndex },
          })
          columns.forEach(({ column, index: columnIndex }) => {
            const key = typeof column.key === 'string' && column.key
              ? column.key
              : typeof column.field === 'string' && column.field
                ? column.field
                : String(columnIndex)
            targets.push({
              id: `cell:${elementId}:${rowIndex}:${key}`,
              type: 'table-cell',
              path: `${rowPath}/${escapePointerSegment(key)}`,
              elementId,
              componentType,
              label: `${readLabel(column, key)} / ${readLabel(row, `Row ${rowIndex + 1}`)}`,
              summary: summarizeValue(row[key]),
              meta: { rowIndex, columnIndex, columnKey: key },
            })
          })
        })
      }
    }
  }

  return targets
}

export function createArtifact(input: CreateVizualArtifactInput): VizualArtifact {
  const at = input.createdAt || nowIso()
  const spec = normalizeSpecShape(input.spec)
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

function findDocViewElement(spec: VizualSpec): { elementId: string; element: VizualSpecElement } | undefined {
  for (const [elementId, element] of Object.entries(spec.elements || {})) {
    if (element?.type === 'DocView') return { elementId, element }
  }
  return undefined
}

function replaceDocViewSections(spec: VizualSpec, sections: unknown[]): VizualSpec {
  const next = cloneJson(spec)
  next.elements = next.elements || {}
  const docView = findDocViewElement(next)
  if (docView) {
    docView.element.props = {
      ...(isRecord(docView.element.props) ? docView.element.props : {}),
      sections: cloneJson(sections),
    }
    next.elements[docView.elementId] = docView.element
    return next
  }
  next.root = next.root || 'doc'
  next.elements[next.root] = {
    type: 'DocView',
    props: { sections: cloneJson(sections) },
  }
  return next
}

function elementRecordToSpec(value: Record<string, unknown>): VizualSpec {
  const type = typeof value.type === 'string' ? value.type : undefined
  if (!type) throw new Error('replaceSpec element object requires a string type')
  const rawProps = isRecord(value.props) ? { ...value.props } : { ...value }
  delete rawProps.type
  delete rawProps.children
  return {
    root: 'root',
    elements: {
      root: {
        type,
        props: cloneJson(rawProps),
        children: value.children,
      },
    },
  }
}

function coerceReplacementSpec(value: unknown, artifact: VizualArtifact): VizualSpec {
  if (isVizualSpec(value)) return cloneJson(value)
  if (Array.isArray(value)) return replaceDocViewSections(artifact.spec, value)
  if (isRecord(value)) {
    if (Array.isArray(value.sections)) return replaceDocViewSections(artifact.spec, value.sections)
    if (typeof value.type === 'string') return elementRecordToSpec(value)
  }
  throw new Error('replaceSpec requires a full Vizual spec. For DocView revisions pass { sections: [...] } or updateElementProps({ sections }).')
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

function isJsonPatchOperation(
  patch: VizualArtifactPatch,
): patch is Extract<VizualArtifactPatch, { op: string }> {
  return isRecord(patch) && typeof (patch as Record<string, unknown>).op === 'string'
}

function getJsonPatchRoot(artifact: VizualArtifact, path: string): { root: unknown; pointer: string; target: 'artifact' | 'spec' } {
  const pointer = normalizeArtifactPatchPath(path)
  if (pointer === '/spec' || pointer.startsWith('/spec/')) {
    return {
      root: artifact,
      pointer,
      target: 'artifact',
    }
  }
  if (
    pointer === '/state' ||
    pointer.startsWith('/state/') ||
    pointer === '/theme' ||
    pointer.startsWith('/theme/') ||
    pointer === '/metadata' ||
    pointer.startsWith('/metadata/')
  ) {
    return {
      root: artifact,
      pointer,
      target: 'artifact',
    }
  }
  return {
    root: artifact.spec,
    pointer,
    target: 'spec',
  }
}

function applyJsonPatchOperation(
  artifact: VizualArtifact,
  patch: Extract<VizualArtifactPatch, { op: string }>,
) {
  const { root, pointer, target } = getJsonPatchRoot(artifact, patch.path)

  if (patch.op === 'test') {
    const actual = getByPointer(root, pointer)
    if (JSON.stringify(actual) !== JSON.stringify(patch.value)) {
      throw new Error(`JSON Patch test failed at ${patch.path}`)
    }
    return
  }

  if (patch.op === 'remove') {
    const nextRoot = removeByPointer(root, pointer)
    if (target === 'spec') artifact.spec = normalizeSpecShape(nextRoot as VizualSpec)
    return
  }

  if (patch.op === 'add' || patch.op === 'replace') {
    const nextRoot = setByPointer(root, pointer, cloneJson(patch.value))
    if (target === 'spec') artifact.spec = normalizeSpecShape(nextRoot as VizualSpec)
    else if (pointer === '/spec' || pointer.startsWith('/spec/')) {
      artifact.spec = normalizeSpecShape(artifact.spec)
    }
    return
  }

  throw new Error(`Unsupported JSON Patch op: ${patch.op}`)
}

function applySinglePatch(artifact: VizualArtifact, patch: VizualArtifactPatch): VizualArtifact {
  if (isJsonPatchOperation(patch)) {
    applyJsonPatchOperation(artifact, patch)
    return artifact
  }

  if (patch.type === 'replaceSpec') {
    artifact.spec = normalizeSpecShape(coerceReplacementSpec(patch.spec, artifact))
    artifact.state = cloneJson(artifact.spec.state || artifact.state || {})
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
    artifact.spec.elements[elementId] = normalizeSpecElement(patch.element)
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

  throw new Error(`Unsupported Vizual artifact patch: ${summarizeValue(patch)}`)
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
