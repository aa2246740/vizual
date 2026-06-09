import type { VizualPreviewResult, VizualValidationIssue } from '../native-core'
import type { VizualNativeInput } from '../native-core/types'

export const VIZUAL_AGENT_CHART_COMPONENTS = [
  'AreaChart',
  'BarChart',
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
] as const

export type VizualAgentUserIntent = {
  wantsVizualUi: boolean
  wantsExplicitCreativeArtifact: boolean
  wantsKpi: boolean
  wantsChart: boolean
  wantsCompositeChart: boolean
  wantsTable: boolean
  wantsForm: boolean
  wantsRiskNarrative: boolean
}

export type VizualAgentCoverageIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
  evidence?: unknown
}

export type VizualAgentQAGuidance = VizualAgentCoverageIssue

export type VizualAgentCoverageResult = {
  ok: boolean
  intent: VizualAgentUserIntent
  componentTypes: string[]
  issues: VizualAgentCoverageIssue[]
  qaGuidance: VizualAgentQAGuidance[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stripVizualNamespace(value: unknown): string {
  return String(value || '').replace(/^Vizual[._:-]/i, '')
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function inferVizualAgentUserIntent(userMessage: string): VizualAgentUserIntent {
  const text = String(userMessage || '')
  const wantsExplicitCreativeArtifact = /(?:帮我|请|给我|需要|想要|写|生成|创建|做|实现|build|create|write|make).{0,30}(?:landing\s*page|hero\s*page|网页|网站|HTML\s*\/\s*CSS|HTML|CSS|React|Vue|Svelte|SVG|游戏|game|app|应用|单文件|代码|code artifact|component)|(?:landing\s*page|hero\s*page|网页|网站|HTML\s*\/\s*CSS|React|Vue|Svelte|SVG|游戏|game|app|应用|单文件|代码).{0,30}(?:代码|文件|实现|写|生成|创建|做|build|create|write|make)/iu.test(text)
  const wantsForm = /(表单|填写|提交|采集|录入|问卷|收集用户|回传|form|submit|input|questionnaire)/iu.test(text)
  const wantsTable = /(?:生成|展示|输出|呈现|列出|整理成|做成|创建|渲染).{0,16}(?:表格|明细表|数据表|table|grid)|(?:表格|明细表|数据表|table|grid).{0,16}(?:展示|输出|呈现|列出|核对|查看)/iu.test(text)
  const wantsKpi = /(KPI|指标卡|指标面板|KPI看板|仪表盘|dashboard|Dashboard|驾驶舱|scorecard|经营看板)/iu.test(text)
  const wantsCompositeChart = /(双轴|多图层|组合图|混合图|柱状.*折线|折线.*柱状|散点大小|bubble|scatter|combo|bar.*line|line.*bar)/iu.test(text)
  const wantsChart = /(可视化|图表|趋势|分布|排行|折线|柱状|饼图|散点|气泡|双轴|多图层|chart|plot|line|bar|scatter|bubble|combo|Dashboard|dashboard|驾驶舱)/iu.test(text)
  const wantsRiskNarrative = /(风险提示|风险预警|风险|预警|risk|warning|行动建议|建议行动)/iu.test(text)
  const wantsVizualUi = !wantsExplicitCreativeArtifact && (wantsForm || wantsTable || wantsKpi || wantsChart)
  return { wantsVizualUi, wantsExplicitCreativeArtifact, wantsKpi, wantsChart, wantsCompositeChart, wantsTable, wantsForm, wantsRiskNarrative }
}

function explicitlyRequiresChartEvidence(userMessage: string): boolean {
  const text = String(userMessage || '')
  const chartTerms = '(?:图表|趋势图|折线图|柱状图|条形图|饼图|散点图|气泡图|组合图|chart|plot|line\\s+chart|bar\\s+chart|pie\\s+chart|scatter\\s+plot)'
  return new RegExp(
    `(?:用|拿|通过|请|需要|输出|生成|画|展示|做|给出|提供).{0,16}${chartTerms}|${chartTerms}.{0,16}(?:证明|说明|支撑|展示|呈现|输出|画|给出|prove|show|support)`,
    'iu',
  ).test(text)
}

function collectComponentTypes(value: unknown, out: string[] = []): string[] {
  const parsed = parseMaybeJson(value)
  if (Array.isArray(parsed)) {
    parsed.forEach(item => collectComponentTypes(item, out))
    return out
  }
  if (!isRecord(parsed)) return out

  const component = stripVizualNamespace(parsed.component ?? parsed.type ?? parsed.componentType)
  if (component) out.push(component)

  if (isRecord(parsed.elements)) collectComponentTypes(Object.values(parsed.elements), out)
  if (isRecord(parsed.props)) collectComponentTypes(parsed.props.children, out)
  if (isRecord(parsed.updateComponents)) collectComponentTypes(parsed.updateComponents.components, out)
  for (const key of ['children', 'items', 'content', 'body', 'sections', 'components']) {
    if (parsed[key] !== undefined) collectComponentTypes(parsed[key], out)
  }
  return out
}

function inlineText(node: unknown): string {
  if (!isRecord(node)) return ''
  const component = stripVizualNamespace(node.component ?? node.type ?? node.componentType)
  if (component !== 'Text') return ''
  const props = isRecord(node.props) ? node.props : node
  const value = props.content ?? props.text ?? props.value ?? props.label ?? props.children
  return value == null ? '' : String(value).trim()
}

function metricCardCandidate(node: unknown): { label: string; value: string } | null {
  if (!isRecord(node)) return null
  const component = stripVizualNamespace(node.component ?? node.type ?? node.componentType)
  if (!['Column', 'View', 'Card', 'Container'].includes(component)) return null
  const props = isRecord(node.props) ? node.props : node
  const children = Array.isArray(props.children) ? props.children : []
  const texts = children.map(inlineText).filter(Boolean)
  if (texts.length < 2) return null
  const valueIndex = texts.findIndex(text => /\d/u.test(text))
  if (valueIndex <= 0) return null
  return { label: texts[valueIndex - 1], value: texts[valueIndex] }
}

function hasKpiCandidate(value: unknown): boolean {
  const parsed = parseMaybeJson(value)
  if (Array.isArray(parsed)) {
    const metrics = parsed.map(metricCardCandidate).filter(Boolean)
    if (metrics.length >= 2) return true
    return parsed.some(hasKpiCandidate)
  }
  if (!isRecord(parsed)) return false
  const component = stripVizualNamespace(parsed.component ?? parsed.type ?? parsed.componentType)
  if (['KpiDashboard', 'KPIGrid', 'MetricsGrid', 'KpiCard', 'MetricCard'].includes(component)) return true
  if (isRecord(parsed.elements) && hasKpiCandidate(Object.values(parsed.elements))) return true
  if (isRecord(parsed.props) && hasKpiCandidate(parsed.props.children)) return true
  for (const key of ['children', 'items', 'content', 'body', 'sections', 'components']) {
    if (parsed[key] !== undefined && hasKpiCandidate(parsed[key])) return true
  }
  return false
}

function tableCellCount(props: Record<string, unknown>): number {
  const rows = Array.isArray(props.data) ? props.data.filter(isRecord) : []
  if (!rows.length) return 0
  const columnKeys = Array.isArray(props.columns)
    ? props.columns.map((column, index) => {
        if (typeof column === 'string') return column
        if (!isRecord(column)) return `col_${index + 1}`
        return String(column.key ?? column.field ?? column.accessor ?? column.dataIndex ?? column.id ?? column.name ?? column.label ?? column.title ?? column.header ?? `col_${index + 1}`)
      })
    : []
  const keys = columnKeys.length ? columnKeys : Object.keys(rows[0] || {})
  let count = 0
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key]
      if (value !== undefined && value !== null && String(value).trim() !== '') count += 1
    }
  }
  return count
}

