import { assertNoCyclicChildren, withDefaultElementProps } from '../core/spec-validation'
import { normalizeVizualNativeInput, type VizualNormalizeOptions, type VizualNormalizedResult } from './normalize'
import { repairAgentInput } from './repair'
import type { VizualNativeInput } from './types'

export type VizualValidationIssue = {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  surfaceId?: string
  evidence?: unknown
  /**
   * A single concrete next action the agent should take to make the surface
   * renderable. Present on every `error` issue so weak models can self-correct
   * in one round without having to infer the fix from the message.
   */
  fix?: string
}

export type VizualValidateOptions = VizualNormalizeOptions & {
  requireRenderable?: boolean
}

export type VizualValidationResult = {
  ok: boolean
  surfaceId: string
  issues: VizualValidationIssue[]
  normalized: VizualNormalizedResult
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export const VIZUAL_RENDERABLE_COMPONENTS = [
  'AreaChart',
  'AudioPlayer',
  'BarChart',
  'BoxplotChart',
  'BubbleChart',
  'Button',
  'CalendarChart',
  'Card',
  'CheckBox',
  'ChoicePicker',
  'Column',
  'ComboChart',
  'Container',
  'DataTable',
  'DateTimeInput',
  'Divider',
  'DumbbellChart',
  'FormBuilder',
  'FunnelChart',
  'GanttChart',
  'HeatmapChart',
  'HistogramChart',
  'Icon',
  'Image',
  'KpiDashboard',
  'LineChart',
  'List',
  'Markdown',
  'MermaidDiagram',
  'OrgChart',
  'PieChart',
  'RadarChart',
  'Row',
  'SankeyChart',
  'ScatterChart',
  'Slider',
  'SparklineChart',
  'Tabs',
  'Text',
  'TextField',
  'Timeline',
  'Video',
  'WaterfallChart',
  'XmrChart',
] as const

const RENDERABLE_COMPONENTS = new Set<string>(VIZUAL_RENDERABLE_COMPONENTS)

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function parseJsonInputCandidate(input: unknown): unknown {
  if (typeof input !== 'string') return input
  const trimmed = input.trim()
  if (!trimmed || !/^[\[{]/.test(trimmed)) return input
  try {
    return JSON.parse(trimmed)
  } catch {
    return input
  }
}

function hasAnyOwn(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some(key => hasOwn(record, key))
}

function firstOwnKey(record: Record<string, unknown>, keys: string[]): string | undefined {
  return keys.find(key => hasOwn(record, key))
}

function collectOpaqueInputIssues(input: unknown, surfaceId: string): VizualValidationIssue[] {
  const candidate = parseJsonInputCandidate(input)

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim()
    if (
      /<\s*(?:!doctype|html|head|body|main|section|article|div|span|script|style|canvas|svg)\b/i.test(trimmed)
      || /\b(?:React\.createElement|export\s+default|function\s+[A-Z]\w*\s*\(|const\s+[A-Z]\w*\s*=\s*\()/i.test(trimmed)
    ) {
      return [{
        severity: 'error',
        code: 'vizual.opaque_dsl_input',
        message: 'Vizual native input cannot be raw HTML, React code, CSS, SVG, or app source. Return a native root/elements payload, supported native components, AG-UI, or A2UI messages.',
        surfaceId,
        evidence: { kind: 'raw-code-or-markup' },
        fix: 'Re-send the answer as a native component, e.g. { "components": [{ "type": "BarChart", "x": "label", "y": "value", "data": [{ "label": "A", "value": 1 }] }] }. If the user explicitly asked for an HTML page or code, answer in assistant text instead of calling this tool.',
      }]
    }
    return []
  }

  if (!isRecord(candidate)) return []

  if (Array.isArray(candidate.series) && hasAnyOwn(candidate, ['xAxis', 'yAxis', 'radar', 'angleAxis', 'radiusAxis', 'tooltip', 'legend', 'grid'])) {
    return [{
      severity: 'error',
      code: 'vizual.opaque_dsl_input',
      message: 'Vizual native input cannot be a raw ECharts option object. Use native chart components such as BarChart, LineChart, RadarChart, or ComboChart with data rows and field bindings.',
      surfaceId,
      evidence: { kind: 'echarts-option', keys: Object.keys(candidate).filter(key => ['xAxis', 'yAxis', 'series', 'tooltip', 'legend', 'grid', 'radar'].includes(key)) },
      fix: 'Convert xAxis.data into a field per row and each series into a numeric field, e.g. { "components": [{ "type": "BarChart", "x": "category", "y": ["seriesA"], "data": [{ "category": "Mon", "seriesA": 120 }] }] }. Bar/line/scatter are auto-converted when the mapping is unambiguous; radar/gauge/graph must be sent as the matching native component.',
    }]
  }

  const data = isRecord(candidate.data) ? candidate.data : {}
  if (typeof candidate.type === 'string' && Array.isArray(data.datasets) && Array.isArray(data.labels)) {
    return [{
      severity: 'error',
      code: 'vizual.opaque_dsl_input',
      message: 'Vizual native input cannot be a raw Chart.js config. Use a native chart component inside components/root/elements and provide data rows or component-local chart data.',
      surfaceId,
      evidence: { kind: 'chartjs-config', type: candidate.type },
      fix: 'Turn data.labels into a field per row and each dataset into a numeric field, e.g. { "components": [{ "type": "LineChart", "x": "category", "y": ["sales"], "data": [{ "category": "Jan", "sales": 120 }] }] }.',
    }]
  }

  const nativeHints = [
    'root',
    'elements',
    'components',
    'component',
    'createSurface',
    'updateComponents',
    'updateDataModel',
    'appendDataModel',
    'deleteSurface',
    'callFunction',
    'actionResponse',
    'updateTheme',
    'errorRecovery',
    'a2ui_operations',
    'a2uiMessages',
    'input',
    'envelope',
    'spec',
    'surfaceUpdate',
    'surfaceCreate',
  ]
  const semanticHints = ['type', 'kind', 'title', 'kpis', 'metrics', 'charts', 'visuals', 'tables', 'risks', 'actions', 'forms']
  if (hasAnyOwn(candidate, nativeHints) || hasAnyOwn(candidate, semanticHints)) return []

  const oldDslKey = firstOwnKey(candidate, ['widgets', 'layout', 'sections', 'panels', 'page', 'views', 'html', 'css'])
  if (!oldDslKey) return []

  return [{
    severity: 'error',
    code: 'vizual.opaque_dsl_input',
    message: `Vizual native input cannot be an old opaque UI DSL keyed by "${oldDslKey}". Return supported native components, a Vizual root/elements spec, AG-UI, or A2UI messages.`,
    surfaceId,
    evidence: { kind: 'old-ui-dsl', key: oldDslKey },
    fix: `Drop the "${oldDslKey}" wrapper and send native components directly, e.g. { "components": [{ "type": "DataTable", "data": [{ "name": "A", "value": 1 }] }] }.`,
  }]
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function fieldList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())
  }
  const single = stringField(value)
  return single ? [single] : []
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function rowsHaveField(rows: Array<Record<string, unknown>>, field: string): boolean {
  return rows.some(row => hasOwn(row, field))
}

function rowsHaveNumericField(rows: Array<Record<string, unknown>>, field: string): boolean {
  return rows.some(row => finiteNumber(row[field]) !== null)
}

function chartRows(props: Record<string, unknown>): Array<Record<string, unknown>> {
  return Array.isArray(props.data)
    ? props.data.filter(isRecord)
    : []
}

function pushMissingFieldIssue(
  issues: VizualValidationIssue[],
  surfaceId: string,
  chartId: string,
  componentType: string,
  field: string,
  role: string,
) {
  issues.push({
    severity: 'error',
    code: 'vizual.chart_missing_data_field',
    message: `${componentType} "${chartId}" references ${role} field "${field}", but no data row contains that field.`,
    surfaceId,
    evidence: { chartId, componentType, role, field },
    fix: `Either add a "${field}" key to every data row, or change the ${role} prop to a key that already exists in the rows. The ${role} field name must match a key in the data objects exactly.`,
  })
}

function pushNonNumericFieldIssue(
  issues: VizualValidationIssue[],
  surfaceId: string,
  chartId: string,
  componentType: string,
  field: string,
  role: string,
) {
  issues.push({
    severity: 'error',
    code: 'vizual.chart_non_numeric_data_field',
    message: `${componentType} "${chartId}" references numeric ${role} field "${field}", but no data row has a finite numeric value.`,
    surfaceId,
    evidence: { chartId, componentType, role, field },
    fix: `Make "${field}" a real number in the data rows (e.g. 1234, not "1,234" wrapped so it can't parse, and not a label). Keep category/label text in the x field, numeric measures in the y field.`,
  })
}

function numericValuesForField(rows: Array<Record<string, unknown>>, field: string): number[] {
  return rows
    .map(row => finiteNumber(row[field]))
    .filter((value): value is number => value !== null)
}

function nonZeroNumericFields(
  rows: Array<Record<string, unknown>>,
  excludedFields: Set<string>,
): Array<{ field: string; sample: number }> {
  const fields = new Map<string, number>()
  for (const row of rows) {
    for (const [field, rawValue] of Object.entries(row)) {
      if (excludedFields.has(field) || fields.has(field)) continue
      const value = finiteNumber(rawValue)
      if (value !== null && value !== 0) fields.set(field, value)
    }
  }
  return Array.from(fields.entries())
    .slice(0, 6)
    .map(([field, sample]) => ({ field, sample }))
}

function pushAllZeroFieldWarning(
  issues: VizualValidationIssue[],
  surfaceId: string,
  chartId: string,
  componentType: string,
  field: string,
  role: string,
  otherNumericFields: Array<{ field: string; sample: number }>,
) {
  issues.push({
    severity: 'warning',
    code: 'vizual.chart_all_zero_numeric_field',
    message: `${componentType} "${chartId}" references numeric ${role} field "${field}", and all parsed values are 0 while the same rows contain other non-zero numeric fields. Verify the chart is using the intended metric field.`,
    surfaceId,
    evidence: { chartId, componentType, role, field, otherNumericFields },
  })
}

function warnIfAllZeroNumericField(
  issues: VizualValidationIssue[],
  surfaceId: string,
  chartId: string,
  componentType: string,
  rows: Array<Record<string, unknown>>,
  field: string,
  role: string,
) {
  if (role === 'x') return
  const values = numericValuesForField(rows, field)
  if (!values.length || values.some(value => value !== 0)) return
  const otherNumericFields = nonZeroNumericFields(rows, new Set([field]))
  if (!otherNumericFields.length) return
  pushAllZeroFieldWarning(issues, surfaceId, chartId, componentType, field, role, otherNumericFields)
}

function requireCategoryField(
  issues: VizualValidationIssue[],
  surfaceId: string,
  chartId: string,
  componentType: string,
  rows: Array<Record<string, unknown>>,
  field: string | undefined,
  role: string,
) {
  if (!field || !rows.length) return
  if (!rowsHaveField(rows, field)) pushMissingFieldIssue(issues, surfaceId, chartId, componentType, field, role)
}

function requireNumericField(
  issues: VizualValidationIssue[],
  surfaceId: string,
  chartId: string,
  componentType: string,
  rows: Array<Record<string, unknown>>,
  field: string | undefined,
  role: string,
) {
  if (!field || !rows.length) return
  if (!rowsHaveField(rows, field)) {
    pushMissingFieldIssue(issues, surfaceId, chartId, componentType, field, role)
    return
  }
  if (!rowsHaveNumericField(rows, field)) {
    pushNonNumericFieldIssue(issues, surfaceId, chartId, componentType, field, role)
    return
  }
  warnIfAllZeroNumericField(issues, surfaceId, chartId, componentType, rows, field, role)
}

function collectChartDataIssues(spec: ReturnType<typeof withDefaultElementProps>, surfaceId: string): VizualValidationIssue[] {
  const issues: VizualValidationIssue[] = []
  const elements = spec.elements ?? {}
  for (const [chartId, element] of Object.entries(elements)) {
    const componentType = element?.type
    const props = isRecord(element?.props) ? element.props : {}
    const rows = chartRows(props)
    if (!componentType || !rows.length) continue

    const x = stringField(props.x)
    const y = fieldList(props.y)

    switch (componentType) {
      case 'AreaChart':
      case 'BarChart':
      case 'LineChart':
      case 'ComboChart':
      case 'RadarChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, x ?? 'name', 'x')
        ;(y.length ? y : ['value']).forEach(field => requireNumericField(issues, surfaceId, chartId, componentType, rows, field, 'y'))
        break
      case 'ScatterChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, x ?? 'name', 'x')
        ;(y.length ? y : ['value']).forEach(field => requireNumericField(issues, surfaceId, chartId, componentType, rows, field, 'y'))
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.size), 'size')
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.label), 'label')
        break
      case 'BubbleChart':
        requireNumericField(issues, surfaceId, chartId, componentType, rows, x ?? 'x', 'x')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, y[0] ?? 'y', 'y')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.size) ?? 'size', 'size')
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.label), 'label')
        break
      case 'CalendarChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.dateField) ?? stringField(props.date), 'date')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.valueField) ?? stringField(props.value), 'value')
        break
      case 'HeatmapChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.xField) ?? x, 'x')
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.yField) ?? y[0], 'y')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.valueField) ?? stringField(props.value), 'value')
        break
      case 'PieChart':
      case 'FunnelChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.label) ?? x, 'label')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.value) ?? y[0], 'value')
        break
      case 'WaterfallChart':
      case 'XmrChart':
      case 'SparklineChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, x ?? stringField(props.label), 'x')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, y[0] ?? stringField(props.value), 'value')
        break
      case 'HistogramChart':
        if (hasOwn(props, 'value') || hasOwn(props, 'x') || hasOwn(props, 'y')) {
          const field = stringField(props.value) ?? y[0] ?? x
          requireNumericField(issues, surfaceId, chartId, componentType, rows, field, 'value')
        }
        break
      case 'BoxplotChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.groupField) ?? x, 'group')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.valueField) ?? y[0], 'value')
        break
      case 'DumbbellChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, stringField(props.groupField) ?? x, 'group')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.low) ?? y[0], 'low')
        requireNumericField(issues, surfaceId, chartId, componentType, rows, stringField(props.high) ?? y[1], 'high')
        break
      case 'SankeyChart':
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, 'source', 'source')
        requireCategoryField(issues, surfaceId, chartId, componentType, rows, 'target', 'target')
        if (rowsHaveField(rows, 'value')) requireNumericField(issues, surfaceId, chartId, componentType, rows, 'value', 'value')
        break
    }
  }
  return issues
}

