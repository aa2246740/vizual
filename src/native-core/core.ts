import type {
  A2UIAction,
  A2UIActionResponse,
  A2UICallFunction,
  A2UIComponentDef,
  A2UIError,
  A2UIMessage,
} from '../a2ui/types'
import {
  cloneJson,
  createArtifact,
  type VizualArtifact,
  type VizualSpec,
  type VizualSpecElement,
} from '../core/artifact'
import type {
  VizualNativeAgUiEvent,
  VizualNativeComponentDef,
  VizualNativeCoreOptions,
  VizualNativeFunctionCallState,
  VizualNativeInput,
  VizualNativeMessageRole,
  VizualNativeMessageState,
  VizualNativeOperation,
  VizualNativeQualityFinding,
  VizualNativeRunState,
  VizualNativeSurfaceSnapshot,
  VizualNativeSurfaceState,
} from './types'

const A2UI_OPERATIONS_KEY = 'a2ui_operations'
const A2UI_ACTIVITY_TYPE = 'a2ui-surface'
const A2UI_MIME_TYPES = new Set(['application/a2ui+json', 'application/json+a2ui'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function normalizeActionIntent(value: unknown): { name?: string; params?: Record<string, unknown> } {
  if (typeof value === 'string' && value.trim()) return { name: value }
  if (!isRecord(value)) return {}

  const event = isRecord(value.event) ? value.event : {}
  const functionCall = isRecord(value.functionCall) ? value.functionCall : {}
  const name = firstString(
    value.action,
    value.name,
    value.type,
    event.action,
    event.name,
    event.type,
    functionCall.call,
    functionCall.name,
  )
  const params = isRecord(value.context)
    ? value.context
    : isRecord(value.params)
      ? value.params
      : isRecord(value.arguments)
        ? value.arguments
        : isRecord(event.context)
          ? event.context
          : isRecord(event.params)
            ? event.params
            : isRecord(functionCall.args)
              ? functionCall.args
              : undefined

  return { name, params }
}

function repairTrailingJsonBalance(text: string): string | null {
  const stack: string[] = []
  let inString = false
  let escaped = false
  for (const char of text) {
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{' || char === '[') stack.push(char)
    else if (char === '}' || char === ']') {
      const expected = char === '}' ? '{' : '['
      if (stack[stack.length - 1] !== expected) return null
      stack.pop()
    }
  }
  if (inString || stack.length === 0) return null
  return text + stack.reverse().map(char => char === '{' ? '}' : ']').join('')
}

function parseJsonTextCandidate(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const repaired = repairTrailingJsonBalance(text)
    if (repaired) {
      try {
        return JSON.parse(repaired)
      } catch {}
    }
    throw new Error('not json')
  }
}

function parseJsonMaybe(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  try {
    return parseJsonTextCandidate(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return parseJsonTextCandidate(trimmed.slice(start, end + 1))
      } catch {
        return value
      }
    }
    return value
  }
}

function normalizeSurfaceId(input: Record<string, unknown>, fallback = 'surface-1'): string {
  const surface = isRecord(input.surface) ? input.surface : {}
  const payload = isRecord(input.payload) ? input.payload : {}
  return firstString(
    input.surfaceId,
    surface.surfaceId,
    surface.id,
    payload.surfaceId,
    payload.id,
    input.id,
  ) ?? fallback
}

function setValueAtPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
  if (!parts.length) return
  let cursor: Record<string, unknown> | unknown[] = target
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    const nextKey = parts[i + 1]
    const existing = (cursor as Record<string, unknown>)[key]
    if (!isRecord(existing) && !Array.isArray(existing)) {
      ;(cursor as Record<string, unknown>)[key] = /^\d+$/.test(nextKey) ? [] : {}
    }
    cursor = (cursor as Record<string, unknown>)[key] as Record<string, unknown> | unknown[]
  }
  ;(cursor as Record<string, unknown>)[parts[parts.length - 1]] = value
}

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
  let cursor: unknown = obj
  for (const part of parts) {
    if (!isRecord(cursor) && !Array.isArray(cursor)) return undefined
    cursor = (cursor as any)[part]
  }
  return cursor
}

function normalizeDataModelRoot(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}
  const next: Record<string, unknown> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    if (key.startsWith('/')) setValueAtPath(next, key, entryValue)
    else next[key] = entryValue
  }
  return next
}

function normalizeLegacyDataModelValue(value: unknown): unknown {
  if (!isRecord(value)) return value
  if ('valueString' in value) return String(value.valueString ?? '')
  if ('valueInt' in value) return Number(value.valueInt)
  if ('valueDouble' in value) return Number(value.valueDouble)
  if ('valueNumber' in value) return Number(value.valueNumber)
  if ('valueBool' in value) return Boolean(value.valueBool)
  if ('valueBoolean' in value) return Boolean(value.valueBoolean)
  if (Array.isArray(value.valueList)) return value.valueList.map(normalizeLegacyDataModelValue)
  if (Array.isArray(value.valueMap)) {
    return Object.fromEntries(
      value.valueMap
        .filter(isRecord)
        .map((entry): [string, unknown] => [String(entry.key ?? ''), normalizeLegacyDataModelValue(entry)])
        .filter(([key]) => key.length > 0),
    )
  }
  return value
}

function normalizeLegacyDataModelRoot(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}
  if (!Array.isArray(value.contents)) return normalizeDataModelRoot(value)
  return Object.fromEntries(
    value.contents
      .filter(isRecord)
      .map((entry): [string, unknown] => [String(entry.key ?? ''), normalizeLegacyDataModelValue(entry)])
      .filter(([key]) => key.length > 0),
  )
}

function mergeObjects(target: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const next = { ...target }
  for (const [key, value] of Object.entries(patch)) {
    const existing = next[key]
    if (isRecord(existing) && isRecord(value)) next[key] = mergeObjects(existing, value)
    else next[key] = cloneJson(value)
  }
  return next
}

function appendValue(existing: unknown, incoming: unknown): unknown {
  if (existing == null) return cloneJson(incoming)
  if (typeof existing === 'string' && typeof incoming === 'string') return existing + incoming
  if (Array.isArray(existing)) {
    return Array.isArray(incoming) ? [...existing, ...cloneJson(incoming)] : [...existing, cloneJson(incoming)]
  }
  if (isRecord(existing) && isRecord(incoming)) return mergeObjects(existing, incoming)
  return cloneJson(incoming)
}

function resolveDynamicValue(value: unknown, dataModel: Record<string, unknown>, scopeModel?: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{path\s*:\s*([^}]+)\}/g, (_match, rawPath: string) => {
      const path = rawPath.trim()
      const resolved = path.startsWith('/')
        ? getValueAtPath(dataModel, path)
        : getValueAtPath(scopeModel ?? dataModel, path)
      if (resolved == null) return ''
      if (typeof resolved === 'string' || typeof resolved === 'number' || typeof resolved === 'boolean') return String(resolved)
      return JSON.stringify(resolved)
    })
  }
  if (value == null || typeof value !== 'object') return value
  if (isRecord(value) && 'literalString' in value) return String(value.literalString ?? '')
  if (isRecord(value) && 'literalNumber' in value) return Number(value.literalNumber)
  if (isRecord(value) && 'literalInt' in value) return Number(value.literalInt)
  if (isRecord(value) && 'literalBoolean' in value) return Boolean(value.literalBoolean)
  if (isRecord(value) && 'literalBool' in value) return Boolean(value.literalBool)
  if (isRecord(value) && 'valueString' in value) return String(value.valueString ?? '')
  if (isRecord(value) && 'valueInt' in value) return Number(value.valueInt)
  if (isRecord(value) && 'valueDouble' in value) return Number(value.valueDouble)
  if (isRecord(value) && 'valueBool' in value) return Boolean(value.valueBool)
  if (isRecord(value) && typeof value.path === 'string') {
    return value.path.startsWith('/')
      ? getValueAtPath(dataModel, value.path)
      : getValueAtPath(scopeModel ?? dataModel, value.path)
  }
  if (isRecord(value) && 'call' in value) return value
  if (Array.isArray(value)) return value.map(item => resolveDynamicValue(item, dataModel, scopeModel))

  const result: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    result[key] = resolveDynamicValue(nested, dataModel, scopeModel)
  }
  return result
}

function normalizeStatePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeDirectTableColumns(columns: unknown): unknown {
  if (!Array.isArray(columns)) return columns
  return columns.map((column, index) => {
    if (typeof column === 'string') return { key: column, label: column }
    if (!isRecord(column)) return { key: `col_${index + 1}`, label: `col_${index + 1}` }
    const key = firstString(column.key, column.field, column.accessor, column.name, column.label, column.title, column.header) ?? `col_${index + 1}`
    return {
      ...column,
      key,
      label: firstString(column.label, column.title, column.header, column.name, column.key, column.field) ?? key,
    }
  })
}

function directTextContent(element: VizualSpecElement | undefined): string {
  if (!element || !isRecord(element.props)) return ''
  const value = element.props.content ?? element.props.text ?? element.props.value ?? element.props.label ?? element.props.children
  return value == null ? '' : String(value).trim()
}

function stripVizualNamespace(value: string): string {
  return value.replace(/^Vizual[._:-]/i, '')
}

function normalizeAgentComponentName(value: string): string {
  const text = stripVizualNamespace(value).trim()
  const key = text.replace(/[\s_-]+/g, '').toLowerCase()
  const aliases: Record<string, string> = {
    board: 'Column',
    chart: 'Chart',
    area: 'AreaChart',
    areachart: 'AreaChart',
    bar: 'BarChart',
    barchart: 'BarChart',
    bubble: 'BubbleChart',
    bubblechart: 'BubbleChart',
    combo: 'ComboChart',
    combochart: 'ComboChart',
    datatable: 'DataTable',
    donut: 'PieChart',
    donutchart: 'PieChart',
    funnel: 'FunnelChart',
    funnelchart: 'FunnelChart',
    heatmap: 'HeatmapChart',
    heatmapchart: 'HeatmapChart',
    histogram: 'HistogramChart',
    histogramchart: 'HistogramChart',
    kpi: 'KpiDashboard',
    kpidashboard: 'KpiDashboard',
    line: 'LineChart',
    linechart: 'LineChart',
    markdown: 'Markdown',
    h1: 'Markdown',
    h2: 'Markdown',
    h3: 'Markdown',
    h4: 'Markdown',
    h5: 'Markdown',
    h6: 'Markdown',
    p: 'Markdown',
    paragraph: 'Markdown',
    span: 'Markdown',
    pie: 'PieChart',
    piechart: 'PieChart',
    radar: 'RadarChart',
    radarchart: 'RadarChart',
    scatter: 'ScatterChart',
    scatterchart: 'ScatterChart',
    sliderchange: 'Slider',
    sliderchanged: 'Slider',
    range: 'Slider',
    rangeslider: 'Slider',
    rangesliderinput: 'Slider',
    view: 'View',
    vizualapp: 'App',
    vizualroot: 'Column',
    vizstack: 'Column',
    waterfall: 'WaterfallChart',
    waterfallchart: 'WaterfallChart',
    hstack: 'Row',
    horizontallayout: 'Row',
    horizontalstack: 'Row',
    stackhorizontal: 'Row',
    vstack: 'Column',
    verticallayout: 'Column',
    verticalstack: 'Column',
    stackvertical: 'Column',
  }
  return aliases[key] ?? text
}

function normalizeTrend(value: string): 'up' | 'down' | 'flat' {
  if (/↓|下降|下滑|降低|回落|减少|负增长|down/i.test(value)) return 'down'
  if (/↑|上升|增长|提升|增加|环比|同比|\+/i.test(value)) return 'up'
  return 'flat'
}

function cleanTrendValue(value: string): string {
  return value.replace(/^[↑↓\s]+/u, '').trim()
}

function normalizeDirectSpecElement(element: VizualSpecElement): VizualSpecElement {
  const componentType = firstString(element.type, element.component)
  if (!componentType) return { ...element }
  const normalizedComponentType = normalizeAgentComponentName(componentType)

  const props = isRecord(element.props) ? { ...element.props } : {}
  const next: VizualSpecElement = {
    ...element,
    type: normalizedComponentType,
    props,
  }
  delete next.component

  if (next.type === 'Text' && props.content == null && props.text == null && props.value == null && props.children != null && !Array.isArray(props.children) && !isRecord(props.children)) {
    props.content = String(props.children)
    delete props.children
  }

  switch (next.type) {
    case 'App':
      next.type = 'Column'
      break
    case 'View':
    case 'Container':
      next.type = firstString(props.direction)?.toLowerCase() === 'row' ? 'Row' : 'Column'
      break
    case 'Table':
    case 'DataGrid':
      next.type = 'DataTable'
      if (props.type == null || props.type === 'data_table') props.type = 'table'
      if (props.data == null && props.rows != null) props.data = props.rows
      if (Array.isArray(props.columns)) props.columns = normalizeDirectTableColumns(props.columns)
      break
    case 'KpiCard':
    case 'MetricCard':
    case 'Metric': {
      next.type = 'KpiDashboard'
      const trendValue = props.trendValue ?? props.delta ?? props.change
      props.type = 'kpi_dashboard'
      props.columns = 1
      props.metrics = [{
        label: firstString(props.label, props.title, props.name) ?? 'KPI',
        value: props.value ?? props.current ?? '',
        suffix: firstString(props.suffix, props.unit),
        trend: props.trend === 'up' || props.trend === 'down' || props.trend === 'flat'
          ? props.trend
          : normalizeTrend(String(trendValue ?? '')),
        trendValue: trendValue == null ? undefined : String(trendValue),
        color: props.color,
      }]
      break
    }
    case 'KPIGrid':
    case 'MetricsGrid':
      next.type = 'KpiDashboard'
      props.type = 'kpi_dashboard'
      if (props.metrics == null && Array.isArray(props.items)) props.metrics = props.items
      break
  }

  normalizeNestedDataProps(next.type, props)

  return next
}