function chartDataPointCount(props: Record<string, unknown>): number {
  const directData = Array.isArray(props.data) ? props.data.length : 0
  const embeddedSeries = isRecord(props.data) && Array.isArray(props.data.series) ? props.data.series : []
  const series = Array.isArray(props.series) ? props.series : embeddedSeries
  const seriesData = series.length
    ? series.reduce((sum, item) => sum + (Array.isArray(item?.data) ? item.data.length : 0), 0)
    : 0
  const xAxis = Array.isArray(props.xAxis) ? props.xAxis[0] : props.xAxis
  const categoryData = Array.isArray(props.categories)
    ? props.categories.length
    : isRecord(props.data) && Array.isArray(props.data.categories)
      ? props.data.categories.length
      : isRecord(xAxis) && Array.isArray(xAxis.data)
        ? xAxis.data.length
        : 0
  return Math.max(directData, seriesData, categoryData && seriesData ? seriesData : 0)
}

function previewComponentTypes(preview: VizualPreviewResult | null | undefined, input: VizualNativeInput | null | undefined): string[] {
  if (preview?.summary.componentTypes?.length) return preview.summary.componentTypes
  const fromSpec = preview?.spec?.elements
    ? Object.values(preview.spec.elements)
        .map(element => stripVizualNamespace(element?.type ?? element?.component ?? element?.componentType))
        .filter(Boolean)
    : []
  if (fromSpec.length) return Array.from(new Set(fromSpec))
  return Array.from(new Set(collectComponentTypes(input)))
}