// Components that render nothing unless their primary data array is non-empty.
// The key is the canonical prop name AFTER withDefaultElementProps normalization.
const REQUIRED_CONTENT_ARRAYS: Record<string, string[]> = {
  AreaChart: ['data'], BarChart: ['data'], LineChart: ['data'], ComboChart: ['data'],
  ScatterChart: ['data'], BubbleChart: ['data'], BoxplotChart: ['data'], HistogramChart: ['data'],
  WaterfallChart: ['data'], XmrChart: ['data'], SankeyChart: ['data'], FunnelChart: ['data'],
  HeatmapChart: ['data'], CalendarChart: ['data'], SparklineChart: ['data'], DumbbellChart: ['data'],
  RadarChart: ['data'], PieChart: ['data'],
  DataTable: ['data', 'rows', 'columns'],
  KpiDashboard: ['metrics'],
  Timeline: ['events'],
  OrgChart: ['nodes', 'data'],
  GanttChart: ['tasks'],
  FormBuilder: ['fields'],
}

// Pure layout/decoration components that produce no visible content on their own.
const LAYOUT_ONLY_COMPONENTS = new Set(['Column', 'Row', 'Card', 'Container', 'Divider', 'Tabs'])

function elementHasNonEmptyArray(props: Record<string, unknown>, keys: string[]): boolean {
  return keys.some(key => Array.isArray(props[key]) && (props[key] as unknown[]).length > 0)
}