function normalizeNestedDataProps(componentType: unknown, props: Record<string, unknown>) {
  const data = isRecord(props.data) ? props.data : {}
  const copyArray = (value: unknown) => Array.isArray(value) ? cloneJson(value) : undefined

  if (props.title == null && typeof data.title === 'string') {
    props.title = data.title
  }

  if (componentType === 'KpiDashboard' && !Array.isArray(props.metrics)) {
    props.metrics =
      copyArray(data.metrics) ??
      copyArray(data.kpis) ??
      copyArray(data.items) ??
      copyArray(data.cards)
  }

  if (componentType === 'DataTable') {
    if (!Array.isArray(props.columns)) props.columns = copyArray(data.columns)
    if (!Array.isArray(props.rows)) props.rows = copyArray(data.rows)
    if (!Array.isArray(props.data) && Array.isArray(data.data)) props.data = cloneJson(data.data)
  }

  if (componentType === 'GanttChart' && !Array.isArray(props.tasks)) {
    props.tasks =
      copyArray(data.tasks) ??
      copyArray(data.items) ??
      copyArray(data.rows) ??
      copyArray(data.data)
  }

  if (componentType === 'Timeline' && !Array.isArray(props.events)) {
    props.events =
      copyArray(props.items) ??
      copyArray(data.events) ??
      copyArray(data.items) ??
      copyArray(data.timeline)
  }

  if (componentType === 'OrgChart' && !Array.isArray(props.nodes)) {
    props.nodes = copyArray(data.nodes) ?? copyArray(data.items)
  }

  if (componentType === 'List' && !Array.isArray(props.items)) {
    props.items = copyArray(data.items)
  }
}

function directInlineText(node: unknown): string {
  if (!isRecord(node)) return ''
  const componentType = stripVizualNamespace(firstString(node.component, node.type) ?? '')
  if (componentType !== 'Text') return ''
  const props = isRecord(node.props) ? node.props : node
  const value = props.content ?? props.text ?? props.value ?? props.label ?? props.children
  return value == null ? '' : String(value).trim()
}

function metricFromInlineCard(node: unknown): { label: string; value: string; trend: 'up' | 'down' | 'flat'; trendValue?: string } | null {
  if (!isRecord(node)) return null
  const componentType = stripVizualNamespace(firstString(node.component, node.type) ?? '')
  if (componentType !== 'Column' && componentType !== 'View' && componentType !== 'Card' && componentType !== 'Container') return null
  const props = isRecord(node.props) ? node.props : node
  const children = Array.isArray(props.children) ? props.children : []
  const texts = children.map(directInlineText).filter(Boolean)
  if (texts.length < 2) return null
  const valueIndex = texts.findIndex(text => /\d/.test(text))
  if (valueIndex <= 0) return null
  const label = texts[valueIndex - 1]
  const value = texts[valueIndex]
  const trendText = texts.slice(valueIndex + 1).find(text => /[↑↓+\-]|环比|同比|增长|上升|下降|下滑|pp|%/i.test(text))
  return {
    label,
    value,
    trend: normalizeTrend(trendText ?? ''),
    trendValue: trendText ? cleanTrendValue(trendText) : undefined,
  }
}

function inlineMetricsFromChildren(children: unknown): Array<{ label: string; value: string; trend: 'up' | 'down' | 'flat'; trendValue?: string }> {
  if (!Array.isArray(children)) return []
  const metrics = children.map(metricFromInlineCard).filter((metric): metric is NonNullable<ReturnType<typeof metricFromInlineCard>> => Boolean(metric))
  return metrics.length >= 2 ? metrics : []
}

function directElementId(parentId: string, index: number, node: Record<string, unknown>, usedIds: Set<string>): string {
  const props = isRecord(node.props) ? node.props : {}
  const explicit = firstString(node.id, node.key, props.id, props.key)
  const component = stripVizualNamespace(firstString(node.component, node.type) ?? 'element')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'element'
  const base = (explicit || `${parentId}-${component}-${index + 1}`)
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `${parentId}-element-${index + 1}`
  let id = base
  let suffix = 2
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  usedIds.add(id)
  return id
}

function expandDirectInlineChildren(entries: Array<[string, VizualSpecElement]>): Array<[string, VizualSpecElement]> {
  const usedIds = new Set(entries.map(([id]) => id))
  const expanded: Array<[string, VizualSpecElement]> = []

  const visit = (id: string, element: VizualSpecElement) => {
    const next = normalizeDirectSpecElement(element)
    const props = isRecord(next.props) ? { ...next.props } : {}
    next.props = props
    const children = props.children

    if (typeof props.root === 'string' && isRecord(props.elements)) {
      const nestedIdMap = new Map<string, string>()
      Object.keys(props.elements).forEach((nestedId, index) => {
        nestedIdMap.set(nestedId, directElementId(id, index, { id: `${id}-${nestedId}`, component: 'Column' }, usedIds))
      })
      const remapChildren = (value: unknown): unknown => {
        if (!Array.isArray(value)) return value
        return value.map(child => typeof child === 'string' ? nestedIdMap.get(child) ?? child : child)
      }
      Object.entries(props.elements).forEach(([nestedId, nestedElement]) => {
        if (!isRecord(nestedElement)) return
        const nestedElementId = nestedIdMap.get(nestedId)
        if (!nestedElementId) return
        const remapped = cloneJson(nestedElement) as VizualSpecElement
        remapped.children = remapChildren(remapped.children) as string[] | undefined
        if (isRecord(remapped.props)) {
          remapped.props = {
            ...remapped.props,
            children: remapChildren(remapped.props.children),
          }
        }
        visit(nestedElementId, remapped)
      })
      delete props.root
      delete props.elements
    }

    const metrics = inlineMetricsFromChildren(children)
    if (metrics.length) {
      const kpiId = directElementId(id, 0, { component: 'KpiDashboard', id: `${id}-kpi-dashboard` }, usedIds)
      delete props.children
      next.children = [kpiId]
      expanded.push([id, next])
      expanded.push([kpiId, {
        type: 'KpiDashboard',
        props: {
          type: 'kpi_dashboard',
          title: '核心指标',
          columns: Math.min(metrics.length, 4),
          metrics,
        },
      }])
      return
    }

    if (Array.isArray(children)) {
      const childIds: string[] = []
      children.forEach((child, index) => {
        if (typeof child === 'string') {
          childIds.push(child)
          return
        }
        if (!isRecord(child) || !firstString(child.component, child.type)) return
        const childId = directElementId(id, index, child, usedIds)
        childIds.push(childId)
        visit(childId, child as VizualSpecElement)
      })
      delete props.children
      if (childIds.length) next.children = childIds
    }

    expanded.push([id, next])
  }

  entries.forEach(([id, element]) => visit(id, element))
  return expanded
}

function synthesizeKpiDashboardFromTextCards(
  entries: Array<[string, VizualSpecElement]>,
): { entries: Array<[string, VizualSpecElement]>; changed: boolean } {
  if (entries.some(([, element]) => firstString(element.type, element.component) === 'KpiDashboard')) {
    return { entries, changed: false }
  }

  const groups = new Map<string, {
    index: number
    ids: Set<string>
    label?: string
    value?: string
    trendText?: string
  }>()

  entries.forEach(([id, element], index) => {
    const match = id.match(/^(kpi[-_\s]?\d+|metric[-_\s]?\d+)[-_\s]?(label|title|name|value|amount|sub|trend|delta|change)$/i)
    if (!match) return
    const groupId = match[1].replace(/\s+/g, '')
    const part = match[2].toLowerCase()
    const group = groups.get(groupId) ?? { index, ids: new Set<string>() }
    group.index = Math.min(group.index, index)
    group.ids.add(id)
    const text = directTextContent(element)
    if (!text) {
      groups.set(groupId, group)
      return
    }
    if (part === 'label' || part === 'title' || part === 'name') group.label = text
    else if (part === 'value' || part === 'amount') group.value = text
    else group.trendText = text
    groups.set(groupId, group)
  })

  const metrics = Array.from(groups.values())
    .sort((a, b) => a.index - b.index)
    .filter(group => group.label && group.value)
    .map(group => ({
      label: group.label!,
      value: group.value!,
      trend: normalizeTrend(group.trendText ?? ''),
      trendValue: group.trendText ? cleanTrendValue(group.trendText) : undefined,
    }))

  if (metrics.length < 2) return { entries, changed: false }

  const idsToRemove = new Set<string>()
  for (const group of groups.values()) {
    if (group.label && group.value) {
      group.ids.forEach(id => idsToRemove.add(id))
      idsToRemove.add(group.index >= 0 ? entries[group.index]?.[0] ?? '' : '')
    }
  }
  for (const [id] of entries) {
    if (/^kpi[-_\s]?row$|^kpi[-_\s]?grid$|^metrics[-_\s]?row$|^metrics[-_\s]?grid$/i.test(id)) idsToRemove.add(id)
    if (/^(kpi[-_\s]?\d+|metric[-_\s]?\d+)$/i.test(id)) idsToRemove.add(id)
  }
  idsToRemove.delete('')

  const firstKpiIndex = Math.min(...Array.from(groups.values()).filter(group => group.label && group.value).map(group => group.index))
  const nextEntries: Array<[string, VizualSpecElement]> = []
  let inserted = false
  entries.forEach((entry, index) => {
    const [id] = entry
    if (!inserted && index >= firstKpiIndex) {
      nextEntries.push(['kpi-dashboard', {
        type: 'KpiDashboard',
        props: {
          type: 'kpi_dashboard',
          title: '核心指标',
          columns: Math.min(metrics.length, 4),
          metrics,
        },
      }])
      inserted = true
    }
    if (!idsToRemove.has(id)) nextEntries.push(entry)
  })

  return { entries: nextEntries, changed: true }
}

function normalizeDirectSpecChildren(spec: VizualSpec, entries: Array<[string, VizualSpecElement]>): VizualSpec {
  const root = firstString(spec.root) ?? entries[0]?.[0]
  const elements = Object.fromEntries(entries)
  if (!root || !elements[root]) return { ...spec, root, elements }

  const referenced = new Set<string>()
  for (const element of Object.values(elements)) {
    if (!Array.isArray(element.children)) continue
    for (const child of element.children) {
      if (typeof child === 'string') referenced.add(child)
    }
  }

  const rootElement = elements[root]
  const existingChildren = Array.isArray(rootElement.children)
    ? rootElement.children.filter((child: unknown): child is string => typeof child === 'string' && Boolean(elements[child]))
    : []
  const hasChildren = existingChildren.length > 0
  if (!hasChildren && entries.length > 1) {
    rootElement.children = entries.map(([id]) => id).filter(id => id !== root && !referenced.has(id))
  } else if (hasChildren) {
    rootElement.children = existingChildren
  }

  return { ...spec, root, elements }
}

function normalizeDirectVizualSpec(spec: VizualSpec): VizualSpec {
  if (!spec.elements || !isRecord(spec.elements)) return spec
  const entries = expandDirectInlineChildren(
    Object.entries(spec.elements).map(([id, element]) => [id, normalizeDirectSpecElement(element)] as [string, VizualSpecElement]),
  )
  const synthesized = synthesizeKpiDashboardFromTextCards(entries)
  return normalizeDirectSpecChildren(spec, synthesized.entries)
}

function normalizeSemanticKind(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  return value.trim().replace(/[\s._:-]+/g, '').toLowerCase()
}

type SemanticTarget = {
  component: string
  propsType?: string
  patchProps?: Record<string, unknown>
}

const SEMANTIC_COMPONENT_TARGETS: Record<string, SemanticTarget> = {
  area: { component: 'AreaChart', propsType: 'area' },
  areachart: { component: 'AreaChart', propsType: 'area' },
  bar: { component: 'BarChart', propsType: 'bar' },
  barchart: { component: 'BarChart', propsType: 'bar' },
  columnchart: { component: 'BarChart', propsType: 'bar' },
  bubble: { component: 'BubbleChart', propsType: 'bubble' },
  bubblechart: { component: 'BubbleChart', propsType: 'bubble' },
  boxplot: { component: 'BoxplotChart', propsType: 'boxplot' },
  boxplotchart: { component: 'BoxplotChart', propsType: 'boxplot' },
  calendar: { component: 'CalendarChart', propsType: 'calendar' },
  calendarheatmap: { component: 'CalendarChart', propsType: 'calendar' },
  chart: { component: 'BarChart', propsType: 'bar' },
  combo: { component: 'ComboChart', propsType: 'combo' },
  combochart: { component: 'ComboChart', propsType: 'combo' },
  dualaxis: { component: 'ComboChart', propsType: 'combo' },
  dualaxischart: { component: 'ComboChart', propsType: 'combo' },
  mixed: { component: 'ComboChart', propsType: 'combo' },
  mixedchart: { component: 'ComboChart', propsType: 'combo' },
  multiaxis: { component: 'ComboChart', propsType: 'combo' },
  table: { component: 'DataTable', propsType: 'table' },
  datatable: { component: 'DataTable', propsType: 'table' },
  datagrid: { component: 'DataTable', propsType: 'table' },
  detailtable: { component: 'DataTable', propsType: 'table' },
  form: { component: 'FormBuilder', propsType: 'form_builder' },
  formbuilder: { component: 'FormBuilder', propsType: 'form_builder' },
  inputform: { component: 'FormBuilder', propsType: 'form_builder' },
  funnel: { component: 'FunnelChart', propsType: 'funnel' },
  funnelchart: { component: 'FunnelChart', propsType: 'funnel' },
  heatmap: { component: 'HeatmapChart', propsType: 'heatmap' },
  heatmapchart: { component: 'HeatmapChart', propsType: 'heatmap' },
  histogram: { component: 'HistogramChart', propsType: 'histogram' },
  histogramchart: { component: 'HistogramChart', propsType: 'histogram' },
  kpi: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  kpicard: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  kpidashboard: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  kpigrid: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  metric: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  metriccard: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  metrics: { component: 'KpiDashboard', propsType: 'kpi_dashboard' },
  line: { component: 'LineChart', propsType: 'line' },
  linechart: { component: 'LineChart', propsType: 'line' },
  markdown: { component: 'Markdown' },
  markdownview: { component: 'Markdown' },
  h1: { component: 'Markdown' },
  h2: { component: 'Markdown' },
  h3: { component: 'Markdown' },
  h4: { component: 'Markdown' },
  h5: { component: 'Markdown' },
  h6: { component: 'Markdown' },
  p: { component: 'Markdown' },
  paragraph: { component: 'Markdown' },
  span: { component: 'Markdown' },
  button: { component: 'Button' },
  checkbox: { component: 'CheckBox' },
  check: { component: 'CheckBox' },
  choice: { component: 'ChoicePicker' },
  choicepicker: { component: 'ChoicePicker' },
  select: { component: 'ChoicePicker' },
  slider: { component: 'Slider' },
  textfield: { component: 'TextField' },
  textinput: { component: 'TextField' },
  input: { component: 'TextField' },
  datetime: { component: 'DateTimeInput' },
  datetimeinput: { component: 'DateTimeInput' },
  dateinput: { component: 'DateTimeInput' },
  tabs: { component: 'Tabs' },
  tab: { component: 'Tabs' },
  image: { component: 'Image' },
  icon: { component: 'Icon' },
  divider: { component: 'Divider' },
  video: { component: 'Video' },
  audio: { component: 'AudioPlayer' },
  audioplayer: { component: 'AudioPlayer' },
  card: { component: 'Card' },
  column: { component: 'Column' },
  container: { component: 'Column' },
  herolayout: { component: 'Column' },
  list: { component: 'List' },
  pie: { component: 'PieChart', propsType: 'pie' },
  piechart: { component: 'PieChart', propsType: 'pie' },
  donut: { component: 'PieChart', propsType: 'pie', patchProps: { donut: true } },
  donutchart: { component: 'PieChart', propsType: 'pie', patchProps: { donut: true } },
  radar: { component: 'RadarChart', propsType: 'radar' },
  radarchart: { component: 'RadarChart', propsType: 'radar' },
  row: { component: 'Row' },
  sankey: { component: 'SankeyChart', propsType: 'sankey' },
  sankeychart: { component: 'SankeyChart', propsType: 'sankey' },
  scatter: { component: 'ScatterChart', propsType: 'scatter' },
  scatterchart: { component: 'ScatterChart', propsType: 'scatter' },
  sparkline: { component: 'SparklineChart', propsType: 'sparkline' },
  sparklinechart: { component: 'SparklineChart', propsType: 'sparkline' },
  text: { component: 'Text' },
  waterfall: { component: 'WaterfallChart', propsType: 'waterfall' },
  waterfallchart: { component: 'WaterfallChart', propsType: 'waterfall' },
  dumbbell: { component: 'DumbbellChart', propsType: 'dumbbell' },
  dumbbellchart: { component: 'DumbbellChart', propsType: 'dumbbell' },
  xmr: { component: 'XmrChart', propsType: 'xmr' },
  xmrchart: { component: 'XmrChart', propsType: 'xmr' },
  controlchart: { component: 'XmrChart', propsType: 'xmr' },
}