function collectRenderableIssues(preview: VizualPreviewResult | null | undefined): VizualAgentCoverageIssue[] {
  const issues: VizualAgentCoverageIssue[] = []
  const elements = preview?.spec?.elements ?? {}
  for (const [id, element] of Object.entries(elements)) {
    const componentType = stripVizualNamespace(element?.type ?? element?.component ?? element?.componentType)
    const props = isRecord(element?.props) ? element.props : {}
    if (componentType === 'DataTable' && tableCellCount(props) === 0) {
      issues.push({
        severity: 'error',
        code: 'vizual.agent.table_empty',
        message: `DataTable "${id}" has no readable cells.`,
        evidence: { elementId: id },
      })
    }
    if ((VIZUAL_AGENT_CHART_COMPONENTS as readonly string[]).includes(componentType) && chartDataPointCount(props) === 0) {
      issues.push({
        severity: 'error',
        code: 'vizual.agent.chart_empty',
        message: `${componentType} "${id}" has no data points.`,
        evidence: { elementId: id, componentType },
      })
    }
  }
  return issues
}

function strictValidationIssues(validationIssues: VizualValidationIssue[] = []): VizualAgentCoverageIssue[] {
  return validationIssues
    .filter(issue => issue.severity === 'error' || issue.code === 'vizual.chart_all_zero_numeric_field')
    .map(issue => ({
      severity: issue.severity === 'error' ? 'error' as const : 'warning' as const,
      code: issue.code,
      message: issue.message,
      evidence: issue.evidence,
    }))
}

function collectStringLeaves(value: unknown, out: string[] = []): string[] {
  const parsed = parseMaybeJson(value)
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    if (trimmed) out.push(trimmed)
    return out
  }
  if (Array.isArray(parsed)) {
    parsed.forEach(item => collectStringLeaves(item, out))
    return out
  }
  if (isRecord(parsed)) {
    Object.values(parsed).forEach(item => collectStringLeaves(item, out))
  }
  return out
}

function extractYears(text: string): string[] {
  const years = new Set<string>()
  const patterns = [
    /(?:^|[^\d])((?:19|20)\d{2})(?=\s*(?:年|H[12]\b|Q[1-4]\b|[-/]\d{1,2}\b))/giu,
    /(?:^|[^\d])(?:FY|CY|财年|年度)\s*((?:19|20)\d{2})(?!\d)/giu,
    /(?:^|[^\d])(?:H[12]|Q[1-4])\s*((?:19|20)\d{2})(?!\d)/giu,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) years.add(match[1])
  }
  return Array.from(years)
}