/**
 * A surface can be structurally valid (root, elements, no cycles, supported
 * components, resolvable field bindings) yet render nothing: a chart with an
 * empty data array, a KpiDashboard with no metrics, a DataTable with no rows,
 * or a root container with no content leaf. `ok:true` must mean really
 * renderable, so these are errors under requireRenderable. While streaming
 * (requireRenderable:false) the same conditions are only warnings, matching the
 * existing vizual.spec_empty_elements behavior.
 */
function collectEmptyContentIssues(
  spec: ReturnType<typeof withDefaultElementProps>,
  surfaceId: string,
  requireRenderable: boolean,
): VizualValidationIssue[] {
  const issues: VizualValidationIssue[] = []
  const elements = spec.elements ?? {}
  const severity: VizualValidationIssue['severity'] = requireRenderable ? 'error' : 'warning'
  let sawContentLeaf = false

  for (const [elementId, element] of Object.entries(elements)) {
    const componentType = stringField(element?.type)
    if (!componentType) continue
    const props = isRecord(element?.props) ? element.props : {}
    const requiredArrays = REQUIRED_CONTENT_ARRAYS[componentType]

    if (requiredArrays) {
      if (elementHasNonEmptyArray(props, requiredArrays)) {
        sawContentLeaf = true
      } else {
        issues.push({
          severity,
          code: 'vizual.empty_content',
          message: `${componentType} "${elementId}" has no ${requiredArrays.join('/')} to render, so it cannot produce a visible surface.`,
          surfaceId,
          evidence: { elementId, componentType, requiredArrays },
          fix: `Populate ${requiredArrays.map(a => `"${a}"`).join(' or ')} with at least one real item. If you have no data to show, answer in assistant text instead of rendering an empty ${componentType}.`,
        })
      }
    } else if (!LAYOUT_ONLY_COMPONENTS.has(componentType)) {
      // Text, Markdown, Image, Icon, Button, inputs, Mermaid, etc. carry their
      // own visible content and count as a renderable leaf.
      sawContentLeaf = true
    }
  }

  // A surface made only of empty layout containers renders blank.
  if (!sawContentLeaf && Object.keys(elements).length > 0 && !issues.length) {
    issues.push({
      severity,
      code: 'vizual.empty_content',
      message: 'Rendered Vizual surface has no content-bearing element (only empty layout containers), so it cannot produce a visible surface.',
      surfaceId,
      fix: 'Put at least one content component (chart, DataTable, KpiDashboard, Markdown, Text, …) inside the layout, with real data.',
    })
  }

  return issues
}