const SEMANTIC_WRAPPER_KEYS = new Set([
  'catalogId',
  'children',
  'component',
  'componentId',
  'display',
  'fallbackText',
  'id',
  'input',
  'kind',
  'parentId',
  'props',
  'requireRenderable',
  'root',
  'rootId',
  'surface',
  'surfaceId',
])

const SEMANTIC_CHILD_CONTAINER_TYPES = new Set(['Column', 'Row', 'Card'])

function semanticElementId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || `element-${index + 1}`
}

function uniqueSemanticElementId(seed: string, usedIds: Set<string>): string {
  const normalized = seed.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'element'
  if (!usedIds.has(normalized)) {
    usedIds.add(normalized)
    return normalized
  }
  for (let index = 2; ; index += 1) {
    const candidate = `${normalized}-${index}`
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate)
      return candidate
    }
  }
}

function normalizeSemanticKpiMetrics(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map(metric => {
    if (!isRecord(metric)) return metric
    const next = cloneJson(metric) as Record<string, unknown>
    const trendSource = next.trendValue ?? next.delta ?? next.change ?? next.trendLabel ?? next.growth
    if (next.trendValue == null && trendSource != null) next.trendValue = cleanTrendValue(String(trendSource))
    const trend = firstString(next.trend)
    if (trend !== 'up' && trend !== 'down' && trend !== 'flat') {
      const trendText = [trend, trendSource].filter(value => value != null).map(String).join(' ')
      if (trendText) next.trend = normalizeTrend(trendText)
    }
    if (next.suffix == null && typeof next.unit === 'string') next.suffix = next.unit
    delete next.delta
    delete next.change
    delete next.trendLabel
    delete next.growth
    delete next.unit
    return next
  })
}

function semanticChildRecords(record: Record<string, unknown>): Record<string, unknown>[] {
  const props = isRecord(record.props) ? record.props : {}
  const children = Array.isArray(record.children)
    ? record.children
    : Array.isArray(props.children)
      ? props.children
      : []
  return children.filter(isRecord)
}

function semanticPropsFromRecord(record: Record<string, unknown>, target: SemanticTarget): Record<string, unknown> {
  const props: Record<string, unknown> = isRecord(record.props) ? cloneJson(record.props) as Record<string, unknown> : {}
  const dataRecord = isRecord(record.data) ? record.data : {}
  const propsChildren = props.children
  for (const [key, value] of Object.entries(record)) {
    if (SEMANTIC_WRAPPER_KEYS.has(key)) continue
    props[key] = cloneJson(value)
  }
  delete props.children
  delete props.child
  if (target.propsType) props.type = target.propsType
  if (target.component === 'KpiDashboard') {
    if (props.title == null && typeof dataRecord.title === 'string') props.title = dataRecord.title
    if (!Array.isArray(props.metrics) && Array.isArray(dataRecord.kpis)) props.metrics = cloneJson(dataRecord.kpis)
    if (!Array.isArray(props.metrics) && Array.isArray(dataRecord.metrics)) props.metrics = cloneJson(dataRecord.metrics)
    if (!Array.isArray(props.metrics) && Array.isArray(dataRecord.items)) props.metrics = cloneJson(dataRecord.items)
    if (!Array.isArray(props.metrics) && Array.isArray(dataRecord.cards)) props.metrics = cloneJson(dataRecord.cards)
    if (!Array.isArray(props.metrics) && Array.isArray(record.kpis)) props.metrics = cloneJson(record.kpis)
    if (!Array.isArray(props.metrics) && Array.isArray(record.items)) props.metrics = cloneJson(record.items)
    if (!Array.isArray(props.metrics) && Array.isArray(record.cards)) props.metrics = cloneJson(record.cards)
    if (!Array.isArray(props.metrics) && Array.isArray(record.data)) props.metrics = cloneJson(record.data)
    props.metrics = normalizeSemanticKpiMetrics(props.metrics)
  }
  if (target.component === 'DataTable') {
    if (props.title == null && typeof dataRecord.title === 'string') props.title = dataRecord.title
    if (!Array.isArray(props.columns) && Array.isArray(dataRecord.columns)) props.columns = cloneJson(dataRecord.columns)
    if (!Array.isArray(props.rows) && Array.isArray(dataRecord.rows)) props.rows = cloneJson(dataRecord.rows)
    if (!Array.isArray(props.data) && Array.isArray(dataRecord.data)) props.data = cloneJson(dataRecord.data)
    if (!Array.isArray(props.data) && Array.isArray(record.rows)) props.data = cloneJson(record.rows)
    if (!Array.isArray(props.data) && Array.isArray(record.items)) props.data = cloneJson(record.items)
  }
  if (NATIVE_DATA_COMPONENTS.has(target.component) && target.component !== 'KpiDashboard' && target.component !== 'DataTable') {
    if (props.title == null && typeof dataRecord.title === 'string') props.title = dataRecord.title
  }
  if (target.component === 'List' && isRecord(record.data) && !Array.isArray(props.items) && Array.isArray(record.data.items)) {
    props.items = cloneJson(record.data.items)
  }
  if (target.component === 'Text' && isRecord(record.data) && props.content == null && record.data.text != null) {
    props.content = record.data.text
  }
  if (target.component === 'Text' && props.content == null && props.text == null && props.value == null && propsChildren != null && !Array.isArray(propsChildren) && !isRecord(propsChildren)) {
    props.content = String(propsChildren)
  }
  if (target.component === 'Markdown') {
    if (props.content == null && record.markdown != null) props.content = record.markdown
    if (props.content == null && record.text != null) props.content = record.text
    if (props.content == null && record.value != null) props.content = record.value
    if (props.content == null && propsChildren != null && !Array.isArray(propsChildren) && !isRecord(propsChildren)) {
      props.content = String(propsChildren)
    }
  }
  return {
    ...props,
    ...(target.patchProps ?? {}),
  }
}

function semanticTargetForRecord(record: Record<string, unknown>): SemanticTarget | null {
  const chartKind = normalizeSemanticKind(record.chartType ?? record.chart ?? record.visualization)
  if (chartKind && SEMANTIC_COMPONENT_TARGETS[chartKind]) return SEMANTIC_COMPONENT_TARGETS[chartKind]

  const componentKind = normalizeSemanticKind(record.component)
  if (componentKind === 'chart') {
    const nestedChartKind = normalizeSemanticKind(record.type ?? record.kind)
    if (nestedChartKind && SEMANTIC_COMPONENT_TARGETS[nestedChartKind]) return SEMANTIC_COMPONENT_TARGETS[nestedChartKind]
  }
  if (componentKind && SEMANTIC_COMPONENT_TARGETS[componentKind]) return SEMANTIC_COMPONENT_TARGETS[componentKind]

  const typeKind = normalizeSemanticKind(record.type ?? record.kind)
  if (typeKind && SEMANTIC_COMPONENT_TARGETS[typeKind]) return SEMANTIC_COMPONENT_TARGETS[typeKind]
  return null
}

function semanticElementFromRecord(record: Record<string, unknown>): VizualSpecElement | null {
  const target = semanticTargetForRecord(record)
  if (!target) return null
  return {
    type: target.component,
    props: semanticPropsFromRecord(record, target),
  }
}

function addSemanticRecordTree(
  record: Record<string, unknown>,
  elements: NonNullable<VizualSpec['elements']>,
  usedIds: Set<string>,
  preferredId: string,
): string | null {
  const element = semanticElementFromRecord(record)
  if (!element?.type) return null
  const id = uniqueSemanticElementId(preferredId, usedIds)
  const childIds = semanticChildRecords(record)
    .map((child, index) => {
      const childTarget = semanticTargetForRecord(child)
      const childBase = firstString(child.id, child.componentId)
        ?? semanticElementId(`${id}-${childTarget?.component ?? firstString(child.component, child.type, child.kind) ?? 'child'}`, index)
      return addSemanticRecordTree(child, elements, usedIds, childBase)
    })
    .filter((childId): childId is string => Boolean(childId))

  if (childIds.length && !SEMANTIC_CHILD_CONTAINER_TYPES.has(element.type)) {
    const contentId = uniqueSemanticElementId(`${id}-content`, usedIds)
    elements[contentId] = element
    elements[id] = {
      type: 'Column',
      props: { gap: 16 },
      children: [contentId, ...childIds],
    }
    return id
  }

  if (childIds.length) element.children = childIds
  elements[id] = element
  return id
}

function normalizeSemanticComponentTree(record: Record<string, unknown>): VizualSpec | null {
  if (!semanticElementFromRecord(record)) return null
  const elements: NonNullable<VizualSpec['elements']> = {}
  const usedIds = new Set<string>()
  const rootId = addSemanticRecordTree(record, elements, usedIds, 'root')
  if (!rootId) return null
  return {
    root: rootId,
    elements,
    state: isRecord(record.state) ? cloneJson(record.state) as Record<string, unknown> : undefined,
  }
}

function looksLikeSemanticComponentArray(value: unknown): value is Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0) return false
  return value.every(item => isRecord(item)
    && !looksLikeNativeOperation(item)
    && !looksLikeA2UIMessage(item)
    && Boolean(semanticTargetForRecord(item)))
}

function normalizeSemanticComponentArray(records: Record<string, unknown>[]): VizualSpec | null {
  const elements: NonNullable<VizualSpec['elements']> = {
    root: {
      type: 'Column',
      props: { gap: 16 },
      children: [],
    },
  }
  const usedIds = new Set<string>(['root'])
  const rootChildren = elements.root.children as string[]

  records.forEach((record, index) => {
    const target = semanticTargetForRecord(record)
    const preferredId = firstString(record.id, record.componentId)
      ?? semanticElementId(target?.component ?? firstString(record.component, record.type, record.kind) ?? 'component', index)
    const childId = addSemanticRecordTree(record, elements, usedIds, preferredId)
    if (childId) rootChildren.push(childId)
  })

  return rootChildren.length ? { root: 'root', elements } : null
}

function semanticComponentArrayFromWrapper(record: Record<string, unknown>): Record<string, unknown>[] | null {
  if (looksLikeNativeOperation(record) || looksLikeA2UIMessage(record)) return null
  const components = asRecordArray(record.components)
  if (!components.length) return null
  if (!components.every(component => Boolean(semanticTargetForRecord(component)))) return null
  return components
}

function looksLikeBareComponentRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false
  if (looksLikeNativeOperation(value) || looksLikeA2UIMessage(value)) return false
  if (!semanticTargetForRecord(value)) return false
  return Boolean(
    firstString(value.id, value.componentId)
    || firstString(value.parentId)
    || Array.isArray(value.children)
    || isRecord(value.props)
    || isRecord(value.data)
  )
}

function componentDefFromBareRecord(record: Record<string, unknown>, index: number): VizualNativeComponentDef {
  const target = semanticTargetForRecord(record)
  const component = target?.component ?? firstString(record.component, record.type) ?? 'Column'
  const id = firstString(record.id, record.componentId) ?? semanticElementId(component, index)
  const nestedProps = isRecord(record.props) ? cloneJson(record.props) as Record<string, unknown> : {}
  const next: Record<string, unknown> = {
    id,
    component,
    ...nestedProps,
  }
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id' || key === 'componentId' || key === 'component' || key === 'type' || key === 'props') continue
    next[key] = cloneJson(value)
  }
  if (target?.propsType && next.type == null) next.type = target.propsType
  if (target?.patchProps) Object.assign(next, cloneJson(target.patchProps))
  return next as VizualNativeComponentDef
}

function normalizeBareComponentTree(records: Record<string, unknown>[]): VizualNativeComponentDef[] {
  const components = records.map(componentDefFromBareRecord)
  const ids = new Set(components.map(component => component.id).filter((id): id is string => typeof id === 'string' && id.length > 0))
  const childrenByParent = new Map<string, string[]>()

  for (const component of components) {
    const parentId = firstString((component as Record<string, unknown>).parentId)
    if (!parentId || !ids.has(parentId)) continue
    const children = childrenByParent.get(parentId) ?? []
    children.push(component.id)
    childrenByParent.set(parentId, children)
  }

  for (const component of components) {
    const generatedChildren = childrenByParent.get(component.id)
    if (generatedChildren?.length && !Array.isArray(component.children)) component.children = generatedChildren
    delete (component as Record<string, unknown>).parentId
  }

  if (ids.has('root')) return components

  const explicitParentById = new Map<string, string | undefined>()
  records.forEach((record, index) => {
    const id = components[index]?.id
    if (id) explicitParentById.set(id, firstString(record.parentId))
  })
  const roots = components
    .filter(component => {
      const parentId = explicitParentById.get(component.id)
      return !parentId || !ids.has(parentId)
    })
    .map(component => component.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return [
    { id: 'root', component: 'Column', children: roots.length ? roots : components.map(component => component.id), gap: 16 },
    ...components,
  ]
}

function looksLikeBareComponentArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.length > 0 && value.every(looksLikeBareComponentRecord)
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord)
}