const BASELINE_COMPARISON_RE = /(同比|YoY|Y\/Y|year[- ]?over[- ]?year|去年同期|较去年|上年同期)/iu
const EXTERNAL_BENCHMARK_RE = /(监管|行业均值|行业平均|标准线|参考线|预警线|风险阈值|风控阈值|红线|基准线|baseline|benchmark|threshold|warning line|reference line|industry average)/iu
const INTERACTION_CLAIM_RE = /((?:筛选|过滤|提交|更新|审批|派单|回传|调整|录入|保存|确认|filter|submit|update|approve|dispatch)[^，。；;]{0,24}(?:交互|操作|按钮|控件|表单|点击|支持)|点击[^，。；;]{0,24}(?:筛选|过滤|提交|更新|审批|派单|回传|调整|录入|保存|确认))/iu
const REAL_ACTION_RE = /(^|["'\s])(?:action|actions|onClick|onChange|onSubmit|functionName|function\.call|callFunction|submitForm|drillDown|applyFilter|selectLocation|updatePlan)(["'\s:]|$)/iu
const DATA_REQUEST_RE = /(?:请(?:提供|补充|上传|给出)|(?:提供|补充|上传|给出|补齐|追加|导入)[^，。；;]{0,24}(?:数据|月份|同期|基准|阈值|红线|预警线|baseline|benchmark|threshold)|(?:if|after)[^，。；;]{0,32}(?:provide|upload|supplement)|(?:provide|upload|supplement)[^，。；;]{0,32}(?:data|baseline|benchmark|threshold))/iu
const FUTURE_RENDER_RE = /(?:我再|再(?:加|生成|渲染|展示|计算|补充)|(?:提供|补充|上传|导入)后|才能|可(?:以)?(?:加|生成|渲染|展示|计算|补充)|then|after|can add|can generate|can render|only then)/iu

function isConditionalDataRequestFragment(text: string): boolean {
  return DATA_REQUEST_RE.test(text) && FUTURE_RENDER_RE.test(text)
}

function removeConditionalFidelityFragments(text: string): string {
  return String(text || '')
    .split(/(?<=[。！？!?；;])|\n/gu)
    .filter(fragment => {
      const value = fragment.trim()
      if (!value) return false
      const mentionsGuardedFact = BASELINE_COMPARISON_RE.test(value) || EXTERNAL_BENCHMARK_RE.test(value)
      return !(mentionsGuardedFact && isConditionalDataRequestFragment(value))
    })
    .join('\n')
}

function collectDataFidelityIssues(options: {
  userMessage?: string
  input?: VizualNativeInput | null
  preview?: VizualPreviewResult | null
  assistantText?: string
}): { issues: VizualAgentCoverageIssue[]; qaGuidance: VizualAgentQAGuidance[] } {
  const userText = String(options.userMessage || '')
  if (!userText.trim()) return { issues: [], qaGuidance: [] }

  const renderedText = [
    collectStringLeaves(options.preview?.spec ?? options.input).join('\n'),
    String(options.assistantText || ''),
  ].filter(text => text.trim()).join('\n')
  if (!renderedText.trim()) return { issues: [], qaGuidance: [] }

  const sourceYears = new Set(extractYears(userText))
  const unsupportedYears = Array.from(new Set(extractYears(renderedText).filter(year => !sourceYears.has(year))))
  const issues: VizualAgentCoverageIssue[] = []
  const qaGuidance: VizualAgentQAGuidance[] = []
  if (unsupportedYears.length) {
    issues.push({
      severity: 'error',
      code: 'vizual.agent.unsupported_year',
      message: `Rendered UI introduced year(s) not present in the user data: ${unsupportedYears.join(', ')}.`,
      evidence: { unsupportedYears },
    })
  }

  const assertedRenderedText = removeConditionalFidelityFragments(renderedText)

  if (BASELINE_COMPARISON_RE.test(assertedRenderedText) && !BASELINE_COMPARISON_RE.test(userText)) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.unsupported_baseline_comparison',
      message: 'Rendered UI may have introduced YoY/year-over-year comparison without a user-provided baseline.',
    })
  }

  if (EXTERNAL_BENCHMARK_RE.test(assertedRenderedText) && !EXTERNAL_BENCHMARK_RE.test(userText)) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.unsupported_external_benchmark',
      message: 'Rendered UI may have introduced an external benchmark, threshold, warning line, or regulatory standard that was not present in the user data.',
    })
  }

  return { issues, qaGuidance }
}