function collectUnsupportedComponentIssues(spec: ReturnType<typeof withDefaultElementProps>, surfaceId: string): VizualValidationIssue[] {
  const issues: VizualValidationIssue[] = []
  const elements = spec.elements ?? {}
  for (const [elementId, element] of Object.entries(elements)) {
    const componentType = stringField(element?.type)
    if (!componentType || RENDERABLE_COMPONENTS.has(componentType)) continue
    issues.push({
      severity: 'error',
      code: 'vizual.unsupported_component',
      message: `Rendered Vizual spec element "${elementId}" uses unsupported component "${componentType}". Use a native catalog component or report a catalog gap instead of returning an opaque component.`,
      surfaceId,
      evidence: { elementId, componentType },
      fix: `Replace "${componentType}" with the closest catalog component (call vizual_catalog to list them). For tabular data use DataTable; for a metric grid use KpiDashboard; for free text use Markdown.`,
    })
  }
  return issues
}

export function validateVizualNativeInput(
  input: VizualNativeInput,
  options: VizualValidateOptions = {},
): VizualValidationResult {
  const requireRenderable = options.requireRenderable ?? true
  // Repair recognizable dialects first so the opaque-input check runs against
  // the same payload normalization will see. A faithfully converted ECharts /
  // Chart.js input is no longer "opaque"; it is reported as an info-level repair.
  const repaired = repairAgentInput(input)
  const normalized = normalizeVizualNativeInput(repaired.input, options)
  const issues: VizualValidationIssue[] = [
    ...repaired.repairs.map(repair => ({
      severity: 'info' as const,
      code: repair.code,
      message: repair.message,
      surfaceId: normalized.surfaceId,
      evidence: repair.detail,
    })),
    ...collectOpaqueInputIssues(repaired.input, normalized.surfaceId),
    ...normalized.errors.map(error => ({
      severity: 'error' as const,
      code: `native.${error.phase ?? 'error'}`,
      message: error.message,
      surfaceId: error.surfaceId,
      evidence: error,
    })),
    ...normalized.findings.map(finding => ({
      severity: finding.severity,
      code: finding.code,
      message: finding.message,
      surfaceId: finding.surfaceId,
      evidence: finding.evidence,
    })),
  ]

  const snapshot = normalized.snapshot

  if (requireRenderable && !snapshot) {
    issues.push({
      severity: 'error',
      code: 'vizual.no_renderable_surface',
      message: 'Input did not produce a renderable Vizual surface.',
      surfaceId: normalized.surfaceId,
      fix: 'Send a native payload such as { "components": [{ "type": "BarChart", "x": "label", "y": "value", "data": [{ "label": "A", "value": 1 }] }] }, or a { "root", "elements" } spec. Make sure the JSON is an object/array, not a stringified blob or prose.',
    })
  }

  if (snapshot) {
    const spec = withDefaultElementProps(snapshot.spec)
    if (!spec.root) {
      issues.push({
        severity: 'error',
        code: 'vizual.spec_missing_root',
        message: 'Rendered Vizual spec is missing a root element id.',
        surfaceId: snapshot.surfaceId,
      })
    }
    if (!spec.elements || Object.keys(spec.elements).length === 0) {
      issues.push({
        severity: requireRenderable ? 'error' : 'warning',
        code: 'vizual.spec_empty_elements',
        message: 'Rendered Vizual spec has no elements. This can be valid while a surface is still streaming, but it cannot satisfy a visible UI preview.',
        surfaceId: snapshot.surfaceId,
      })
    }
    if (spec.root && spec.elements && !spec.elements[spec.root]) {
      issues.push({
        severity: 'error',
        code: 'vizual.spec_root_missing_element',
        message: `Rendered Vizual spec root "${spec.root}" does not exist in elements.`,
        surfaceId: snapshot.surfaceId,
      })
    }

    try {
      assertNoCyclicChildren(spec)
    } catch (error) {
      issues.push({
        severity: 'error',
        code: 'vizual.spec_cyclic_children',
        message: error instanceof Error ? error.message : String(error),
        surfaceId: snapshot.surfaceId,
      })
    }

    issues.push(...collectChartDataIssues(spec, snapshot.surfaceId))
    issues.push(...collectUnsupportedComponentIssues(spec, snapshot.surfaceId))
    issues.push(...collectEmptyContentIssues(spec, snapshot.surfaceId, requireRenderable))
  }

  return {
    ok: issues.every(issue => issue.severity !== 'error'),
    surfaceId: normalized.surfaceId,
    issues,
    normalized,
  }
}