function normalizeSemanticDashboardSpec(record: Record<string, unknown>): VizualSpec | null {
  const children: string[] = []
  const elements: NonNullable<VizualSpec['elements']> = {
    root: {
      type: 'Column',
      props: {
        gap: typeof record.gap === 'number' ? record.gap : 16,
      },
      children,
    },
  }

  const title = firstString(record.title, record.name)
  if (title) {
    elements.title = { type: 'Text', props: { content: title, variant: 'heading' } }
    children.push('title')
  }

  const kpis = asRecordArray(record.kpis ?? record.kpi ?? record.metrics ?? record.cards)
  if (kpis.length) {
    elements.kpis = {
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        title: firstString(record.kpiTitle, record.metricsTitle) ?? '核心指标',
        columns: typeof record.kpiColumns === 'number' ? record.kpiColumns : Math.min(Math.max(kpis.length, 1), 4),
        metrics: cloneJson(kpis),
      },
    }
    children.push('kpis')
  }

  const chartInputs = [
    ...asRecordArray(record.charts),
    ...asRecordArray(record.visuals),
    ...asRecordArray(record.chart ? [record.chart] : []),
  ]
  chartInputs.forEach((chart, index) => {
    const element = semanticElementFromRecord(chart)
    if (!element) return
    const id = semanticElementId('chart', index)
    elements[id] = element
    children.push(id)
  })

  const tableInputs = [
    ...asRecordArray(record.tables),
    ...asRecordArray(record.table ? [record.table] : []),
  ]
  tableInputs.forEach((table, index) => {
    const element = semanticElementFromRecord({ type: 'table', ...table })
    if (!element) return
    const id = semanticElementId('table', index)
    elements[id] = element
    children.push(id)
  })

  const riskInputs = asRecordArray(record.risks ?? record.riskItems)
  if (riskInputs.length) {
    elements.risks = {
      type: 'DataTable',
      props: {
        type: 'table',
        title: firstString(record.riskTitle) ?? '风险提示',
        data: cloneJson(riskInputs),
      },
    }
    children.push('risks')
  }

  const actionInputs = asRecordArray(record.actions ?? record.nextActions)
  if (actionInputs.length) {
    elements.actions = {
      type: 'DataTable',
      props: {
        type: 'table',
        title: firstString(record.actionTitle) ?? '行动建议',
        data: cloneJson(actionInputs),
      },
    }
    children.push('actions')
  }

  const formInputs = [
    ...asRecordArray(record.forms),
    ...asRecordArray(record.form ? [record.form] : []),
  ]
  formInputs.forEach((form, index) => {
    const element = semanticElementFromRecord({ type: 'form', ...form })
    if (!element) return
    const id = semanticElementId('form', index)
    elements[id] = element
    children.push(id)
  })

  return children.length ? { root: 'root', elements, state: isRecord(record.state) ? cloneJson(record.state) as Record<string, unknown> : undefined } : null
}

function normalizeSemanticVizualInput(record: Record<string, unknown>): VizualSpec | null {
  const kind = normalizeSemanticKind(record.type ?? record.kind ?? record.component)
  if (kind === 'dashboard' || kind === 'businessdashboard' || kind === 'cockpit' || kind === 'controlpanel') {
    return normalizeSemanticDashboardSpec(record)
  }
  return normalizeSemanticComponentTree(record)
}

function dataBindingPathFromString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const mustache = trimmed.match(/^\{\{\s*([^}]+?)\s*\}\}$/)
  if (mustache?.[1]) return normalizeStatePath(mustache[1].trim())
  if (trimmed.startsWith('/')) return normalizeStatePath(trimmed)
  if (/^[A-Za-z_$][\w$]*(?:[./][\w$-]+)*$/.test(trimmed)) return normalizeStatePath(trimmed.replace(/\./g, '/'))
  return undefined
}

function bindingPathFromSetDataAction(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const type = firstString(value.type, value.action, value.name)
  if (type !== 'setData' && type !== 'setState') return undefined
  const path = firstString(value.path, value.statePath)
  return path ? normalizeStatePath(path) : undefined
}

function bindingExpressionForProp(component: VizualNativeComponentDef, key: string, value: unknown): Record<string, string> | null {
  const bindableProps: Record<string, Set<string>> = {
    TextField: new Set(['value']),
    Slider: new Set(['value']),
    ChoicePicker: new Set(['value']),
    CheckBox: new Set(['checked', 'value']),
    DateTimeInput: new Set(['value']),
  }
  const bindable = bindableProps[String(component.component)]
  if (!bindable?.has(key)) return null

  if (isRecord(value) && typeof value.path === 'string') {
    const onChangePath = bindingPathFromSetDataAction(component.onChange)
    if (onChangePath) return { $bindState: normalizeStatePath(value.path) }
    return null
  }
  const onChangePath = bindingPathFromSetDataAction(component.onChange)
  if (onChangePath && (key === 'value' || key === 'checked')) {
    return { $bindState: onChangePath }
  }
  return null
}

const NATIVE_DATA_COMPONENTS = new Set([
  'AreaChart',
  'BarChart',
  'BoxplotChart',
  'BubbleChart',
  'CalendarChart',
  'Chart',
  'ComboChart',
  'DataGrid',
  'DataTable',
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
  'Table',
  'WaterfallChart',
  'XmrChart',
])

function normalizeComponentDef(component: VizualNativeComponentDef): VizualNativeComponentDef {
  const record = component as Record<string, unknown>
  const componentId = firstString(component.id, record.componentId)
  const nestedComponent = isRecord(record.component)
    ? Object.entries(record.component)[0]
    : undefined
  const nestedProps = nestedComponent && isRecord(nestedComponent[1]) ? nestedComponent[1] : {}
  const wrappedProps = {
    ...nestedProps,
    ...(isRecord(record.props) ? record.props : {}),
  }
  const componentType = firstString(
    typeof component.component === 'string' ? component.component : undefined,
    typeof record.component === 'string' ? record.component : undefined,
    nestedComponent?.[0],
    record.type,
  )
  const typeIsComponentAlias = !firstString(
    typeof component.component === 'string' ? component.component : undefined,
    typeof record.component === 'string' ? record.component : undefined,
  )
    && typeof record.type === 'string'
    && record.type.trim().length > 0
  const next: VizualNativeComponentDef = {
    id: componentId ?? component.id,
    component: componentType ?? component.component,
  }

  for (const [key, value] of Object.entries(wrappedProps)) {
    if (key === 'children' || key === 'child') continue
    next[key] = value
  }
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id' || key === 'componentId' || key === 'component' || key === 'props' || key === 'children' || key === 'child') continue
    if (key === 'type' && typeIsComponentAlias) continue
    next[key] = value
  }

  const children = record.children ?? wrappedProps.children
  const componentKey = typeof componentType === 'string'
    ? stripVizualNamespace(componentType).replace(/[\s_-]+/g, '').toLowerCase()
    : ''
  if (
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'paragraph', 'span'].includes(componentKey) &&
    children != null &&
    !Array.isArray(children) &&
    !isRecord(children) &&
    next.content == null &&
    next.text == null &&
    next.value == null
  ) {
    next.content = String(children)
  }
  if (Array.isArray(children)) {
    next.children = children.filter((item): item is string => typeof item === 'string' && item.length > 0)
  } else if (isRecord(children) && Array.isArray(children.explicitList)) {
    next.children = children.explicitList.filter((item): item is string => typeof item === 'string' && item.length > 0)
  } else if (isRecord(children) && typeof children.componentId === 'string' && typeof children.path === 'string') {
    next.children = { componentId: children.componentId, path: children.path }
  } else if (isRecord(children) && isRecord(children.template)) {
    const template = children.template
    const componentId = firstString(template.componentId, template.id)
    const path = firstString(template.dataBinding, template.path)
    if (componentId && path) next.children = { componentId, path }
  }
  const child = firstString(record.child, wrappedProps.child)
  if (child) next.child = child

  const directPath = firstString(next.path)
  const dataPath = firstString(next.dataPath, next.dataKey)
  const dataBindingPath = dataBindingPathFromString(next.data)
  const optionsPath = firstString(next.optionsPath)
  const textPath = firstString(next.textPath)
  if (
    dataBindingPath &&
    NATIVE_DATA_COMPONENTS.has(String(next.component))
  ) {
    next.data = { path: dataBindingPath }
  }
  if (
    next.data == null &&
    dataPath &&
    NATIVE_DATA_COMPONENTS.has(String(next.component))
  ) {
    next.data = { path: normalizeStatePath(dataPath) }
  }
  if (next.metrics == null && dataPath && String(next.component) === 'KpiDashboard') {
    next.metrics = { path: normalizeStatePath(dataPath) }
  }
  switch (next.component) {
    case 'Text':
      if (next.content == null && next.text == null && next.value == null && directPath) next.value = { path: directPath }
      break
    case 'TextField':
    case 'Slider':
      if (next.value == null && directPath) next.value = { path: directPath }
      break
    case 'ChoicePicker':
      if (next.value == null && directPath) next.value = { path: directPath }
      if (next.options == null && optionsPath) next.options = { path: optionsPath }
      break
    case 'CheckBox':
      if (next.checked == null && directPath) next.checked = { path: directPath }
      break
    case 'Button':
      if (next.label == null && next.text == null && textPath) next.text = { path: textPath }
      else if (next.label == null && next.text == null && directPath) next.text = { path: directPath }
      break
    case 'KpiDashboard':
      if (next.metrics == null && directPath) next.metrics = { path: directPath }
      break
  }

  return normalizeComponentAlias(next)
}

function expandInlineComponentChildren(components: VizualNativeComponentDef[]): VizualNativeComponentDef[] {
  const expanded: VizualNativeComponentDef[] = []

  const visit = (component: VizualNativeComponentDef) => {
    const record = component as Record<string, unknown>
    const next: Record<string, unknown> = { ...record }
    const childComponents: VizualNativeComponentDef[] = []

    if (Array.isArray(record.children)) {
      const childIds: string[] = []
      for (const child of record.children) {
        if (typeof child === 'string' && child.length > 0) {
          childIds.push(child)
          continue
        }
        if (!isRecord(child)) continue
        const childId = firstString(child.id, child.componentId)
        const childComponent = firstString(
          typeof child.component === 'string' ? child.component : undefined,
          child.type,
        )
        if (!childId || !childComponent) continue
        childIds.push(childId)
        childComponents.push(child as unknown as VizualNativeComponentDef)
      }
      next.children = childIds
    }

    if (isRecord(record.child)) {
      const childId = firstString(record.child.id)
      const childComponent = firstString(
        typeof record.child.component === 'string' ? record.child.component : undefined,
        record.child.type,
      )
      if (childId && childComponent) {
        next.child = childId
        childComponents.push(record.child as unknown as VizualNativeComponentDef)
      }
    }

    expanded.push(next as unknown as VizualNativeComponentDef)
    childComponents.forEach(visit)
  }

  components.forEach(visit)
  return expanded
}