function collectInteractionFidelityIssues(options: {
  input?: VizualNativeInput | null
  preview?: VizualPreviewResult | null
  assistantText?: string
}): VizualAgentCoverageIssue[] {
  const renderedText = [
    collectStringLeaves(options.preview?.spec ?? options.input).join('\n'),
    String(options.assistantText || ''),
  ].filter(text => text.trim()).join('\n')
  if (!INTERACTION_CLAIM_RE.test(renderedText)) return []
  const actionSource = JSON.stringify(options.preview?.spec ?? options.input ?? '')
  if (REAL_ACTION_RE.test(actionSource)) return []
  return [{
    severity: 'error',
    code: 'vizual.agent.unsupported_interaction_claim',
    message: 'Rendered UI or assistant prose claimed non-chart interactivity without a real Vizual action/control.',
  }]
}

type SourceFieldFacts = {
  field: string
  normalizedField: string
  values: string[]
  numericValues: number[]
  sum?: number
  groupId: string
}

function normalizeLabel(value: string): string {
  return value
    .replace(/\([^)]*\)/gu, '')
    .replace(/（[^）]*）/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
    .toLowerCase()
}

function numericTokens(value: unknown): number[] {
  const text = String(value ?? '').replace(/,/gu, '')
  return Array.from(text.matchAll(/[-+]?\d+(?:\.\d+)?/gu), match => Number(match[0]))
    .filter(number => Number.isFinite(number))
}

function approximatelyEqual(a: number, b: number): boolean {
  const tolerance = Math.max(0.01, Math.abs(b) * 0.002)
  return Math.abs(a - b) <= tolerance
}

function parseSourceFieldFacts(userMessage: string): SourceFieldFacts[] {
  const lines = userMessage
    .split(/\r?\n/u)
    .map(line => line.trim())
    .filter(line => line.includes('\t'))
  const fields: SourceFieldFacts[] = []

  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = lines[index].split('\t').map(cell => cell.trim()).filter(Boolean)
    const next = lines[index + 1].split('\t').map(cell => cell.trim())
    if (header.length < 2 || next.length < header.length) continue
    if (header.filter(cell => /\d/u.test(cell)).length > header.length / 2) continue

    const tableFields = new Map<string, SourceFieldFacts>()
    for (let rowIndex = index + 1; rowIndex < lines.length; rowIndex += 1) {
      const row = lines[rowIndex].split('\t').map(cell => cell.trim())
      if (row.length < header.length) break
      if (row.filter(cell => /\d/u.test(cell)).length === 0) break
      for (let column = 1; column < header.length; column += 1) {
        const value = row[column]
        if (!/\d/u.test(value)) continue
        const field = header[column]
        const normalizedField = normalizeLabel(field)
        if (!normalizedField) continue
        const fact = tableFields.get(normalizedField) ?? {
          field,
          normalizedField,
          values: [],
          numericValues: [],
          groupId: `table-${index}`,
        }
        fact.values.push(value)
        fact.numericValues.push(...numericTokens(value))
        tableFields.set(normalizedField, fact)
      }
    }
    fields.push(...tableFields.values())
  }

  return fields.map(fact => ({
    ...fact,
    sum: fact.numericValues.length ? fact.numericValues.reduce((sum, value) => sum + value, 0) : undefined,
  }))
}

function collectKpiMetrics(preview: VizualPreviewResult | null | undefined): Array<{ label: string; value: unknown; elementId: string }> {
  const metrics: Array<{ label: string; value: unknown; elementId: string }> = []
  const elements = preview?.spec?.elements ?? {}
  for (const [elementId, element] of Object.entries(elements)) {
    const componentType = stripVizualNamespace(element?.type ?? element?.component ?? element?.componentType)
    if (componentType !== 'KpiDashboard') continue
    const props = isRecord(element?.props) ? element.props : {}
    const rawMetrics = Array.isArray(props.metrics)
      ? props.metrics
      : Array.isArray(props.items)
        ? props.items
        : []
    for (const metric of rawMetrics) {
      if (!isRecord(metric)) continue
      const label = String(metric.label ?? metric.name ?? metric.title ?? '').trim()
      if (!label) continue
      metrics.push({ label, value: metric.value ?? metric.metric ?? metric.amount, elementId })
    }
  }
  return metrics
}