function normalizeComponentAlias(component: VizualNativeComponentDef): VizualNativeComponentDef {
  const next: VizualNativeComponentDef = {
    ...component,
    component: typeof component.component === 'string'
      ? normalizeAgentComponentName(component.component)
      : component.component,
  }
  switch (next.component) {
    case 'Root':
    case 'root': {
      const layout = isRecord(next.layout) ? next.layout : {}
      const layoutType = firstString(
        typeof next.layout === 'string' ? next.layout : undefined,
        layout.type,
        layout.component,
        layout.kind,
      )?.toLowerCase()
      if (layoutType === 'row') {
        next.component = 'Row'
      } else {
        next.component = 'Column'
        if (next.gap == null && typeof layout.gap === 'number') next.gap = layout.gap
      }
      delete next.layout
      break
    }
    case 'Chart': {
      const chartType = firstString(next.chartType, next.kind, next.type)?.toLowerCase()
      const chartComponentByType: Record<string, string> = {
        area: 'AreaChart',
        bar: 'BarChart',
        boxplot: 'BoxplotChart',
        box: 'BoxplotChart',
        bubble: 'BubbleChart',
        calendar: 'CalendarChart',
        calendarheatmap: 'CalendarChart',
        combo: 'ComboChart',
        mixed: 'ComboChart',
        dumbbell: 'DumbbellChart',
        funnel: 'FunnelChart',
        heatmap: 'HeatmapChart',
        histogram: 'HistogramChart',
        line: 'LineChart',
        pie: 'PieChart',
        radar: 'RadarChart',
        sankey: 'SankeyChart',
        scatter: 'ScatterChart',
        sparkline: 'SparklineChart',
        waterfall: 'WaterfallChart',
        xmr: 'XmrChart',
      }
      if (chartType === 'donut') {
        next.component = 'PieChart'
        if (next.donut == null) next.donut = true
      } else if (chartType && chartComponentByType[chartType]) next.component = chartComponentByType[chartType]
      else next.component = 'BarChart'
      delete next.chartType
      break
    }
    case 'Markdown': {
      const content = next.content ?? next.markdown ?? next.text ?? next.source ?? next.value ?? next.label ?? ''
      next.component = 'Markdown'
      delete next.markdown
      delete next.text
      delete next.source
      delete next.value
      delete next.label
      next.content = content
      break
    }
    case 'RichText': {
      const content = next.markdown ?? next.html ?? next.text ?? next.content ?? ''
      next.component = 'Markdown'
      delete next.html
      delete next.text
      delete next.markdown
      next.content = content
      break
    }
    case 'Web': {
      const source = firstString(next.source, next.url, next.href) ?? ''
      next.component = 'Markdown'
      next.content = source.startsWith('<')
        ? source
        : source
          ? `[${source}](${source})`
          : ''
      delete next.source
      delete next.url
      delete next.href
      break
    }
    case 'Lottie': {
      const url = firstString(next.url, next.src) ?? ''
      next.component = 'Text'
      next.content = url ? `Lottie: ${url}` : 'Lottie animation'
      delete next.url
      delete next.src
      break
    }
    case 'Carousel': {
      const urls = Array.isArray(next.content)
        ? next.content.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : []
      next.component = 'Markdown'
      next.content = urls.map(url => `![image](${url})`).join('\n\n')
      break
    }
    case 'Image':
      if (next.src == null && next.url != null) next.src = next.url
      if (next.alt == null && next.description != null) next.alt = next.description
      delete next.url
      delete next.description
      break
    case 'Video':
      if (next.src == null && next.url != null) next.src = next.url
      if (next.poster == null && next.posterUrl != null) next.poster = next.posterUrl
      delete next.url
      delete next.posterUrl
      break
    case 'Container': {
      const layout = isRecord(next.layout) ? next.layout : {}
      const layoutType = firstString(layout.type, layout.component, layout.kind)
      next.component = 'Column'
      if (next.gap == null && typeof layout.gap === 'number') next.gap = layout.gap
      delete next.layout
      break
    }
    case 'Table':
    case 'DataGrid':
      next.component = 'DataTable'
      if (next.data == null && next.rows != null) next.data = next.rows
      if (Array.isArray(next.columns)) {
        next.columns = next.columns.map((column, index) => {
          if (typeof column === 'string') return { key: column, label: column }
          if (!isRecord(column)) return { key: `col_${index + 1}`, label: `col_${index + 1}` }
          const key = firstString(column.key, column.field, column.accessor, column.name, column.label, column.title, column.header) ?? `col_${index + 1}`
          return {
            ...column,
            key,
            label: firstString(column.label, column.title, column.header, column.name, column.key, column.field) ?? key,
          }
        })
      }
      break
    case 'MultipleChoice':
      next.component = 'ChoicePicker'
      break
    case 'Audio':
      next.component = 'AudioPlayer'
      break
    case 'KpiCard':
    case 'MetricCard':
    case 'Metric':
      next.component = 'KpiDashboard'
      next.columns = 1
      next.metrics = [{
        label: firstString(next.label, next.title, next.name) ?? 'KPI',
        value: next.value ?? next.current ?? '',
        suffix: firstString(next.suffix, next.unit),
        trend: next.trend === 'up' || next.trend === 'down' || next.trend === 'flat' ? next.trend : 'flat',
        trendValue: next.trendValue ?? next.delta ?? next.change,
        color: next.color,
      }]
      break
    case 'KPIGrid':
    case 'MetricsGrid':
      next.component = 'KpiDashboard'
      if (next.metrics == null && Array.isArray(next.items)) next.metrics = next.items
      break
    case 'RiskList':
      next.component = 'DataTable'
      if (next.data == null && next.items != null) next.data = next.items
      if (!Array.isArray(next.columns)) {
        next.columns = [
          { key: 'level', label: '等级' },
          { key: 'topic', label: '风险点' },
          { key: 'detail', label: '说明' },
          { key: 'owner', label: '责任方' },
          { key: 'nextStep', label: '下一步' },
        ]
      }
      delete next.items
      break
    case 'ActionList':
      next.component = 'DataTable'
      if (next.data == null && next.items != null) next.data = next.items
      if (!Array.isArray(next.columns)) {
        next.columns = [
          { key: 'priority', label: '优先级' },
          { key: 'action', label: '动作' },
          { key: 'target', label: '目标' },
        ]
      }
      delete next.items
      break
    case 'OrderedList':
    case 'BulletList':
      next.component = 'List'
      break
  }

  if (next.component === 'FormBuilder') {
    const submitButton = isRecord(next.submitButton) ? next.submitButton : {}
    const submitLabel = firstString(next.submitLabel, submitButton.label, submitButton.text, next.submitText, next.buttonLabel)
    if (submitLabel) next.submitLabel = submitLabel
    delete next.submitButton
    delete next.submitText
    delete next.buttonLabel
  }

  if (next.component === 'Button') {
    if (next.label == null && next.text != null) next.label = next.text
    const actionIntent = normalizeActionIntent(next.action ?? next.onClick ?? next.onPress ?? next.onSubmit)
    if (actionIntent.name) {
      next.action = actionIntent.name
      if (actionIntent.params && Object.keys(actionIntent.params).length && next.actionParams == null) {
        next.actionParams = actionIntent.params
      }
    }
    delete next.onClick
    delete next.onPress
    delete next.onSubmit
  }

  return next
}

function normalizeActivityContent(content: unknown): Record<string, unknown> {
  const parsed = parseJsonMaybe(content)
  return isRecord(parsed) ? parsed : {}
}

function recordMimeType(record: Record<string, unknown>): string | undefined {
  const metadata = isRecord(record.metadata) ? record.metadata : {}
  return firstString(
    record.mimeType,
    record.mime_type,
    record.mediaType,
    record.media_type,
    metadata.mimeType,
    metadata.mime_type,
    metadata.mediaType,
    metadata.media_type,
  )
}

function isA2UIMimeRecord(record: Record<string, unknown>): boolean {
  const mimeType = recordMimeType(record)
  return Boolean(mimeType && A2UI_MIME_TYPES.has(mimeType))
}

function extractPayloadFromResourceRecord(record: Record<string, unknown>): unknown {
  return record.text
    ?? record.data
    ?? record.json
    ?? record.value
    ?? record.content
    ?? record.payload
}

function looksLikeA2UIMessage(value: unknown): value is A2UIMessage {
  return isRecord(value) && (
    'createSurface' in value ||
    'updateComponents' in value ||
    'updateDataModel' in value ||
    'appendDataModel' in value ||
    'deleteSurface' in value ||
    'callFunction' in value ||
    'actionResponse' in value ||
    'action' in value ||
    'userAction' in value ||
    'surfaceUpdate' in value ||
    'dataModelUpdate' in value ||
    'beginRendering' in value ||
    'updateTheme' in value ||
    'errorRecovery' in value ||
    value.type === 'createSurface' ||
    value.type === 'updateComponents' ||
    value.type === 'updateDataModel' ||
    value.type === 'appendDataModel' ||
    value.type === 'deleteSurface' ||
    value.type === 'callFunction' ||
    value.type === 'actionResponse' ||
    value.type === 'updateTheme' ||
    value.type === 'errorRecovery'
  )
}

function looksLikeNativeOperation(value: unknown): value is VizualNativeOperation {
  return isRecord(value) && typeof value.type === 'string' && value.type.includes('.')
}

function looksLikeAgUiEvent(value: unknown): value is VizualNativeAgUiEvent {
  return isRecord(value) && typeof value.type === 'string' && !looksLikeNativeOperation(value) && !looksLikeA2UIMessage(value)
}

function extractA2UIMessages(value: unknown, depth = 0): A2UIMessage[] {
  if (depth > 8) return []
  const parsed = parseJsonMaybe(value)
  if (Array.isArray(parsed)) {
    const direct = parsed.filter(looksLikeA2UIMessage)
    if (direct.length === parsed.length) return direct
    return parsed.flatMap(item => extractA2UIMessages(item, depth + 1))
  }
  if (!isRecord(parsed)) return []

  if (isA2UIMimeRecord(parsed)) {
    return extractA2UIMessages(extractPayloadFromResourceRecord(parsed), depth + 1)
  }
  if (isRecord(parsed.resource) && isA2UIMimeRecord(parsed.resource)) {
    return extractA2UIMessages(extractPayloadFromResourceRecord(parsed.resource), depth + 1)
  }

  const candidates = [
    parsed[A2UI_OPERATIONS_KEY],
    parsed.a2uiMessages,
    parsed.messages,
    parsed.operations,
    parsed.input,
    parsed.arguments,
    parsed.args,
    parsed.payload,
    parsed.result,
    parsed.output,
  ]
  for (const candidate of candidates) {
    const messages = extractA2UIMessages(candidate, depth + 1)
    if (messages.length) return messages
  }
  if (parsed.content != null) return extractA2UIMessages(parsed.content, depth + 1)
  if (looksLikeA2UIMessage(parsed)) return [parsed]
  return []
}

function applyJsonPatch(target: unknown, patch: unknown): unknown {
  if (!Array.isArray(patch)) return target
  let next = cloneJson(target)
  for (const operation of patch) {
    if (!isRecord(operation) || typeof operation.path !== 'string') continue
    const op = operation.op
    if (op !== 'add' && op !== 'replace' && op !== 'remove') continue
    next = applyPointerOperation(next, op, operation.path, operation.value)
  }
  return next
}

function applyPointerOperation(target: unknown, op: unknown, pointer: string, value: unknown): unknown {
  if (!pointer || pointer === '/') return op === 'remove' ? undefined : value
  if (!isRecord(target) && !Array.isArray(target)) return target
  const parts = pointer.replace(/^\//, '').split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
  let cursor = target as Record<string, unknown> | unknown[]
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]
    const nextKey = parts[index + 1]
    const existing = (cursor as Record<string, unknown>)[key]
    if (!isRecord(existing) && !Array.isArray(existing)) {
      ;(cursor as Record<string, unknown>)[key] = /^\d+$/.test(nextKey) ? [] : {}
    }
    cursor = (cursor as Record<string, unknown>)[key] as Record<string, unknown> | unknown[]
  }
  const last = parts[parts.length - 1]
  if (Array.isArray(cursor)) {
    if (op === 'remove') cursor.splice(Number(last), 1)
    else if (last === '-') cursor.push(value)
    else cursor[Number(last)] = value
  } else if (op === 'remove') {
    delete (cursor as Record<string, unknown>)[last]
  } else {
    ;(cursor as Record<string, unknown>)[last] = value
  }
  return target
}

function normalizeMessageShape(message: A2UIMessage, fallbackSurfaceId = 'surface-1'): A2UIMessage {
  if (
    'createSurface' in message ||
    'updateComponents' in message ||
    'updateDataModel' in message ||
    'appendDataModel' in message ||
    'deleteSurface' in message ||
    'callFunction' in message ||
    'actionResponse' in message ||
    'updateTheme' in message ||
    'errorRecovery' in message
  ) {
    return message
  }

  const record = message as unknown as Record<string, unknown>
  const payload = isRecord(record.payload) ? record.payload : {}
  const type = firstString(record.type, record.kind)
  const version = (firstString(record.version) ?? 'v0.10') as 'v0.10'
  const catalogId = firstString(record.catalogId, payload.catalogId, isRecord(record.catalog) ? record.catalog.id : undefined) ?? 'vizual'
  const surfaceId = normalizeSurfaceId(record, fallbackSurfaceId)
  const normalizeComponents = (items: unknown): A2UIComponentDef[] => {
    const rawComponents = Array.isArray(items) ? items.filter(isRecord) : []
    const hasMissingIds = rawComponents.some(component => !firstString(component.id, component.componentId))
    const components = hasMissingIds && looksLikeBareComponentArray(rawComponents)
      ? normalizeBareComponentTree(rawComponents) as A2UIComponentDef[]
      : rawComponents as A2UIComponentDef[]
    const rootId = firstString(record.rootId, payload.rootId) ?? 'root'
    if (!components.length || components.some(component => component?.id === 'root')) return components
    if (components.some(component => component?.id === rootId)) {
      return [
        { id: 'root', component: 'Column', children: [rootId], gap: 12 } as A2UIComponentDef,
        ...components,
      ]
    }
    const rootChildren = components
      .filter(component => firstString((component as Record<string, unknown>).parentId) === rootId)
      .map(component => component.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (!rootChildren.length && !components.some(component => (component as Record<string, unknown>).parentId != null) && rootId === 'root') {
      const childIds = components.map(component => component.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
      return childIds.length
        ? [
            { id: 'root', component: 'Column', children: childIds, gap: 12 } as A2UIComponentDef,
            ...components,
          ]
        : components
    }
    const childIds = rootChildren.length
      ? rootChildren
      : components.map(component => component.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
    const syntheticRoot = { id: rootId, component: 'Column', children: childIds, gap: 12 } as A2UIComponentDef
    return rootId === 'root'
      ? [syntheticRoot, ...components]
      : [
          { id: 'root', component: 'Column', children: [rootId], gap: 12 } as A2UIComponentDef,
          syntheticRoot,
          ...components,
        ]
  }

  switch (type) {
    case 'createSurface':
      return {
        version,
        createSurface: {
          surfaceId,
          catalogId,
          ...(isRecord(record.theme) ? { theme: record.theme } : isRecord(payload.theme) ? { theme: payload.theme } : {}),
        },
      }
    case 'updateComponents':
      return {
        version,
        updateComponents: {
          surfaceId,
          components: normalizeComponents(record.components ?? payload.components),
        },
      }
    case 'updateDataModel':
    case 'appendDataModel': {
      const value = record.value
        ?? (isRecord(record.dataModel) ? record.dataModel : undefined)
        ?? (isRecord(record.data) ? record.data : undefined)
        ?? payload.value
        ?? (isRecord(payload.dataModel) ? payload.dataModel : undefined)
        ?? (isRecord(payload.data) ? payload.data : undefined)
        ?? payload
      if (type === 'appendDataModel') {
        return {
          version,
          appendDataModel: {
            surfaceId,
            path: firstString(record.path, payload.path) ?? '/',
            value,
          },
        }
      }
      return {
        version,
        updateDataModel: {
          surfaceId,
          path: firstString(record.path, payload.path) ?? '/',
          value,
        },
      }
    }
    case 'deleteSurface':
      return { version, deleteSurface: { surfaceId } }
    case 'callFunction':
      return {
        version,
        functionCallId: firstString(record.functionCallId, payload.functionCallId),
        callFunction: {
          surfaceId,
          functionName: firstString(record.functionName, payload.functionName, record.name, payload.name) ?? '',
          arguments: isRecord(record.arguments) ? record.arguments : isRecord(payload.arguments) ? payload.arguments : undefined,
        },
      }
    case 'actionResponse':
      return {
        version,
        actionResponse: {
          surfaceId,
          actionId: firstString(record.actionId, payload.actionId),
          status: record.status === 'error' || payload.status === 'error'
            ? 'error'
            : record.status === 'cancelled' || payload.status === 'cancelled'
              ? 'cancelled'
              : 'success',
          result: record.result ?? payload.result,
          error: firstString(record.error, payload.error),
        },
      }
    case 'updateTheme':
      return {
        version,
        updateTheme: {
          surfaceId,
          theme: isRecord(record.theme) ? record.theme : isRecord(payload.theme) ? payload.theme : {},
        },
      }
    case 'errorRecovery': {
      const action = firstString(record.action, payload.action)
      return {
        version,
        errorRecovery: {
          surfaceId,
          action: action === 'fallback' || action === 'reset' ? action : 'retry',
          payload: record.recoveryPayload ?? record.fallback ?? record.spec ?? payload.payload ?? payload.fallback ?? payload.spec,
        },
      }
    }
    default:
      return message
  }
}

function a2uiMessageToOperations(message: A2UIMessage, fallbackSurfaceId: string): VizualNativeOperation[] {
  const record = message as unknown as Record<string, unknown>
  if (isRecord(record.surfaceUpdate)) {
    const surfaceId = normalizeSurfaceId(record.surfaceUpdate, fallbackSurfaceId)
    return [
      { type: 'surface.create', surfaceId, catalogId: firstString(record.surfaceUpdate.catalogId) ?? 'a2ui-legacy', raw: message },
      {
        type: 'surface.updateComponents',
        surfaceId,
        components: Array.isArray(record.surfaceUpdate.components)
          ? record.surfaceUpdate.components as VizualNativeComponentDef[]
          : [],
        raw: message,
      },
    ]
  }
  if (isRecord(record.dataModelUpdate)) {
    const payload = record.dataModelUpdate
    const surfaceId = normalizeSurfaceId(payload, fallbackSurfaceId)
    return [{
      type: 'surface.updateData',
      surfaceId,
      path: firstString(payload.path) ?? '/',
      value: normalizeLegacyDataModelRoot(payload),
      raw: message,
    }]
  }
  if (isRecord(record.beginRendering)) {
    const payload = record.beginRendering
    return [{
      type: 'surface.create',
      surfaceId: normalizeSurfaceId(payload, fallbackSurfaceId),
      catalogId: firstString(payload.catalogId) ?? 'a2ui-legacy',
      raw: message,
    }]
  }
  const action = isRecord(record.action) ? record.action : isRecord(record.userAction) ? record.userAction : null
  if (action) {
    const surfaceId = normalizeSurfaceId(action, fallbackSurfaceId)
    return [{
      type: 'action.emit',
      action: {
        name: firstString(action.name, action.type) ?? 'action',
        surfaceId,
        sourceComponentId: firstString(action.sourceComponentId, action.componentId),
        context: isRecord(action.context) ? action.context : undefined,
      },
      raw: message,
    }]
  }
  const normalized = normalizeMessageShape(message, fallbackSurfaceId)
  if ('createSurface' in normalized) {
    return [{ type: 'surface.create', ...normalized.createSurface, raw: normalized }]
  }
  if ('updateComponents' in normalized) {
    return [{ type: 'surface.updateComponents', ...normalized.updateComponents, raw: normalized }]
  }
  if ('updateDataModel' in normalized) {
    return [{ type: 'surface.updateData', ...normalized.updateDataModel, raw: normalized }]
  }
  if ('appendDataModel' in normalized) {
    const payload = (normalized as any).appendDataModel
    return [{ type: 'surface.appendData', ...payload, raw: normalized }]
  }
  if ('deleteSurface' in normalized) {
    return [{ type: 'surface.delete', surfaceId: normalized.deleteSurface.surfaceId, raw: normalized }]
  }
  if ('callFunction' in normalized) {
    return [{
      type: 'function.call',
      id: (normalized as { functionCallId?: string }).functionCallId,
      ...normalized.callFunction,
      raw: normalized,
    }]
  }
  if ('actionResponse' in normalized) {
    return [{
      type: 'function.result',
      id: (normalized as { actionId?: string }).actionId ?? normalized.actionResponse.actionId,
      ...normalized.actionResponse,
      raw: normalized,
    }]
  }
  if ('updateTheme' in normalized) {
    return [{ type: 'theme.update', ...normalized.updateTheme, raw: normalized }]
  }
  if ('errorRecovery' in normalized) {
    return [{ type: 'surface.recovery', ...normalized.errorRecovery, raw: normalized }]
  }
  return []
}

function looksLikeRenderableNestedInput(value: unknown): boolean {
  const parsed = parseJsonMaybe(value)
  if (Array.isArray(parsed)) {
    if (looksLikeBareComponentArray(parsed) || looksLikeSemanticComponentArray(parsed)) return true
    return parsed.some(item => looksLikeNativeOperation(item) || looksLikeA2UIMessage(item))
  }
  if (!isRecord(parsed)) return false
  if (looksLikeNativeOperation(parsed) || looksLikeA2UIMessage(parsed) || 'elements' in parsed) return true
  if (semanticComponentArrayFromWrapper(parsed)) return true
  return false
}

function extractRenderableToolPayload(record: Record<string, unknown>, depth = 0): unknown | null {
  if (depth > 4) return null
  const candidates = [
    record.input,
    record.arguments,
    record.args,
    record.payload,
    record.result,
    record.output,
  ]
  for (const candidate of candidates) {
    if (candidate == null) continue
    const parsed = parseJsonMaybe(candidate)
    if (looksLikeRenderableNestedInput(parsed)) return parsed
    if (isRecord(parsed)) {
      const nested = extractRenderableToolPayload(parsed, depth + 1)
      if (nested) return nested
    }
  }
  return null
}

export class VizualNativeCore {
  private surfaces = new Map<string, VizualNativeSurfaceState>()
  private artifacts = new Map<string, VizualArtifact>()
  private options: VizualNativeCoreOptions
  private actionSubscribers = new Set<(action: A2UIAction) => void>()
  private activityContent = new Map<string, Record<string, unknown>>()
  private aguiEventLog: VizualNativeAgUiEvent[] = []
  private nativeOperationLog: VizualNativeOperation[] = []
  private qualityFindings: VizualNativeQualityFinding[] = []
  private runState: Record<string, unknown> = {}
  private runs = new Map<string, VizualNativeRunState>()
  private functionCalls = new Map<string, VizualNativeFunctionCallState>()
  private messages = new Map<string, VizualNativeMessageState>()
  private aguiToolArgBuffers = new Map<string, {
    toolCallId: string
    toolCallName: string
    parentMessageId?: string
    argsText: string
  }>()

  constructor(options: VizualNativeCoreOptions = {}) {
    this.options = options
  }

  dispatch(input: VizualNativeInput, surfaceId = 'surface-1'): VizualNativeSurfaceSnapshot | null {
    const parsedInput = parseJsonMaybe(input)
    if (parsedInput !== input) return this.dispatch(parsedInput as VizualNativeInput, surfaceId)
    if (Array.isArray(input)) {
      if (looksLikeBareComponentArray(input)) {
        return this.reduceOperations([
          { type: 'surface.create', surfaceId, catalogId: 'vizual', raw: input },
          { type: 'surface.updateComponents', surfaceId, components: normalizeBareComponentTree(input), raw: input },
        ])
      }
      if (looksLikeSemanticComponentArray(input)) {
        const semanticSpec = normalizeSemanticComponentArray(input)
        if (semanticSpec) {
          return this.reduceOperation({
            type: 'artifact.ingest',
            surfaceId,
            catalogId: 'vizual',
            spec: normalizeDirectVizualSpec(semanticSpec),
            raw: input,
          })
        }
      }
      let lastSnapshot: VizualNativeSurfaceSnapshot | null = null
      for (const item of input) {
        const snapshot = this.dispatch(item as VizualNativeInput, surfaceId)
        if (snapshot) lastSnapshot = snapshot
      }
      return lastSnapshot
    }
    if (looksLikeNativeOperation(input)) return this.reduceOperation(input)
    if (isRecord(input) && looksLikeA2UIMessage(input)) {
      return this.reduceOperations(a2uiMessageToOperations(input as A2UIMessage, this.defaultSurfaceId()))
    }
    if (isRecord(input) && 'elements' in input) {
      return this.reduceOperation({ type: 'artifact.ingest', surfaceId, catalogId: 'vizual', spec: normalizeDirectVizualSpec(input as VizualSpec), raw: input })
    }
    if (isRecord(input)) {
      const nestedRenderablePayload = extractRenderableToolPayload(input)
      if (nestedRenderablePayload) {
        return this.dispatch(nestedRenderablePayload as VizualNativeInput, normalizeSurfaceId(input, surfaceId))
      }
      const wrappedComponents = semanticComponentArrayFromWrapper(input)
      if (wrappedComponents) {
        const semanticSpec = normalizeSemanticComponentArray(wrappedComponents)
        if (semanticSpec) {
          return this.reduceOperation({
            type: 'artifact.ingest',
            surfaceId: normalizeSurfaceId(input, surfaceId),
            catalogId: firstString(input.catalogId) ?? 'vizual',
            spec: normalizeDirectVizualSpec({
              ...semanticSpec,
              state: isRecord(input.state) ? cloneJson(input.state) as Record<string, unknown> : semanticSpec.state,
            }),
            raw: input,
          })
        }
      }
      const semanticSpec = normalizeSemanticVizualInput(input)
      if (semanticSpec) {
        return this.reduceOperation({
          type: 'artifact.ingest',
          surfaceId: normalizeSurfaceId(input, surfaceId),
          catalogId: firstString(input.catalogId) ?? 'vizual',
          spec: normalizeDirectVizualSpec(semanticSpec),
          raw: input,
        })
      }
    }
    if (looksLikeAgUiEvent(input)) return this.processAgUiEventNative(input)
    return null
  }

  dispatchAll(inputs: VizualNativeInput[], surfaceId = 'surface-1'): VizualNativeSurfaceSnapshot | null {
    return this.dispatch(inputs, surfaceId)
  }

  process(input: VizualNativeInput, surfaceId = 'surface-1'): VizualNativeSurfaceSnapshot | null {
    return this.dispatch(input, surfaceId)
  }

  processA2UIMessage(message: A2UIMessage): VizualNativeSurfaceSnapshot | null {
    return this.dispatch(message)
  }

  processA2UIMessages(messages: A2UIMessage[]): VizualNativeSurfaceSnapshot | null {
    return this.dispatch(messages)
  }

  processAGUIEvent(event: VizualNativeAgUiEvent): VizualNativeSurfaceSnapshot | null {
    return this.dispatch(event)
  }

  processAGUIEvents(events: VizualNativeAgUiEvent[]): VizualNativeSurfaceSnapshot | null {
    let lastSnapshot: VizualNativeSurfaceSnapshot | null = null
    for (const event of events) {
      const snapshot = this.processAGUIEvent(event)
      if (snapshot) lastSnapshot = snapshot
    }
    return lastSnapshot
  }

  processVizualSpec(surfaceId: string, spec: VizualSpec, catalogId = 'vizual'): VizualNativeSurfaceSnapshot {
    return this.reduceOperation({ type: 'artifact.ingest', surfaceId, catalogId, spec: normalizeDirectVizualSpec(spec) })!
  }

  getSpec(surfaceId: string): VizualSpec | null {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return null
    return surface.spec ?? this.buildSpec(surface)
  }

  getArtifact(surfaceId: string): VizualArtifact | null {
    return this.artifacts.get(surfaceId) ?? null
  }

  getDataModel(surfaceId: string): Record<string, unknown> | null {
    return this.surfaces.get(surfaceId)?.dataModel ?? null
  }

  getTheme(surfaceId: string): Record<string, unknown> | null {
    return this.surfaces.get(surfaceId)?.theme ?? null
  }

  getError(surfaceId: string): A2UIError | undefined {
    return this.surfaces.get(surfaceId)?.error
  }

  getSurfaceIds(): string[] {
    return Array.from(this.surfaces.keys())
  }

  hasSurface(surfaceId: string): boolean {
    return this.surfaces.has(surfaceId)
  }

  getEventLog(): VizualNativeAgUiEvent[] {
    return cloneJson(this.aguiEventLog)
  }

  getNativeOperationLog(): VizualNativeOperation[] {
    return cloneJson(this.nativeOperationLog)
  }

  getRunState(): Record<string, unknown> {
    return cloneJson(this.runState)
  }

  getRuns(): VizualNativeRunState[] {
    return cloneJson(Array.from(this.runs.values()))
  }

  getFunctionCalls(): VizualNativeFunctionCallState[] {
    return cloneJson(Array.from(this.functionCalls.values()))
  }

  getMessages(): VizualNativeMessageState[] {
    return cloneJson(Array.from(this.messages.values()))
  }

  getQualityFindings(): VizualNativeQualityFinding[] {
    return cloneJson(this.qualityFindings)
  }

  reportQualityFinding(input: Omit<VizualNativeQualityFinding, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): VizualNativeQualityFinding {
    this.reduceOperation({ type: 'quality.report', finding: input })
    return this.qualityFindings[this.qualityFindings.length - 1]
  }

  createActionFromVizual(actionName: string, surfaceId: string, params: Record<string, unknown>): A2UIAction {
    const action: A2UIAction = {
      name: actionName,
      surfaceId,
      sourceComponentId: params._sourceComponentId as string | undefined,
      context: params,
    }
    this.reduceOperation({ type: 'action.emit', action })
    return action
  }

  onAction(handler: (action: A2UIAction) => void): () => void {
    this.actionSubscribers.add(handler)
    return () => this.actionSubscribers.delete(handler)
  }

  updateSurfaceDataModel(surfaceId: string, path: string, value: unknown): VizualNativeSurfaceSnapshot | null {
    return this.reduceOperation({ type: 'surface.updateData', surfaceId, path, value })
  }

  resetSurface(surfaceId: string): VizualNativeSurfaceSnapshot | null {
    return this.reduceOperation({ type: 'surface.reset', surfaceId })
  }

  private defaultSurfaceId(): string {
    const surfaceIds = this.getSurfaceIds()
    return surfaceIds.length === 1 ? surfaceIds[0] : 'surface-1'
  }

  private reduceOperations(operations: VizualNativeOperation[]): VizualNativeSurfaceSnapshot | null {
    let lastSnapshot: VizualNativeSurfaceSnapshot | null = null
    for (const operation of operations) {
      const snapshot = this.reduceOperation(operation)
      if (snapshot) lastSnapshot = snapshot
    }
    return lastSnapshot
  }

  private reduceOperation(operation: VizualNativeOperation): VizualNativeSurfaceSnapshot | null {
    this.nativeOperationLog.push(cloneJson(operation))
    try {
      switch (operation.type) {
        case 'run.started':
          return this.handleRunStarted(operation)
        case 'run.finished':
          return this.handleRunFinished(operation)
        case 'run.stateSnapshot':
          this.runState = cloneJson(operation.snapshot)
          return null
        case 'run.stateDelta':
          this.runState = isRecord(this.runState)
            ? applyJsonPatch(this.runState, operation.delta) as Record<string, unknown>
            : {}
          return null
        case 'message.started':
          return this.handleMessageStarted(operation)
        case 'message.delta':
          return this.handleMessageDelta(operation)
        case 'message.finished':
          return this.handleMessageFinished(operation)
        case 'messages.snapshot':
          return this.handleMessagesSnapshot(operation)
        case 'surface.create':
          return this.handleCreateSurface(operation)
        case 'surface.updateComponents':
          return this.handleUpdateComponents(operation)
        case 'surface.updateData':
          return this.handleUpdateDataModel(operation)
        case 'surface.appendData':
          return this.handleAppendDataModel(operation)
        case 'surface.delete':
          return this.handleDeleteSurface(operation.surfaceId)
        case 'surface.reset':
          return this.handleResetSurface(operation.surfaceId)
        case 'surface.recovery':
          return this.handleErrorRecovery(operation)
        case 'theme.update':
          return this.handleUpdateTheme(operation)
        case 'function.call':
          return this.handleFunctionCall(operation)
        case 'function.result':
          return this.handleFunctionResult(operation)
        case 'action.emit':
          return this.handleActionEmit(operation.action)
        case 'quality.report':
          this.handleQualityReport(operation.finding)
          return null
        case 'artifact.ingest':
          return this.handleArtifactIngest(operation)
        case 'error.report':
          this.emitError(operation.error)
          return null
      }
    } catch (error) {
      this.emitError({
        surfaceId: this.guessSurfaceId(operation),
        phase: 'update',
        message: error instanceof Error ? error.message : String(error),
        recoverable: true,
        timestamp: Date.now(),
      })
      return null
    }
  }

  private processAgUiEventNative(event: VizualNativeAgUiEvent): VizualNativeSurfaceSnapshot | null {
    this.aguiEventLog.push(cloneJson(event))

    if (event.type === 'TEXT_MESSAGE_START') {
      const messageId = firstString(event.messageId)
      if (!messageId) return null
      return this.reduceOperation({ type: 'message.started', id: messageId, role: firstString(event.role) as VizualNativeMessageRole | undefined, name: firstString(event.name), raw: event })
    }
    if (event.type === 'TEXT_MESSAGE_CONTENT') {
      const messageId = firstString(event.messageId)
      if (!messageId) return null
      return this.reduceOperation({ type: 'message.delta', id: messageId, delta: typeof event.delta === 'string' ? event.delta : '', raw: event })
    }
    if (event.type === 'TEXT_MESSAGE_END') {
      const messageId = firstString(event.messageId)
      if (!messageId) return null
      return this.reduceOperation({ type: 'message.finished', id: messageId, raw: event })
    }
    if (event.type === 'TEXT_MESSAGE_CHUNK') {
      const messageId = firstString(event.messageId) ?? `message-${this.messages.size + 1}`
      return this.reduceOperation({
        type: 'message.delta',
        id: messageId,
        role: firstString(event.role) as VizualNativeMessageRole | undefined,
        name: firstString(event.name),
        delta: typeof event.delta === 'string' ? event.delta : '',
        raw: event,
      })
    }
    if (event.type === 'REASONING_START' || event.type === 'REASONING_MESSAGE_START') {
      const messageId = firstString(event.messageId) ?? `reasoning-${this.messages.size + 1}`
      return this.reduceOperation({ type: 'message.started', id: messageId, role: 'reasoning', raw: event })
    }
    if (event.type === 'REASONING_MESSAGE_CONTENT' || event.type === 'REASONING_MESSAGE_CHUNK') {
      const messageId = firstString(event.messageId) ?? `reasoning-${this.messages.size + 1}`
      return this.reduceOperation({ type: 'message.delta', id: messageId, role: 'reasoning', delta: typeof event.delta === 'string' ? event.delta : '', raw: event })
    }
    if (event.type === 'REASONING_MESSAGE_END' || event.type === 'REASONING_END') {
      const messageId = firstString(event.messageId)
      if (!messageId) return null
      return this.reduceOperation({ type: 'message.finished', id: messageId, raw: event })
    }
    if (event.type === 'THINKING_START' || event.type === 'THINKING_TEXT_MESSAGE_START') {
      const messageId = `thinking-${this.messages.size + 1}`
      return this.reduceOperation({ type: 'message.started', id: messageId, role: 'reasoning', name: firstString(event.title), raw: event })
    }
    if (event.type === 'THINKING_TEXT_MESSAGE_CONTENT') {
      const lastThinking = Array.from(this.messages.values()).reverse().find(message => message.id.startsWith('thinking-') && message.status === 'streaming')
      return this.reduceOperation({ type: 'message.delta', id: lastThinking?.id ?? `thinking-${this.messages.size + 1}`, role: 'reasoning', delta: typeof event.delta === 'string' ? event.delta : '', raw: event })
    }
    if (event.type === 'THINKING_END' || event.type === 'THINKING_TEXT_MESSAGE_END') {
      const lastThinking = Array.from(this.messages.values()).reverse().find(message => message.id.startsWith('thinking-') && message.status === 'streaming')
      return lastThinking ? this.reduceOperation({ type: 'message.finished', id: lastThinking.id, raw: event }) : null
    }
    if (event.type === 'MESSAGES_SNAPSHOT') {
      const messages = Array.isArray(event.messages)
        ? event.messages.filter(isRecord).map(message => this.normalizeAgUiMessage(message))
        : []
      return this.reduceOperation({ type: 'messages.snapshot', messages, raw: event })
    }
    if (event.type === 'TOOL_CALL_START') {
      const toolCallId = firstString(event.toolCallId)
      const toolCallName = firstString(event.toolCallName) ?? ''
      if (!toolCallId) return null
      this.aguiToolArgBuffers.set(toolCallId, {
        toolCallId,
        toolCallName,
        parentMessageId: firstString(event.parentMessageId),
        argsText: '',
      })
      return this.reduceOperation({ type: 'function.call', id: toolCallId, functionName: toolCallName, raw: event })
    }
    if (event.type === 'TOOL_CALL_ARGS' || event.type === 'TOOL_CALL_CHUNK') {
      const toolCallId = firstString(event.toolCallId)
      if (!toolCallId) return null
      const existing = this.aguiToolArgBuffers.get(toolCallId) ?? {
        toolCallId,
        toolCallName: firstString(event.toolCallName) ?? '',
        parentMessageId: firstString(event.parentMessageId),
        argsText: '',
      }
      existing.argsText += typeof event.delta === 'string' ? event.delta : ''
      if (event.toolCallName) existing.toolCallName = firstString(event.toolCallName) ?? existing.toolCallName
      this.aguiToolArgBuffers.set(toolCallId, existing)
      return null
    }
    if (event.type === 'TOOL_CALL_END') {
      return this.handleAgUiToolCallEnd(event)
    }
    if (event.type === 'RUN_STARTED') {
      return this.reduceOperation({ type: 'run.started', runId: firstString(event.runId), timestamp: event.timestamp, raw: event })
    }
    if (event.type === 'RUN_FINISHED') {
      return this.reduceOperation({ type: 'run.finished', runId: firstString(event.runId), status: 'completed', timestamp: event.timestamp, raw: event })
    }
    if (event.type === 'RUN_ERROR') {
      return this.reduceOperation({ type: 'run.finished', runId: firstString(event.runId), status: 'failed', error: firstString(event.error, event.message), timestamp: event.timestamp, raw: event })
    }
    if (event.type === 'STATE_SNAPSHOT') {
      return this.reduceOperation({ type: 'run.stateSnapshot', snapshot: isRecord(event.snapshot) ? cloneJson(event.snapshot) : {}, raw: event })
    }
    if (event.type === 'STATE_DELTA') {
      return this.reduceOperation({ type: 'run.stateDelta', delta: event.delta, raw: event })
    }
    if (event.type === 'ACTIVITY_SNAPSHOT') {
      const content = normalizeActivityContent(event.content)
      const messageId = firstString(event.messageId) ?? `activity-${this.aguiEventLog.length}`
      if (event.activityType === A2UI_ACTIVITY_TYPE || extractA2UIMessages(content).length) {
        this.activityContent.set(messageId, content)
        return this.dispatch(extractA2UIMessages(content))
      }
      return null
    }
    if (event.type === 'ACTIVITY_DELTA') {
      const messageId = firstString(event.messageId)
      if (!messageId) return null
      const previous = this.activityContent.get(messageId) ?? {}
      const next = applyJsonPatch(previous, event.patch)
      const content = normalizeActivityContent(next)
      this.activityContent.set(messageId, content)
      return this.dispatch(extractA2UIMessages(content))
    }
    if (event.type === 'TOOL_CALL_RESULT') {
      const messages = extractA2UIMessages(event.content)
      const toolCallId = firstString(event.toolCallId)
      if (toolCallId) {
        this.reduceOperation({
          type: 'function.result',
          id: toolCallId,
          status: 'success',
          result: parseJsonMaybe(event.content),
          raw: event,
        })
      }
      return messages.length ? this.dispatch(messages) : null
    }
    if (event.type === 'RAW') {
      const messages = extractA2UIMessages(event.event)
      return messages.length ? this.dispatch(messages) : null
    }
    if (event.type === 'CUSTOM') {
      const messages = extractA2UIMessages(event.value)
      return messages.length ? this.dispatch(messages) : null
    }
    return null
  }

  private normalizeAgUiMessage(message: Record<string, unknown>): VizualNativeMessageState {
    const now = Date.now()
    return {
      id: firstString(message.id) ?? `message-${this.messages.size + 1}`,
      role: (firstString(message.role) ?? 'assistant') as VizualNativeMessageRole,
      name: firstString(message.name),
      content: message.content,
      activityType: firstString(message.activityType),
      toolCallId: firstString(message.toolCallId),
      status: 'complete',
      raw: message,
      createdAt: now,
      updatedAt: now,
    }
  }

  private handleAgUiToolCallEnd(event: VizualNativeAgUiEvent): VizualNativeSurfaceSnapshot | null {
    const toolCallId = firstString(event.toolCallId)
    if (!toolCallId) return null
    const buffered = this.aguiToolArgBuffers.get(toolCallId)
    if (!buffered) return null
    const parsedArgs = parseJsonMaybe(buffered.argsText)
    const args = isRecord(parsedArgs) ? parsedArgs : {}
    const existing = this.functionCalls.get(toolCallId)
    this.functionCalls.set(toolCallId, {
      id: toolCallId,
      functionName: buffered.toolCallName,
      arguments: args,
      status: existing?.status ?? 'pending',
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    })
    const messages = extractA2UIMessages(args)
    const renderToolMessages = messages.length ? messages : this.a2uiMessagesFromRenderToolArgs(args)
    this.aguiToolArgBuffers.delete(toolCallId)
    return renderToolMessages.length ? this.dispatch(renderToolMessages) : null
  }

  private a2uiMessagesFromRenderToolArgs(args: Record<string, unknown>): A2UIMessage[] {
    const nestedInput = isRecord(args.input)
      ? args.input
      : isRecord(args.arguments)
        ? args.arguments
        : isRecord(args.args)
          ? args.args
          : isRecord(args.payload)
            ? args.payload
            : {}
    const surfaceId = firstString(args.surfaceId, args.surface_id, args.id, nestedInput.surfaceId, nestedInput.surface_id, nestedInput.id) ?? this.defaultSurfaceId()
    const components = Array.isArray(args.components)
      ? args.components.filter(isRecord)
      : Array.isArray(nestedInput.components)
        ? nestedInput.components.filter(isRecord)
        : []
    if (components.length === 0) return []
    const hasMissingIds = components.some(component => !firstString(component.id, component.componentId))
    const normalizedComponents = hasMissingIds && looksLikeBareComponentArray(components)
      ? normalizeBareComponentTree(components) as A2UIComponentDef[]
      : components as A2UIComponentDef[]
    const catalogId = this.options.defaultCatalogId ?? firstString(args.catalogId, args.catalog_id, nestedInput.catalogId, nestedInput.catalog_id) ?? 'vizual'
    const messages: A2UIMessage[] = [
      { version: 'v0.10', createSurface: { surfaceId, catalogId } } as A2UIMessage,
      { version: 'v0.10', updateComponents: { surfaceId, components: normalizedComponents } } as A2UIMessage,
    ]
    const data = isRecord(args.data) ? args.data : isRecord(nestedInput.data) ? nestedInput.data : null
    if (data) {
      messages.splice(1, 0, {
        version: 'v0.10',
        updateDataModel: { surfaceId, path: '/', value: data },
      } as A2UIMessage)
    }
    return messages
  }

  private handleRunStarted(operation: Extract<VizualNativeOperation, { type: 'run.started' }>): null {
    const runId = operation.runId ?? `run-${Date.now().toString(36)}`
    this.runs.set(runId, {
      runId,
      status: 'running',
      startedAt: operation.timestamp ?? Date.now(),
    })
    return null
  }

  private handleRunFinished(operation: Extract<VizualNativeOperation, { type: 'run.finished' }>): null {
    const runId = operation.runId ?? 'default'
    const existing = this.runs.get(runId) ?? { runId, status: 'running' as const }
    this.runs.set(runId, {
      ...existing,
      status: operation.status ?? (operation.error ? 'failed' : 'completed'),
      error: operation.error,
      finishedAt: operation.timestamp ?? Date.now(),
    })
    return null
  }

  private handleMessageStarted(operation: Extract<VizualNativeOperation, { type: 'message.started' }>): null {
    const now = Date.now()
    const existing = this.messages.get(operation.id)
    const message: VizualNativeMessageState = {
      id: operation.id,
      role: operation.role ?? existing?.role ?? 'assistant',
      name: operation.name ?? existing?.name,
      content: existing?.content ?? '',
      status: 'streaming',
      raw: operation.raw ?? existing?.raw,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    this.messages.set(operation.id, message)
    this.options.onMessage?.(message)
    return null
  }

  private handleMessageDelta(operation: Extract<VizualNativeOperation, { type: 'message.delta' }>): null {
    const id = operation.id ?? `message-${this.messages.size + 1}`
    const now = Date.now()
    const existing = this.messages.get(id)
    const previous = typeof existing?.content === 'string' ? existing.content : ''
    const message: VizualNativeMessageState = {
      id,
      role: operation.role ?? existing?.role ?? 'assistant',
      name: operation.name ?? existing?.name,
      content: `${previous}${operation.delta ?? ''}`,
      status: existing?.status ?? 'streaming',
      raw: operation.raw ?? existing?.raw,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    this.messages.set(id, message)
    this.options.onMessage?.(message)
    return null
  }

  private handleMessageFinished(operation: Extract<VizualNativeOperation, { type: 'message.finished' }>): null {
    const now = Date.now()
    const existing = this.messages.get(operation.id)
    const message: VizualNativeMessageState = {
      id: operation.id,
      role: existing?.role ?? 'assistant',
      name: existing?.name,
      content: existing?.content ?? '',
      status: 'complete',
      raw: operation.raw ?? existing?.raw,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    this.messages.set(operation.id, message)
    this.options.onMessage?.(message)
    const embedded = extractA2UIMessages(message.content)
    if (embedded.length) this.dispatch(embedded)
    return null
  }

  private handleMessagesSnapshot(operation: Extract<VizualNativeOperation, { type: 'messages.snapshot' }>): VizualNativeSurfaceSnapshot | null {
    this.messages.clear()
    let lastSnapshot: VizualNativeSurfaceSnapshot | null = null
    for (const message of operation.messages) {
      this.messages.set(message.id, message)
      this.options.onMessage?.(message)
      if (message.role === 'activity') {
        const content = normalizeActivityContent(message.content)
        this.activityContent.set(message.id, content)
        const snapshot = this.dispatch(extractA2UIMessages(content))
        if (snapshot) lastSnapshot = snapshot
      } else {
        const snapshot = this.dispatch(extractA2UIMessages(message.content))
        if (snapshot) lastSnapshot = snapshot
      }
    }
    return lastSnapshot
  }

  private handleCreateSurface(msg: { surfaceId: string; catalogId: string; theme?: Record<string, unknown> }): VizualNativeSurfaceSnapshot {
    const existing = this.surfaces.get(msg.surfaceId)
    if (existing) {
      if (existing.catalogId !== msg.catalogId) {
        this.emitError({
          surfaceId: msg.surfaceId,
          phase: 'create',
          message: `Surface ${msg.surfaceId} already exists with catalog ${existing.catalogId}; refusing to replace with catalog ${msg.catalogId}`,
          recoverable: true,
          timestamp: Date.now(),
        })
        return this.emitSnapshot(existing, existing.spec ?? this.buildSpec(existing))
      }

      if (msg.theme) {
        existing.theme = { ...existing.theme, ...msg.theme }
        existing.spec = this.buildSpec(existing)
      }
      existing.error = undefined
      return this.emitSnapshot(existing, existing.spec ?? this.buildSpec(existing))
    }

    const surface: VizualNativeSurfaceState = {
      surfaceId: msg.surfaceId,
      catalogId: msg.catalogId,
      theme: msg.theme,
      components: new Map(),
      dataModel: {},
    }
    this.surfaces.set(msg.surfaceId, surface)
    return this.emitSnapshot(surface, this.buildSpec(surface))
  }

  private handleUpdateComponents(msg: { surfaceId: string; components: VizualNativeComponentDef[] }): VizualNativeSurfaceSnapshot | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) {
      this.emitError({ surfaceId: msg.surfaceId, phase: 'update', message: `Surface ${msg.surfaceId} not found`, recoverable: true, timestamp: Date.now() })
      return null
    }

    for (const component of expandInlineComponentChildren(msg.components)) {
      const normalized = normalizeComponentDef(component)
      if (typeof normalized.id !== 'string' || normalized.id.length === 0) continue
      surface.components.set(normalized.id, normalized)
    }
    surface.error = undefined
    surface.spec = this.buildSpec(surface)
    return this.emitSnapshot(surface, surface.spec)
  }

  private handleUpdateDataModel(msg: { surfaceId: string; path?: string; value?: unknown }): VizualNativeSurfaceSnapshot | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null

    const path = msg.path ?? '/'
    if (path === '/' || path === '') {
      surface.dataModel = normalizeDataModelRoot(msg.value)
    } else if (msg.value !== undefined) {
      setValueAtPath(surface.dataModel, path, msg.value)
    } else {
      this.deleteValueAtPath(surface.dataModel, path)
    }

    surface.spec = this.buildSpec(surface)
    return this.emitSnapshot(surface, surface.spec)
  }

  private handleAppendDataModel(msg: { surfaceId: string; path?: string; value?: unknown }): VizualNativeSurfaceSnapshot | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null

    const path = msg.path ?? '/'
    if (path === '/' || path === '') {
      surface.dataModel = appendValue(surface.dataModel, normalizeDataModelRoot(msg.value)) as Record<string, unknown>
    } else {
      const existing = getValueAtPath(surface.dataModel, path)
      setValueAtPath(surface.dataModel, path, appendValue(existing, msg.value))
    }
    surface.spec = this.buildSpec(surface)
    return this.emitSnapshot(surface, surface.spec)
  }

  private deleteValueAtPath(target: Record<string, unknown>, path: string) {
    const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
    if (!parts.length) return
    let cursor: unknown = target
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (!isRecord(cursor) && !Array.isArray(cursor)) return
      cursor = (cursor as any)[parts[i]]
    }
    if (!isRecord(cursor) && !Array.isArray(cursor)) return
    const last = parts[parts.length - 1]
    if (Array.isArray(cursor) && /^\d+$/.test(last)) cursor.splice(Number(last), 1)
    else delete (cursor as Record<string, unknown>)[last]
  }

  private handleDeleteSurface(surfaceId: string): null {
    this.surfaces.delete(surfaceId)
    this.artifacts.delete(surfaceId)
    this.options.onSurfaceDelete?.(surfaceId)
    return null
  }

  private handleResetSurface(surfaceId: string): VizualNativeSurfaceSnapshot | null {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return null
    surface.components.clear()
    surface.dataModel = {}
    surface.spec = undefined
    surface.error = undefined
    return this.emitSnapshot(surface, this.buildSpec(surface))
  }

  private handleUpdateTheme(msg: { surfaceId: string; theme: Record<string, unknown> }): VizualNativeSurfaceSnapshot | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null
    surface.theme = { ...surface.theme, ...msg.theme }
    surface.spec = this.buildSpec(surface)
    return this.emitSnapshot(surface, surface.spec)
  }

  private handleErrorRecovery(msg: { surfaceId: string; action: 'retry' | 'fallback' | 'reset'; payload?: unknown }): VizualNativeSurfaceSnapshot | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null
    if (msg.action === 'reset') return this.handleResetSurface(msg.surfaceId)
    if (msg.action === 'retry') {
      surface.error = undefined
      return this.emitSnapshot(surface, surface.spec ?? this.buildSpec(surface))
    }
    if (msg.action === 'fallback' && isRecord(msg.payload) && 'elements' in msg.payload) {
      surface.error = undefined
      this.reportQualityFinding({
        surfaceId: msg.surfaceId,
        severity: 'warning',
        code: 'explicit-agent-fallback',
        message: 'Agent requested explicit fallback payload; native core did not synthesize hidden fallback content.',
      })
      surface.spec = msg.payload as VizualSpec
      return this.emitSnapshot(surface, surface.spec)
    }
    return this.emitSnapshot(surface, surface.spec ?? this.buildSpec(surface))
  }

  private handleFunctionCall(msg: { id?: string; surfaceId?: string; functionName: string; arguments?: Record<string, unknown> }): null {
    if (msg.surfaceId && !this.surfaces.has(msg.surfaceId)) {
      this.emitError({
        surfaceId: msg.surfaceId,
        phase: 'function',
        message: `Surface ${msg.surfaceId} not found for function ${msg.functionName}`,
        recoverable: true,
        timestamp: Date.now(),
      })
    }
    const id = msg.id ?? `fn-${Date.now().toString(36)}-${this.functionCalls.size + 1}`
    const call: VizualNativeFunctionCallState = {
      id,
      surfaceId: msg.surfaceId,
      functionName: msg.functionName,
      arguments: msg.arguments,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.functionCalls.set(id, call)
    this.options.onFunctionCall?.(call)
    return null
  }

  private handleFunctionResult(msg: A2UIActionResponse & { id?: string }): null {
    const id = msg.id ?? msg.actionId
    if (msg.surfaceId && !this.surfaces.has(msg.surfaceId)) {
      this.emitError({
        surfaceId: msg.surfaceId,
        phase: 'action',
        message: `Surface ${msg.surfaceId} not found for action/function response`,
        recoverable: true,
        timestamp: Date.now(),
      })
    }
    if (id) {
      const existing = this.functionCalls.get(id)
      this.functionCalls.set(id, {
        id,
        surfaceId: msg.surfaceId ?? existing?.surfaceId,
        functionName: existing?.functionName ?? '',
        arguments: existing?.arguments,
        status: msg.status,
        result: msg.result,
        error: msg.error,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      })
    }
    return null
  }

  private handleActionEmit(action: A2UIAction): null {
    this.options.onAction?.(action)
    for (const subscriber of this.actionSubscribers) {
      try {
        subscriber(action)
      } catch {
        // Subscriber failures must not break the UI event path.
      }
    }
    return null
  }

  private handleQualityReport(input: Omit<VizualNativeQualityFinding, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) {
    const finding: VizualNativeQualityFinding = {
      ...input,
      id: input.id ?? `finding-${Date.now().toString(36)}-${this.qualityFindings.length + 1}`,
      timestamp: input.timestamp ?? Date.now(),
    }
    this.qualityFindings.push(finding)
    this.options.onQualityFinding?.(finding)
  }

  private handleArtifactIngest(msg: { surfaceId: string; spec: VizualSpec; catalogId?: string }): VizualNativeSurfaceSnapshot {
    let surface = this.surfaces.get(msg.surfaceId)
    if (!surface) {
      surface = {
        surfaceId: msg.surfaceId,
        catalogId: msg.catalogId ?? 'vizual',
        components: new Map(),
        dataModel: msg.spec.state ?? {},
        spec: msg.spec,
      }
      this.surfaces.set(msg.surfaceId, surface)
    } else {
      surface.catalogId = msg.catalogId ?? surface.catalogId
      surface.dataModel = msg.spec.state ?? surface.dataModel
      surface.spec = msg.spec
    }
    return this.emitSnapshot(surface, msg.spec)
  }

  private buildSpec(surface: VizualNativeSurfaceState): VizualSpec {
    const elements: NonNullable<VizualSpec['elements']> = {}
    const rootComp = surface.components.get('root')
    if (!rootComp) return { root: 'root', elements: {}, state: surface.dataModel }

    const stateWithTheme = surface.theme
      ? { ...surface.dataModel, _a2uiTheme: surface.theme }
      : surface.dataModel

    for (const [id, component] of surface.components) {
      const props = this.resolveProps(component, surface.dataModel)
      const element: NonNullable<VizualSpec['elements']>[string] = {
        type: component.component,
        props,
      }
      if (component.component === 'Button' && typeof props.action === 'string' && props.action.length > 0) {
        element.on = {
          [props.action]: {
            action: props.action,
            ...(isRecord(props.actionParams) ? { params: props.actionParams } : {}),
          },
        }
      }
      if (Array.isArray(component.children) && component.children.length > 0) element.children = [...component.children]
      else if (isRecord(component.children)) {
        const template = surface.components.get(component.children.componentId)
        const list = getValueAtPath(surface.dataModel, component.children.path)
        if (template && Array.isArray(list)) {
          element.children = list.map((item, index) => {
            const scope = isRecord(item) ? item : { value: item }
            const virtualId = `${id}__${template.id}__${index}`
            elements[virtualId] = this.buildElementFromTemplate(template, surface.dataModel, scope)
            return virtualId
          })
        }
      }
      if (component.child) element.children = [component.child]
      elements[id] = element
    }

    return { root: 'root', elements, state: stateWithTheme }
  }

  private buildElementFromTemplate(
    component: VizualNativeComponentDef,
    dataModel: Record<string, unknown>,
    scopeModel: Record<string, unknown>,
  ): NonNullable<VizualSpec['elements']>[string] {
    const props = this.resolveProps(component, dataModel, scopeModel)
    const element: NonNullable<VizualSpec['elements']>[string] = {
      type: component.component,
      props,
    }
    if (component.component === 'Button' && typeof props.action === 'string' && props.action.length > 0) {
      element.on = { [props.action]: { action: props.action } }
    }
    return element
  }

  private resolveProps(
    component: VizualNativeComponentDef,
    dataModel: Record<string, unknown>,
    scopeModel?: Record<string, unknown>,
  ): Record<string, unknown> {
    const props: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(component)) {
      if (key === 'id' || key === 'component' || key === 'componentId' || key === 'parentId' || key === 'children' || key === 'child') continue
      props[key] = bindingExpressionForProp(component, key, value)
        ?? resolveDynamicValue(value, dataModel, scopeModel)
    }
    return props
  }

  private emitSnapshot(surface: VizualNativeSurfaceState, spec: VizualSpec): VizualNativeSurfaceSnapshot {
    surface.spec = spec
    const artifact = createArtifact({
      id: `vizual-surface-${surface.surfaceId}`,
      spec,
      data: surface.dataModel,
      state: spec.state,
      theme: surface.theme,
      metadata: {
        catalogId: surface.catalogId,
        runtime: 'vizual-native-core',
      },
    })
    this.artifacts.set(surface.surfaceId, artifact)
    const snapshot: VizualNativeSurfaceSnapshot = {
      surfaceId: surface.surfaceId,
      catalogId: surface.catalogId,
      spec,
      artifact,
      dataModel: surface.dataModel,
      theme: surface.theme,
      error: surface.error,
    }
    this.options.onSurfaceChange?.(snapshot)
    this.options.onSpecChange?.(surface.surfaceId, spec)
    this.options.onArtifactChange?.(surface.surfaceId, artifact)
    return snapshot
  }

  private emitError(error: A2UIError) {
    const surface = this.surfaces.get(error.surfaceId)
    if (surface) surface.error = error
    this.options.onError?.(error)
  }

  private guessSurfaceId(input: unknown): string {
    if (isRecord(input)) {
      if (typeof input.surfaceId === 'string') return input.surfaceId
      if (isRecord(input.error) && typeof input.error.surfaceId === 'string') return input.error.surfaceId
      if (isRecord(input.raw)) return this.guessSurfaceId(input.raw)
      for (const key of Object.keys(input)) {
        if (key === 'version') continue
        const value = input[key]
        if (isRecord(value) && typeof value.surfaceId === 'string') return value.surfaceId
      }
    }
    return ''
  }
}

export function nativeInputsToVizualSnapshot(inputs: VizualNativeInput[]): VizualNativeSurfaceSnapshot | null {
  const core = new VizualNativeCore()
  return core.dispatch(inputs)
}

export function a2uiMessagesToVizualSnapshot(messages: A2UIMessage[]): VizualNativeSurfaceSnapshot | null {
  return nativeInputsToVizualSnapshot(messages)
}