function matchingSourceFields(metricLabel: string, fields: SourceFieldFacts[]): SourceFieldFacts[] {
  const label = normalizeLabel(metricLabel)
  return fields
    .filter(field => field.normalizedField.length >= 2 && (label.includes(field.normalizedField) || field.normalizedField.includes(label)))
    .sort((a, b) => b.normalizedField.length - a.normalizedField.length)
}

function isDerivedRatioMetric(label: string, value: unknown): boolean {
  const normalizedLabel = normalizeLabel(label)
  const rawValue = String(value ?? '')
  return /(率|比|占比|比例|margin|ratio|rate|share)/iu.test(label)
    || /(率|比|占比|比例|margin|ratio|rate|share)/iu.test(normalizedLabel)
    || /%/.test(rawValue)
}

function isDerivedPerUnitMetric(label: string): boolean {
  const normalizedLabel = normalizeLabel(label)
  return /(单台|单位|每|人均|客单|per|unit)/iu.test(label)
    || /(单台|单位|每|人均|客单|per|unit)/iu.test(normalizedLabel)
}

function metricNumbersCanBeDerivedFromSameTable(metricNumbers: number[], fields: SourceFieldFacts[]): boolean {
  const fieldsByGroup = new Map<string, SourceFieldFacts[]>()
  for (const field of fields) {
    const group = fieldsByGroup.get(field.groupId) ?? []
    group.push(field)
    fieldsByGroup.set(field.groupId, group)
  }

  const derivedValues = Array.from(fieldsByGroup.values()).flatMap(group => {
    const values = group.flatMap(field => field.numericValues)
    const derived: number[] = []
    for (const numerator of values) {
      for (const denominator of values) {
        if (denominator === 0 || numerator === denominator) continue
        derived.push(numerator / denominator)
      }
    }
    return derived
  })

  return metricNumbers.every(number => derivedValues.some(value => approximatelyEqual(number, value)))
}

function collectKpiValueConsistencyIssues(options: {
  userMessage?: string
  preview?: VizualPreviewResult | null
}): VizualAgentCoverageIssue[] {
  const fields = parseSourceFieldFacts(String(options.userMessage || ''))
  if (!fields.length) return []
  const metrics = collectKpiMetrics(options.preview)
  const issues: VizualAgentCoverageIssue[] = []

  for (const metric of metrics) {
    const matchedFields = matchingSourceFields(metric.label, fields)
    if (!matchedFields.length) continue
    const metricNumbers = numericTokens(metric.value)
    if (!metricNumbers.length) continue
    if (isDerivedRatioMetric(metric.label, metric.value)) continue
    if (isDerivedPerUnitMetric(metric.label) && metricNumbersCanBeDerivedFromSameTable(metricNumbers, fields)) continue
    const allowed = matchedFields.flatMap(field => field.sum == null ? field.numericValues : [...field.numericValues, field.sum])
    const unmatched = metricNumbers.filter(number => !allowed.some(allowedNumber => approximatelyEqual(number, allowedNumber)))
    if (!unmatched.length) continue
    const matchedFieldNames = new Set(matchedFields.map(field => field.normalizedField))
    const otherField = fields.find(field => !matchedFieldNames.has(field.normalizedField)
      && unmatched.some(number => field.numericValues.some(value => approximatelyEqual(number, value))))
    const expectedFields = Array.from(new Set(matchedFields.map(field => field.field))).join(' / ')
    issues.push({
      severity: 'error',
      code: otherField ? 'vizual.agent.kpi_value_swapped_field' : 'vizual.agent.kpi_value_not_supported_by_source',
      message: otherField
        ? `KPI "${metric.label}" uses value ${String(metric.value)} from source field "${otherField.field}" instead of "${expectedFields}".`
        : `KPI "${metric.label}" uses value ${String(metric.value)} that is not supported by source field "${expectedFields}" or its per-table aggregate.`,
      evidence: {
        elementId: metric.elementId,
        label: metric.label,
        value: metric.value,
        expectedField: expectedFields,
        conflictingField: otherField?.field,
      },
    })
  }

  return issues
}

export function assertVizualAgentToolCoverage(options: {
  userMessage?: string
  input?: VizualNativeInput | null
  preview?: VizualPreviewResult | null
  assistantText?: string
  allowUnexpectedForm?: boolean
}): VizualAgentCoverageResult {
  const intent = inferVizualAgentUserIntent(options.userMessage || '')
  const componentTypes = previewComponentTypes(options.preview, options.input)
  const componentSet = new Set(componentTypes)
  const issues: VizualAgentCoverageIssue[] = []
  const qaGuidance: VizualAgentQAGuidance[] = []
  const hasChart = componentTypes.some(type => (VIZUAL_AGENT_CHART_COMPONENTS as readonly string[]).includes(type))
  const inputHasKpiCandidate = hasKpiCandidate(options.input)
  const hasKpiSurface = componentSet.has('KpiDashboard') || (!options.preview && inputHasKpiCandidate)
  const hasNarrativeSurface = componentTypes.some(type => ['Markdown', 'DataTable', 'Timeline'].includes(type))

  if (intent.wantsExplicitCreativeArtifact && componentTypes.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'vizual.agent.explicit_artifact_forced_native',
      message: 'User explicitly asked for a creative/code artifact, but the answer also rendered Vizual native UI. The Agent should honor the requested artifact path and keep Vizual unused unless the user asks to embed it.',
      evidence: { componentTypes },
    })
  }

  if (intent.wantsKpi && !hasKpiSurface) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.missing_kpi',
      message: 'User asked for Dashboard/KPI/cockpit output, but the Vizual input/render has no KpiDashboard or recognizable KPI metric card group.',
    })
  }
  if (intent.wantsChart && !hasChart) {
    const issue = {
      severity: explicitlyRequiresChartEvidence(options.userMessage || '') ? 'error' as const : 'warning' as const,
      code: 'vizual.agent.missing_chart',
      message: explicitlyRequiresChartEvidence(options.userMessage || '')
        ? 'User explicitly asked for chart evidence, but the Vizual input/render has no native chart component.'
        : 'User asked for chart/dashboard output, but the Vizual input/render has no native chart component.',
    }
    if (issue.severity === 'error') issues.push(issue)
    else qaGuidance.push(issue)
  }
  if (intent.wantsTable && !componentSet.has('DataTable')) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.missing_table',
      message: 'User asked for table/detail output, but the Vizual input/render has no DataTable.',
    })
  }
  if (intent.wantsForm && !componentSet.has('FormBuilder')) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.missing_form',
      message: 'User asked for a form/input/submit UI, but the Vizual input/render has no FormBuilder.',
    })
  }
  if (!intent.wantsForm && !options.allowUnexpectedForm && componentSet.has('FormBuilder')) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.unexpected_form',
      message: 'FormBuilder was rendered even though the user did not ask to collect or submit structured input.',
    })
  }
  if (intent.wantsVizualUi && componentTypes.length === 0) {
    issues.push({
      severity: 'error',
      code: 'vizual.agent.no_components',
      message: 'No Vizual components were rendered.',
    })
  }
  if (intent.wantsRiskNarrative && !hasNarrativeSurface) {
    qaGuidance.push({
      severity: 'warning',
      code: 'vizual.agent.missing_risk_surface',
      message: 'User asked for risk/warning/action guidance, but the rendered Vizual UI has no Markdown, DataTable, or Timeline section for it.',
    })
  }

  if (options.preview) {
    issues.push(...collectRenderableIssues(options.preview))
    issues.push(...strictValidationIssues(options.preview.issues))
  }
  const dataFidelity = collectDataFidelityIssues(options)
  issues.push(...dataFidelity.issues)
  qaGuidance.push(...dataFidelity.qaGuidance)
  issues.push(...collectInteractionFidelityIssues(options))
  issues.push(...collectKpiValueConsistencyIssues(options))

  return {
    ok: issues.every(issue => issue.severity !== 'error'),
    intent,
    componentTypes,
    issues,
    qaGuidance,
  }
}
