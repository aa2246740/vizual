import type { VizualSpec } from './artifact'

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  return typeof value === 'string' && value.length > 0 ? [value] : []
}

function firstStringValue(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return undefined
}

function firstField(record: Record<string, unknown>): string | undefined {
  const value = record.y
    ?? record.yField
    ?? record.field
    ?? record.key
    ?? record.dataKey
    ?? record.value
    ?? record.valueField
    ?? record.valueKey
    ?? record.metricField
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function fieldList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'string' && item.trim().length > 0) return item.trim()
        return firstField(toRecord(item))
      })
      .filter((item): item is string => Boolean(item))
  }
  const recordField = firstField(toRecord(value))
  if (recordField) return [recordField]
  return typeof value === 'string' && value.trim().length > 0 ? [value.trim()] : []
}

function axisField(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  return firstField(toRecord(value))
}

function axisData(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  const record = toRecord(value)
  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.categories)) return record.categories
  if (Array.isArray(record.labels)) return record.labels
  return null
}

function setStringAlias(
  record: Record<string, unknown>,
  key: string,
  ...values: unknown[]
) {
  if (record[key] != null) return
  const value = firstStringValue(...values)
  if (value) record[key] = value
}

type NativeSeriesType = 'bar' | 'line' | 'scatter'

function toSeriesEntries(value: unknown, defaultType?: NativeSeriesType) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? []
      : value == null ? [] : [value]
  return values
    .map((item, index) => {
      if (typeof item === 'string' && item.length > 0) {
        return { type: defaultType ?? (index === 0 ? 'bar' : 'line'), y: item }
      }
      const record = toRecord(item)
      const y = firstField(record)
      if (!y) return null
      return {
        type: record.type === 'bar' || record.type === 'line' || record.type === 'scatter'
          ? record.type
          : defaultType ?? (index === 0 ? 'bar' : 'line'),
        y,
        ...(typeof record.name === 'string' && record.name.length ? { name: record.name } : {}),
        ...(typeof record.size === 'string' && record.size.length ? { size: record.size } : {}),
        ...(typeof record.sizeField === 'string' && record.sizeField.length ? { size: record.sizeField } : {}),
        ...(typeof record.r === 'string' && record.r.length ? { size: record.r } : {}),
        ...(typeof record.yAxisIndex === 'number' && Number.isFinite(record.yAxisIndex) ? { yAxisIndex: record.yAxisIndex } : {}),
      }
    })
    .filter((series): series is { type: NativeSeriesType; y: string; name?: string; size?: string; yAxisIndex?: number } => Boolean(series))
}

function chartMark(value: unknown): NativeSeriesType | undefined {
  return value === 'bar' || value === 'line' || value === 'scatter' ? value : undefined
}

function fieldRef(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  const record = toRecord(value)
  const field = firstStringValue(
    record.field,
    record.key,
    record.dataKey,
    record.accessor,
    record.name,
    record.value,
    record.valueField,
    record.metric,
    record.metricField,
    record.measure,
    record.measureField,
    record.y,
    record.yField,
    record.x,
    record.xField,
  )
  return field
}

function fieldRefList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(fieldRef).filter((field): field is string => Boolean(field))
  }
  const record = toRecord(value)
  const nested = record.fields ?? record.values ?? record.measures
  if (Array.isArray(nested)) return fieldRefList(nested)
  const single = fieldRef(value)
  return single ? [single] : []
}

function encodingRecord(value: unknown): Record<string, unknown> {
  return toRecord(value)
}

function encodedField(encoding: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const field = fieldRef(encoding[key])
    if (field) return field
  }
  return undefined
}

function encodedFieldList(encoding: Record<string, unknown>, ...keys: string[]): string[] {
  for (const key of keys) {
    const fields = fieldRefList(encoding[key])
    if (fields.length) return fields
  }
  return []
}

type ChartMeasure = {
  field: string
  name?: string
  type: NativeSeriesType
  size?: string
  yAxisIndex?: number
}

function axisIndex(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const text = value.trim().toLowerCase()
  if (!text) return undefined
  if (text === 'right' || text === 'secondary' || text === 'rightaxis' || text === 'y2') return 1
  if (text === 'left' || text === 'primary' || text === 'leftaxis' || text === 'y1') return 0
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : undefined
}

function measureEntries(value: unknown, defaultType?: NativeSeriesType): ChartMeasure[] {
  const values = Array.isArray(value) ? value : value == null ? [] : [value]
  return values
    .map((item, index) => {
      const record = toRecord(item)
      const field = fieldRef(item)
      if (!field) return null
      return {
        field,
        type: chartMark(record.mark ?? record.type ?? record.chartType ?? record.kind) ?? defaultType ?? (index === 0 ? 'bar' : 'line'),
        ...(typeof record.name === 'string' && record.name.trim() ? { name: record.name.trim() } : {}),
        ...(typeof record.label === 'string' && record.label.trim() ? { name: record.label.trim() } : {}),
        ...(typeof record.title === 'string' && record.title.trim() ? { name: record.title.trim() } : {}),
        ...(fieldRef(record.size ?? record.sizeField ?? record.r ?? record.radiusField) ? { size: fieldRef(record.size ?? record.sizeField ?? record.r ?? record.radiusField)! } : {}),
        ...(axisIndex(record.yAxisIndex ?? record.axisIndex ?? record.axis ?? record.yAxis) !== undefined
          ? { yAxisIndex: axisIndex(record.yAxisIndex ?? record.axisIndex ?? record.axis ?? record.yAxis)! }
          : {}),
      }
    })
    .filter((entry): entry is ChartMeasure => Boolean(entry))
}

function finiteChartNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function pivotLongFormSeries(
  rows: unknown[],
  xField: string,
  yField: string,
  seriesField: string,
): { data: Record<string, unknown>[]; y: string[] } | null {
  const rowRecords = rows.map(toRecord).filter(row => Object.keys(row).length)
  if (!rowRecords.length) return null
  const hasAllFields = rowRecords.some(row => row[xField] != null && row[yField] != null && row[seriesField] != null)
  if (!hasAllFields) return null

  const groupNames: string[] = []
  const rowsByX = new Map<string, Record<string, unknown>>()
  const xValuesByKey = new Map<string, unknown>()

  for (const row of rowRecords) {
    const rawX = row[xField]
    const rawGroup = row[seriesField]
    const numericValue = finiteChartNumber(row[yField])
    if (rawX == null || rawGroup == null || numericValue === null) continue
    const xKey = String(rawX)
    const groupName = String(rawGroup).trim()
    if (!groupName) continue
    if (!groupNames.includes(groupName)) groupNames.push(groupName)
    xValuesByKey.set(xKey, rawX)
    const out = rowsByX.get(xKey) ?? { [xField]: rawX }
    const previous = finiteChartNumber(out[groupName])
    out[groupName] = previous === null ? numericValue : previous + numericValue
    rowsByX.set(xKey, out)
  }

  if (!groupNames.length || !rowsByX.size) return null
  const data = Array.from(rowsByX.entries()).map(([xKey, row]) => ({
    [xField]: xValuesByKey.get(xKey) ?? xKey,
    ...row,
  }))
  return { data, y: groupNames }
}

function applyChartIntent(componentType: string, next: Record<string, unknown>) {
  const encoding = encodingRecord(next.encoding)
  const measures = measureEntries(next.measures)
  const encodedMeasures = encodedFieldList(encoding, 'measures', 'measure', 'metrics', 'metric')
  const x = encodedField(encoding, 'x', 'category', 'dimension', 'time', 'date', 'label')
  const y = [
    ...encodedFieldList(encoding, 'y', 'value', 'values', 'metric', 'measure'),
    ...encodedMeasures,
    ...measures.map(measure => measure.field),
  ]
  const label = encodedField(encoding, 'label', 'name', 'category', 'x')
  const value = encodedField(encoding, 'value', 'y', 'metric', 'measure')
    ?? (measures.length === 1 ? measures[0].field : undefined)
  const date = encodedField(encoding, 'date', 'time', 'x')
  const size = encodedField(encoding, 'size', 'r', 'radius')
  const group = fieldRef(next.seriesBy)
    ?? fieldRef(next.colorBy)
    ?? fieldRef(next.groupBy)
    ?? encodedField(encoding, 'seriesBy', 'color', 'colorBy', 'group', 'groupBy', 'series')

  if (next.x == null && x) next.x = x
  if (group && next.seriesBy == null) next.seriesBy = group
  if (group && next.colorBy == null) next.colorBy = group
  if (group && next.groupBy == null) next.groupBy = group

  if (componentType === 'ComboChart' && measures.length) {
    if (!Array.isArray(next.series)) {
      next.series = measures.map(measure => ({
        type: measure.type ?? 'line',
        y: measure.field,
        ...(measure.name ? { name: measure.name } : {}),
        ...(measure.size ? { size: measure.size } : {}),
        ...(measure.yAxisIndex !== undefined ? { yAxisIndex: measure.yAxisIndex } : {}),
      }))
    }
    if (next.y == null) next.y = measures.map(measure => measure.field)
  } else if (next.y == null && y.length) {
    next.y = y.length === 1 ? y[0] : y
  }

  if (componentType === 'PieChart' || componentType === 'FunnelChart' || componentType === 'WaterfallChart' || componentType === 'XmrChart') {
    if (next.label == null && label) next.label = label
    if (next.value == null && value) next.value = value
  }
  if (componentType === 'CalendarChart') {
    if (next.dateField == null && date) next.dateField = date
    if (next.valueField == null && value) next.valueField = value
  }
  if (componentType === 'HeatmapChart') {
    const heatX = encodedField(encoding, 'x', 'column', 'category')
    const heatY = encodedField(encoding, 'y', 'row', 'group', 'series')
    if (next.xField == null && heatX) next.xField = heatX
    if (next.yField == null && heatY) next.yField = heatY
    if (next.valueField == null && value) next.valueField = value
  }
  if (componentType === 'BoxplotChart') {
    if (next.groupField == null && (group || x)) next.groupField = group ?? x
    if (next.valueField == null && value) next.valueField = value
  }
  if (componentType === 'DumbbellChart') {
    const low = encodedField(encoding, 'low', 'min', 'start', 'from', 'before')
    const high = encodedField(encoding, 'high', 'max', 'end', 'to', 'after')
    if (next.groupField == null && (group || x)) next.groupField = group ?? x
    if (next.low == null && low) next.low = low
    if (next.high == null && high) next.high = high
  }
  if (componentType === 'ScatterChart' || componentType === 'BubbleChart') {
    if (next.size == null && size) next.size = size
    if (next.label == null && label) next.label = label
    if (next.groupField == null && group) next.groupField = group
  }
  if (componentType === 'HistogramChart' && next.value == null && value) {
    next.value = value
  }
  if (componentType === 'SankeyChart') {
    const source = encodedField(encoding, 'source', 'from')
    const target = encodedField(encoding, 'target', 'to')
    if (next.source == null && source) next.source = source
    if (next.target == null && target) next.target = target
    if (next.value == null && value) next.value = value
  }
}

function applyLongFormChartGrouping(componentType: string, next: Record<string, unknown>) {
  if (!['AreaChart', 'BarChart', 'LineChart'].includes(componentType)) return
  if (!Array.isArray(next.data)) return
  const x = fieldRef(next.x)
  const yFields = fieldRefList(next.y)
  const seriesBy = fieldRef(next.seriesBy) ?? fieldRef(next.colorBy) ?? fieldRef(next.groupBy)
  if (!x || yFields.length !== 1 || !seriesBy) return
  const pivoted = pivotLongFormSeries(next.data, x, yFields[0], seriesBy)
  if (!pivoted) return
  next.data = pivoted.data
  next.y = pivoted.y
  if (componentType === 'BarChart' && next.stacked == null) next.stacked = false
}

function rowsFromSeriesData(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0) return []
  const rows = value.map(toRecord)
  return rows.every(row => Object.keys(row).length > 0) ? rows : []
}

function uniqueSeriesName(record: Record<string, unknown>, index: number, used: Set<string>) {
  const base = String(record.name ?? record.y ?? record.yField ?? record.key ?? `series_${index + 1}`).trim() || `series_${index + 1}`
  let name = base
  for (let suffix = 2; used.has(name); suffix += 1) name = `${base}_${suffix}`
  used.add(name)
  return name
}

function rowsFromXYSeriesRecords(seriesRecords: Array<Record<string, unknown>>) {
  if (!seriesRecords.length || !seriesRecords.every(series => Array.isArray(series.data))) return null
  const used = new Set<string>()
  const seriesNames = seriesRecords.map((series, index) => uniqueSeriesName(series, index, used))
  const rowsByX = new Map<string, Record<string, unknown>>()

  for (const [seriesIndex, series] of seriesRecords.entries()) {
    const values = Array.isArray(series.data) ? series.data : []
    for (const item of values) {
      const point = toRecord(item)
      const x = point.x ?? point.label ?? point.name ?? point.category
      const y = point.y ?? point.value
      if (x === undefined || y === undefined) return null
      const key = String(x)
      const row = rowsByX.get(key) ?? { x }
      row[seriesNames[seriesIndex] ?? `series_${seriesIndex + 1}`] = y
      rowsByX.set(key, row)
    }
  }

  const rows = Array.from(rowsByX.values())
  return rows.length ? { rows, seriesNames } : null
}

function mapTextProps(props: Record<string, unknown>) {
  const next = { ...props }
  if (next.content == null && next.text != null) next.content = String(next.text)
  if (next.content == null && next.value != null) next.content = String(next.value)
  if (next.content != null && (next.prefix != null || next.suffix != null)) {
    next.content = `${next.prefix ?? ''}${String(next.content)}${next.suffix ?? ''}`
  }
  if (next.variant === 'section') next.variant = 'heading'
  if (next.variant === 'subtle') next.variant = 'caption'
  if (['h1', 'h2', 'h3', 'h4', 'h5'].includes(String(next.variant))) next.variant = 'heading'
  if (typeof next.size === 'string') {
    const sizeMap: Record<string, number> = {
      xs: 11,
      sm: 12,
      md: 14,
      base: 14,
      lg: 18,
      xl: 22,
      '2xl': 28,
    }
    next.size = sizeMap[next.size] ?? next.size
  }
  return next
}

function mapMarkdownProps(props: Record<string, unknown>) {
  const next = { ...props }
  if (next.content == null && next.markdown != null) next.content = String(next.markdown)
  if (next.content == null && next.text != null) next.content = String(next.text)
  if (next.content == null && next.value != null) next.content = String(next.value)
  if (next.content == null && next.label != null) next.content = String(next.label)
  if (
    next.content == null &&
    next.children != null &&
    !Array.isArray(next.children) &&
    (typeof next.children !== 'object' || next.children === null)
  ) {
    next.content = String(next.children)
  }
  delete next.markdown
  delete next.text
  delete next.value
  delete next.label
  delete next.children
  return next
}

function mapButtonProps(props: Record<string, unknown>) {
  const next = { ...props }
  if (next.label == null && next.text != null) next.label = String(next.text)
  const variant = typeof next.variant === 'string' ? next.variant.trim().toLowerCase() : ''
  if (variant === 'default' || variant === 'outline') next.variant = 'secondary'
  else if (variant && !['primary', 'secondary', 'ghost'].includes(variant)) next.variant = 'primary'
  const actionIntent = normalizeActionIntent(next.action ?? next.onClick ?? next.onPress ?? next.onSubmit)
  if (actionIntent.name) {
    next.action = actionIntent.name
    const params = {
      ...toRecord(next.params),
      ...toRecord(next.actionParams),
      ...(actionIntent.params ?? {}),
    }
    if (Object.keys(params).length) next.actionParams = params
  }
  delete next.params
  delete next.onClick
  delete next.onPress
  delete next.onSubmit
  return next
}

function normalizeFormFieldName(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || fallback
}

function normalizeFormFieldType(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  const aliases: Record<string, string> = {
    textArea: 'textarea',
    text_area: 'textarea',
    dropdown: 'select',
    combobox: 'select',
    range: 'slider',
    range_input: 'slider',
    rangeInput: 'slider',
    datetimeLocal: 'datetime',
    datetime_local: 'datetime',
  }
  return aliases[text] ?? (text || 'text')
}

function mapFormBuilderProps(props: Record<string, unknown>) {
  const next = { ...props }
  const used = new Set<string>()
  if (Array.isArray(next.fields)) {
    next.fields = next.fields.map((field, index) => {
      const record = toRecord(field)
      const baseName = normalizeFormFieldName(
        record.name ?? record.key ?? record.id ?? record.field ?? record.value ?? record.label ?? record.title,
        `field_${index + 1}`,
      )
      let name = baseName
      for (let suffix = 2; used.has(name); suffix += 1) name = `${baseName}_${suffix}`
      used.add(name)
      return {
        ...record,
        name,
        type: normalizeFormFieldType(record.type),
      }
    })
  }
  return next
}

function firstTaskValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return undefined
}

function normalizeGanttTask(item: unknown, index: number) {
  const record = toRecord(item)
  const name = String(
    firstTaskValue(record, ['name', 'title', 'label', 'task', 'activity', 'milestone'])
      ?? `Task ${index + 1}`,
  )
  const id = String(firstTaskValue(record, ['id', 'key', 'taskId']) ?? name ?? `task_${index + 1}`)
  const dependencies = Array.isArray(record.dependencies)
    ? record.dependencies.map(String).filter(Boolean)
    : typeof record.dependency === 'string'
      ? [record.dependency]
      : typeof record.dependsOn === 'string'
        ? [record.dependsOn]
        : undefined

  return {
    ...record,
    id,
    name,
    start: firstTaskValue(record, ['start', 'startDate', 'begin', 'from', 'date']),
    end: firstTaskValue(record, ['end', 'endDate', 'finish', 'due', 'to']),
    duration: firstTaskValue(record, ['duration', 'days', 'length']),
    progress: firstTaskValue(record, ['progress', 'percent', 'completion']),
    ...(dependencies ? { dependencies } : {}),
  }
}

function mapGanttChartProps(props: Record<string, unknown>) {
  const next: Record<string, unknown> = { ...props, type: props.type ?? 'gantt' }
  const rawTasks = Array.isArray(next.tasks)
    ? next.tasks
    : Array.isArray(next.data)
      ? next.data
      : Array.isArray(next.items)
        ? next.items
        : Array.isArray(next.rows)
          ? next.rows
          : []
  if (rawTasks.length) next.tasks = rawTasks.map(normalizeGanttTask)
  return next
}

function normalizeActionIntent(value: unknown): { name?: string; params?: Record<string, unknown> } {
  if (typeof value === 'string' && value.trim()) return { name: value.trim() }
  const record = toRecord(value)
  const event = toRecord(record.event)
  const functionCall = toRecord(record.functionCall)
  const name = [
    record.name,
    record.type,
    record.action,
    record.call,
    event.name,
    event.type,
    functionCall.name,
    functionCall.call,
  ].find(item => typeof item === 'string' && item.trim()) as string | undefined
  const passthroughParams = Object.fromEntries(
    Object.entries(record).filter(([key, item]) => ![
      'name',
      'type',
      'action',
      'call',
      'event',
      'functionCall',
      'params',
      'args',
      'payload',
    ].includes(key) && item !== undefined),
  )
  const params = toRecord(record.params)
  const args = toRecord(record.args)
  const payload = toRecord(record.payload)
  const eventPayload = toRecord(event.payload)
  const functionArgs = toRecord(functionCall.args)
  const mergedParams = { ...passthroughParams, ...params, ...args, ...payload, ...eventPayload, ...functionArgs }
  return {
    name: name?.trim(),
    params: Object.keys(mergedParams).length ? mergedParams : undefined,
  }
}

function mapTabsProps(props: Record<string, unknown>) {
  const next = { ...props }
  if (!Array.isArray(next.tabs) && Array.isArray(next.items)) next.tabs = next.items
  if (Array.isArray(next.tabs)) {
    next.tabs = next.tabs.map((tab, index) => {
      const record = toRecord(tab)
      const label = String(record.label ?? record.title ?? record.name ?? record.key ?? record.value ?? `Tab ${index + 1}`)
      const key = String(record.key ?? record.id ?? record.value ?? label)
      return {
        ...record,
        label,
        key,
      }
    })
  }
  if (next.activeTab == null && next.activeKey != null) next.activeTab = String(next.activeKey)
  return next
}

function mapKpiDashboardProps(props: Record<string, unknown>) {
  const next: Record<string, unknown> = { ...props, type: props.type ?? 'kpi_dashboard' }
  const formatPercentNumber = (value: unknown) => {
    if (typeof value === 'string' && value.trim().endsWith('%')) return value.trim().replace(/%$/, '')
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (!Number.isFinite(numeric)) return value
    const percent = Math.abs(numeric) <= 1 ? numeric * 100 : numeric
    return Number(percent.toFixed(2))
  }
  const formatPlainNumber = (value: unknown) => {
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (!Number.isFinite(numeric)) return value
    return Number(numeric.toFixed(2))
  }
  const hasExplicitUnit = (value: unknown) => /(%|pct|pp|个百分点)\s*$/i.test(String(value).trim())
  const shouldFormatDeltaAsPercent = (label: string, unit: string, value: unknown, metricFormat: string) => {
    if (unit === '%') return true
    if (typeof value === 'string' && value.trim().endsWith('%')) return false
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (/(环比|同比|增速|增长率|变化率|rate|percent|pct|%)/i.test(label)) return true
    if (/(较上月|较去年|较同期)/.test(label) && Number.isFinite(numeric) && Math.abs(numeric) <= 1 && metricFormat !== 'percent') return true
    if (/(较上月|较去年|较同期)/.test(label) && metricFormat === 'percent' && Number.isFinite(numeric) && Math.abs(numeric) <= 0.05) return true
    return false
  }
  const mapMetric = (item: unknown) => {
    const record = toRecord(item)
    const format = typeof record.format === 'string' ? record.format : ''
    const trendDirection = record.trend === 'up' || record.trend === 'down' || record.trend === 'flat'
      ? record.trend
      : undefined
    const trendAsValue = trendDirection ? undefined : record.trend
    const delta = record.trendValue ?? record.trendLabel ?? record.subtitle ?? record.description ?? record.change ?? record.delta ?? trendAsValue
    const deltaRecord = toRecord(delta)
    const deltaValue = Object.keys(deltaRecord).length
      ? deltaRecord.value ?? deltaRecord.amount ?? deltaRecord.delta ?? deltaRecord.change
      : delta
    const deltaUnit = typeof deltaRecord.unit === 'string' ? deltaRecord.unit : ''
    const deltaUnitLower = deltaUnit.toLowerCase()
    const deltaIsPercentagePoint = deltaUnitLower === 'pct' || deltaUnitLower === 'pp' || deltaUnit === '百分点'
    const deltaDirection = typeof deltaRecord.direction === 'string' ? deltaRecord.direction : undefined
    const deltaLabel = typeof record.deltaLabel === 'string' ? record.deltaLabel : ''
    const numericDelta = typeof deltaValue === 'number' ? deltaValue : typeof deltaValue === 'string' ? Number(deltaValue) : Number.NaN
    const textualDelta = String(deltaValue ?? '')
    const textualDeltaDirection = /^[+\s]*[+↑]/u.test(textualDelta) || /增长|上升|提升|增加/i.test(textualDelta)
      ? 'up'
      : /^[-\s]*[-↓]/u.test(textualDelta) || /下降|下滑|降低|减少/i.test(textualDelta)
        ? 'down'
        : undefined
    const valueWantsPercent = format === 'percent' || record.suffix === '%' || record.unit === '%'
    const valueWantsCny = format === 'currencyCNY' || (format === 'currency' && record.currency === 'CNY')
    const rawValue = record.value ?? record.metric ?? record.amount ?? record.count ?? record.total ?? record.score ?? ''
    const value = valueWantsPercent ? formatPercentNumber(rawValue) : rawValue
    const deltaWantsPercent = deltaValue != null && !deltaIsPercentagePoint && shouldFormatDeltaAsPercent(`${record.label ?? ''}${deltaLabel}`, deltaUnit, deltaValue, format)
    const formattedDeltaValue = deltaIsPercentagePoint ? formatPlainNumber(deltaValue) : deltaWantsPercent ? formatPercentNumber(deltaValue) : deltaValue
    const deltaSuffix = deltaValue != null && !hasExplicitUnit(formattedDeltaValue)
      ? deltaIsPercentagePoint
        ? '个百分点'
        : deltaWantsPercent
        ? '%'
        : deltaUnit && !String(deltaValue).endsWith(deltaUnit)
          ? deltaUnit
          : ''
      : ''
    return {
      ...record,
      label: String(record.label ?? record.name ?? record.title ?? ''),
      value,
      prefix: record.prefix,
      suffix: record.suffix ?? record.unit ?? (valueWantsCny ? '元' : format === 'percent' ? '%' : undefined),
      trend: trendDirection
        ?? (deltaDirection === 'up' || deltaDirection === 'down' || deltaDirection === 'flat' ? deltaDirection : undefined)
        ?? textualDeltaDirection
        ?? (Number.isFinite(numericDelta) ? numericDelta < 0 ? 'down' : numericDelta > 0 ? 'up' : 'flat' : undefined),
      trendValue: deltaValue == null ? undefined : [deltaLabel, `${String(formattedDeltaValue)}${deltaSuffix}`].filter(Boolean).join(' '),
      color: record.color,
    }
  }
  if (Array.isArray(next.metrics)) {
    next.metrics = next.metrics.map(mapMetric).filter(item => item.label)
  }
  if (!Array.isArray(next.metrics)) {
    const metricSource = Array.isArray(next.items)
      ? next.items
      : Array.isArray(next.cards)
        ? next.cards
        : undefined
    if (metricSource) next.metrics = metricSource.map(mapMetric).filter(item => item.label)
  }
  return next
}

function mapTabularRows(props: Record<string, unknown>) {
  if (!Array.isArray(props.rows)) return props
  const rows = props.rows
  const next: Record<string, unknown> = { ...props }
  const rawColumns = Array.isArray(next.columns) ? next.columns : []
  const columnKeys = rawColumns.map((column, index) => {
    if (typeof column === 'string') return column
    const record = toRecord(column)
    return String(record.key ?? record.field ?? record.accessor ?? record.dataIndex ?? record.id ?? record.name ?? record.label ?? record.title ?? record.header ?? `col_${index + 1}`)
  })
  if (!Array.isArray(next.data)) {
    next.data = rows.map((row: unknown) => {
      if (!Array.isArray(row)) return toRecord(row)
      return Object.fromEntries(columnKeys.map((key, index) => [key, row[index]]))
    })
  }
  if (rawColumns.some(column => typeof column === 'string')) {
    next.columns = columnKeys.map(key => ({ key, label: key }))
  }
  return next
}

function mapDataTableProps(props: Record<string, unknown>) {
  const rowMapped = mapTabularRows(props)
  const next: Record<string, unknown> = { ...rowMapped, type: props.type ?? 'table' }
  if (!Array.isArray(next.data) && Array.isArray(next.items)) next.data = next.items
  const rawColumns = Array.isArray(next.columns) ? next.columns : []
  const columnKeys = rawColumns.map((column, index) => {
    if (typeof column === 'string') return column
    const record = toRecord(column)
    return String(record.key ?? record.field ?? record.accessor ?? record.dataIndex ?? record.id ?? record.name ?? record.label ?? record.title ?? record.header ?? `col_${index + 1}`)
  })
  if (Array.isArray(next.data) && next.data.some(row => Array.isArray(row)) && columnKeys.length) {
    next.data = next.data.map((row: unknown) => {
      if (!Array.isArray(row)) return toRecord(row)
      return Object.fromEntries(columnKeys.map((key, index) => [key, row[index]]))
    })
  }
  if (rawColumns.length) {
    next.columns = rawColumns.map((column, index) => {
      if (typeof column === 'string') return { key: columnKeys[index] ?? column, label: column }
      const record = toRecord(column)
      const key = columnKeys[index] ?? `col_${index + 1}`
      return {
        ...record,
        key,
        label: String(record.label ?? record.title ?? record.header ?? record.name ?? record.key ?? record.field ?? record.accessor ?? record.dataIndex ?? key),
      }
    })
  }
  return next
}

function mapChartProps(componentType: string, props: Record<string, unknown>) {
  const next = { ...props }
  applyChartIntent(componentType, next)
  const agenuiData = toRecord(next.data)
  const agenuiSeries = Array.isArray(agenuiData.series)
    ? agenuiData.series.map(toRecord).filter(series => Object.keys(series).length)
    : []
  const agenuiXAxis = axisData(agenuiData.xAxis)
  const agenuiCategories = axisData(agenuiData.categories)
  if (agenuiSeries.length && componentType === 'PieChart') {
    const firstSeries = agenuiSeries[0]
    const seriesData = Array.isArray(firstSeries.data) ? firstSeries.data : []
    next.data = seriesData.map((item, index) => {
      const record = toRecord(item)
      return {
        label: String(record.label ?? record.name ?? record.category ?? `item_${index + 1}`),
        value: Number(record.value ?? record.y ?? item),
      }
    })
    if (next.label == null) next.label = 'label'
    if (next.value == null) next.value = 'value'
  } else if ((agenuiXAxis || agenuiCategories) && agenuiSeries.some(series => Array.isArray(series.data))) {
    const labels = agenuiXAxis ?? agenuiCategories ?? []
    const seriesNames = agenuiSeries.map((series, index) => {
      const name = typeof series.name === 'string' && series.name.trim()
        ? series.name.trim()
        : `series_${index + 1}`
      return name
    })
    next.data = labels.map((label, rowIndex) => {
      const row: Record<string, unknown> = { label }
      for (const [seriesIndex, series] of agenuiSeries.entries()) {
        const values = Array.isArray(series.data) ? series.data : []
        const value = values[rowIndex]
        const valueRecord = toRecord(value)
        row[seriesNames[seriesIndex] ?? `series_${seriesIndex + 1}`] =
          'value' in valueRecord ? valueRecord.value : value
      }
      return row
    })
    next.x = 'label'
    next.y = seriesNames
  }
  const chartJsLabels = Array.isArray(agenuiData.labels) ? agenuiData.labels : null
  const chartJsDatasets = Array.isArray(agenuiData.datasets)
    ? agenuiData.datasets.map(toRecord).filter(dataset => Array.isArray(dataset.data))
    : []
  if (!Array.isArray(next.data) && chartJsLabels && chartJsDatasets.length) {
    const seriesNames = chartJsDatasets.map((dataset, index) => {
      const name = typeof dataset.label === 'string' && dataset.label.trim()
        ? dataset.label.trim()
        : typeof dataset.name === 'string' && dataset.name.trim()
          ? dataset.name.trim()
          : `series_${index + 1}`
      return name
    })
    next.data = chartJsLabels.map((label, rowIndex) => {
      const row: Record<string, unknown> = { label }
      for (const [seriesIndex, dataset] of chartJsDatasets.entries()) {
        const values = Array.isArray(dataset.data) ? dataset.data : []
        const value = values[rowIndex]
        const valueRecord = toRecord(value)
        row[seriesNames[seriesIndex] ?? `series_${seriesIndex + 1}`] =
          'value' in valueRecord ? valueRecord.value : value
      }
      return row
    })
    next.x = 'label'
    next.y = seriesNames
  }
  const seriesValues = Array.isArray(next.series) ? next.series : []
  const seriesRecords = seriesValues
    .map(toRecord)
    .filter(series => Object.keys(series).length)
  const normalizedSeries = toSeriesEntries(next.series)
  const xySeriesRows = rowsFromXYSeriesRecords(seriesRecords)
  if (!Array.isArray(next.data) && xySeriesRows) {
    next.data = xySeriesRows.rows
    next.x = 'x'
    next.y = xySeriesRows.seriesNames
    if (componentType === 'ComboChart') {
      next.series = seriesRecords.map((series, index) => ({
        type: series.type === 'bar' || series.type === 'line' || series.type === 'scatter' ? series.type : index === 0 ? 'bar' : 'line',
        y: xySeriesRows.seriesNames[index] ?? `series_${index + 1}`,
        ...(typeof series.size === 'string' && series.size.length ? { size: series.size } : {}),
        ...(typeof series.sizeField === 'string' && series.sizeField.length ? { size: series.sizeField } : {}),
        ...(typeof series.r === 'string' && series.r.length ? { size: series.r } : {}),
        ...(typeof series.yAxisIndex === 'number' && Number.isFinite(series.yAxisIndex) ? { yAxisIndex: series.yAxisIndex } : {}),
      }))
    }
  }
  if (!Array.isArray(next.data) && seriesRecords.length === 1) {
    const inlineRows = rowsFromSeriesData(seriesRecords[0].data)
    if (inlineRows.length) next.data = inlineRows
  }
  if (!Array.isArray(next.data) && Array.isArray(next.points)) {
    next.data = next.points.map(item => toRecord(item)).filter(point => Object.keys(point).length)
    if (componentType === 'ScatterChart' || componentType === 'BubbleChart') {
      if (next.x == null) next.x = 'x'
      if (next.y == null) next.y = 'y'
      if (next.size == null) next.size = 'size'
      if (next.label == null) next.label = 'label'
    }
  }
  if (
    !Array.isArray(next.data)
    && seriesRecords.length
    && seriesRecords.every(series => (series.label != null || series.name != null || series.category != null) && series.value != null)
  ) {
    next.data = seriesRecords.map((series, index) => ({
      label: String(series.label ?? series.name ?? series.category ?? `item_${index + 1}`),
      value: series.value,
    }))
    if (next.x == null) next.x = 'label'
    if (next.y == null) next.y = 'value'
    if (next.label == null) next.label = 'label'
    if (next.value == null) next.value = 'value'
  }
  const labelValues = Array.isArray(next.x)
    ? next.x
    : axisData(next.xAxis)
      ? axisData(next.xAxis)
    : Array.isArray(next.labels)
      ? next.labels
      : Array.isArray(next.xLabels)
        ? next.xLabels
        : Array.isArray(next.categories)
          ? next.categories
          : null
  if (!Array.isArray(next.data) && labelValues && seriesRecords.some(series => Array.isArray(series.data))) {
      const seriesNames = seriesRecords
      .map((series, index) => String(series.name ?? series.y ?? series.yField ?? series.key ?? `series_${index + 1}`))
      .filter(Boolean)
    next.data = labelValues.map((label, rowIndex) => {
      const row: Record<string, unknown> = { label }
      for (const [seriesIndex, series] of seriesRecords.entries()) {
        const name = seriesNames[seriesIndex] ?? `series_${seriesIndex + 1}`
        row[name] = Array.isArray(series.data) ? series.data[rowIndex] : undefined
      }
      return row
    })
    next.x = 'label'
    next.y = seriesNames
    if (componentType === 'ComboChart') {
      next.series = seriesRecords.map((series, index) => ({
        type: series.type === 'bar' || series.type === 'line' || series.type === 'scatter' ? series.type : index === 0 ? 'bar' : 'line',
        y: seriesNames[index] ?? `series_${index + 1}`,
        ...(typeof series.size === 'string' && series.size.length ? { size: series.size } : {}),
        ...(typeof series.sizeField === 'string' && series.sizeField.length ? { size: series.sizeField } : {}),
        ...(typeof series.r === 'string' && series.r.length ? { size: series.r } : {}),
      }))
    }
  }
  const defaultChartType: Record<string, string> = {
    AreaChart: 'area',
    BarChart: 'bar',
    BoxplotChart: 'boxplot',
    BubbleChart: 'bubble',
    CalendarChart: 'calendar',
    ComboChart: 'combo',
    DumbbellChart: 'dumbbell',
    FunnelChart: 'funnel',
    HeatmapChart: 'heatmap',
    HistogramChart: 'histogram',
    LineChart: 'line',
    PieChart: 'pie',
    RadarChart: 'radar',
    SankeyChart: 'sankey',
    ScatterChart: 'scatter',
    SparklineChart: 'sparkline',
    WaterfallChart: 'waterfall',
    XmrChart: 'xmr',
  }
  if (next.type == null && defaultChartType[componentType]) next.type = defaultChartType[componentType]

  const labelField = firstStringValue(
    next.label,
    next.labelField,
    next.labelKey,
    next.nameField,
    next.nameKey,
    next.categoryField,
    next.categoryKey,
  )
  const groupField = firstStringValue(
    next.groupField,
    next.groupKey,
    next.group,
  )
  const dateField = firstStringValue(
    next.dateField,
    next.dateKey,
    next.date,
  )
  const xField = firstStringValue(
    next.x,
    next.xField,
    next.xKey,
    next.xAxisKey,
    next.xAxisField,
    axisField(next.xAxis),
    next.dimensionField,
    next.dimensionKey,
    next.category,
    next.categoryField,
    next.categoryKey,
    next.label,
    next.labelField,
    next.labelKey,
    next.nameField,
    next.nameKey,
    next.groupField,
    next.groupKey,
    next.dateField,
    next.dateKey,
  )
  const valueField = firstStringValue(
    next.value,
    next.valueField,
    next.valueKey,
    next.metricField,
    next.metricKey,
    next.measureField,
    next.measureKey,
    next.countField,
    next.countKey,
    next.frequencyField,
    next.frequencyKey,
  )
  const yField = firstStringValue(
    next.y,
    next.yField,
    next.yKey,
    next.yAxisKey,
    next.yAxisField,
    axisField(next.yAxis),
    valueField,
  )
  const yFields = [
    ...fieldList(next.yAxis),
    ...fieldList(next.yFields),
    ...fieldList(next.valueFields),
    ...fieldList(next.metricFields),
    ...fieldList(next.measureFields),
  ]

  if (next.x == null && xField) next.x = xField
  if (componentType === 'PieChart') {
    setStringAlias(next, 'label', labelField, xField)
    setStringAlias(next, 'value', valueField, yField)
  }
  if (componentType === 'FunnelChart' || componentType === 'WaterfallChart' || componentType === 'XmrChart') {
    setStringAlias(next, 'label', labelField, xField)
    setStringAlias(next, 'value', valueField, yField)
  }
  if (componentType === 'CalendarChart') {
    setStringAlias(next, 'dateField', dateField, xField)
    setStringAlias(next, 'valueField', valueField, yField)
  }
  if (componentType === 'HeatmapChart') {
    setStringAlias(next, 'xField', xField)
    setStringAlias(next, 'yField', yField)
    setStringAlias(next, 'valueField', valueField)
  }
  if (componentType === 'BoxplotChart') {
    setStringAlias(next, 'groupField', groupField, xField)
    setStringAlias(next, 'valueField', valueField, yField)
  }
  if (componentType === 'DumbbellChart') {
    const lowField = firstStringValue(next.low, next.lowField, next.minField, next.startField, next.fromField, next.beforeField)
    const highField = firstStringValue(next.high, next.highField, next.maxField, next.endField, next.toField, next.afterField)
    setStringAlias(next, 'groupField', groupField, xField)
    setStringAlias(next, 'low', lowField)
    setStringAlias(next, 'high', highField)
    if (next.y == null && lowField && highField) next.y = [lowField, highField]
  }
  if (componentType === 'ScatterChart' || componentType === 'BubbleChart') {
    const sizeField = firstStringValue(next.size, next.sizeField, next.sizeKey, next.r, next.rField, next.radiusField, next.radiusKey)
    setStringAlias(next, 'size', sizeField)
    setStringAlias(next, 'label', labelField, groupField)
  }
  if (componentType === 'SankeyChart') {
    const sourceField = firstStringValue(next.source, next.sourceField, next.sourceKey, next.from, next.fromField, next.fromKey)
    const targetField = firstStringValue(next.target, next.targetField, next.targetKey, next.to, next.toField, next.toKey)
    const sankeyValueField = firstStringValue(next.value, next.valueField, next.valueKey, valueField, yField)
    if (Array.isArray(next.data) && (sourceField || targetField || sankeyValueField)) {
      next.data = next.data.map(item => {
        const row = toRecord(item)
        if (!Object.keys(row).length) return item
        return {
          ...row,
          ...(row.source == null && sourceField && row[sourceField] != null ? { source: row[sourceField] } : {}),
          ...(row.target == null && targetField && row[targetField] != null ? { target: row[targetField] } : {}),
          ...(row.value == null && sankeyValueField && row[sankeyValueField] != null ? { value: row[sankeyValueField] } : {}),
        }
      })
    }
  }
  if (next.y == null) {
    if (yFields.length) next.y = yFields
    else if (yField) next.y = yField
    else if (normalizedSeries.length) next.y = normalizedSeries.map(series => series.y)
    else {
      const seriesFields = [
        ...toSeriesEntries(next.barSeries, 'bar').map(series => series.y),
        ...toStringArray(next.bar),
        ...toStringArray(next.barFields),
        ...toStringArray(next.barField),
        ...toSeriesEntries(next.lineSeries, 'line').map(series => series.y),
        ...toStringArray(next.line),
        ...toStringArray(next.lineFields),
        ...toStringArray(next.lineField),
        ...toSeriesEntries(next.scatterSeries, 'scatter').map(series => series.y),
        ...toStringArray(next.scatter),
        ...toStringArray(next.scatterFields),
        ...toStringArray(next.scatterField),
      ]
      if (seriesFields.length) next.y = Array.from(new Set(seriesFields))
    }
  }
  if (componentType === 'ComboChart' && !Array.isArray(next.series)) {
    const barSeries = [
      ...toSeriesEntries(next.barSeries, 'bar'),
      ...toStringArray(next.bar).map(y => ({ type: 'bar' as const, y })),
      ...toStringArray(next.barFields).map(y => ({ type: 'bar' as const, y })),
      ...toStringArray(next.barField).map(y => ({ type: 'bar' as const, y })),
    ]
    const lineSeries = [
      ...toSeriesEntries(next.lineSeries, 'line'),
      ...toStringArray(next.line).map(y => ({ type: 'line' as const, y })),
      ...toStringArray(next.lineFields).map(y => ({ type: 'line' as const, y })),
      ...toStringArray(next.lineField).map(y => ({ type: 'line' as const, y })),
    ]
    const scatterSeries = [
      ...toSeriesEntries(next.scatterSeries, 'scatter'),
      ...toStringArray(next.scatter).map(y => ({ type: 'scatter' as const, y })),
      ...toStringArray(next.scatterFields).map(y => ({ type: 'scatter' as const, y })),
      ...toStringArray(next.scatterField).map(y => ({ type: 'scatter' as const, y })),
    ]
    const series = [
      ...barSeries,
      ...lineSeries,
      ...scatterSeries,
    ]
    if (series.length) next.series = series
  }
  if (componentType === 'ComboChart' && normalizedSeries.length) {
    next.series = normalizedSeries
  }
  if (Array.isArray(next.data)) {
    next.data = coerceGroupedNumericCells(next.data)
    applyLongFormChartGrouping(componentType, next)
  }
  return next
}

/**
 * Thousands-separated numeric string, e.g. "1,234" or "-2,000.5". Agents very
 * commonly emit pre-formatted numbers; chart builders coerce with `Number(x)`,
 * which turns "1,234" into NaN→0 and silently produces an all-zero/empty chart.
 * We strip the separators here, at the single chart-data normalization point,
 * so every builder receives a real number. Plain category labels (e.g. "2024",
 * "北京", "2.1%") never match this pattern and are left untouched.
 */
const GROUPED_NUMERIC_STRING = /^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/

function coerceGroupedNumericCells(data: unknown[]): unknown[] {
  let changed = false
  const next = data.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item
    let rowChanged = false
    const row = item as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && GROUPED_NUMERIC_STRING.test(value.trim())) {
        out[key] = Number(value.trim().replace(/,/g, ''))
        rowChanged = true
      } else {
        out[key] = value
      }
    }
    if (rowChanged) changed = true
    return rowChanged ? out : item
  })
  return changed ? next : data
}

function normalizeElementProps(
  componentType: string | undefined,
  props: Record<string, unknown>,
) {
  switch (componentType) {
    case 'Text':
      return mapTextProps(props)
    case 'Markdown':
      return mapMarkdownProps(props)
    case 'Button':
      return mapButtonProps(props)
    case 'Tabs':
      return mapTabsProps(props)
    case 'KpiDashboard':
      return mapKpiDashboardProps(props)
    case 'DataTable':
      return mapDataTableProps(props)
    case 'FormBuilder':
      return mapFormBuilderProps(props)
    case 'GanttChart':
      return mapGanttChartProps(props)
    case 'AreaChart':
    case 'BarChart':
    case 'BoxplotChart':
    case 'BubbleChart':
    case 'CalendarChart':
    case 'ComboChart':
    case 'DumbbellChart':
    case 'FunnelChart':
    case 'HeatmapChart':
    case 'HistogramChart':
    case 'LineChart':
    case 'PieChart':
    case 'RadarChart':
    case 'SankeyChart':
    case 'ScatterChart':
    case 'SparklineChart':
    case 'WaterfallChart':
    case 'XmrChart':
      return mapChartProps(componentType, props)
    default:
      return props
  }
}

function isBindStateExpression(value: unknown): value is { $bindState: string } {
  const record = toRecord(value)
  return typeof record.$bindState === 'string' && record.$bindState.startsWith('/')
}

function pathSegments(path: string) {
  return path.split('/').filter(Boolean)
}

function getAtPath(record: Record<string, unknown>, path: string): unknown {
  let current: unknown = record
  for (const segment of pathSegments(path)) {
    if (!toRecord(current)) return undefined
    current = toRecord(current)[segment]
  }
  return current
}

function setAtPath(record: Record<string, unknown>, path: string, value: unknown) {
  const segments = pathSegments(path)
  let current = record
  for (const [index, segment] of segments.entries()) {
    if (index === segments.length - 1) {
      current[segment] = value
      return
    }
    const next = current[segment]
    if (!next || typeof next !== 'object' || Array.isArray(next)) current[segment] = {}
    current = toRecord(current[segment])
  }
}

const DATA_TEMPLATE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g

function statePathSegments(expression: string) {
  const normalized = expression
    .trim()
    .replace(/^\$\.?/, '')
    .replace(/^(state|data|dataModel)\.?/, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .replace(/^\//, '')
  return normalized.split(/[/.]/).map(part => part.trim()).filter(Boolean)
}

function getTemplateValue(state: Record<string, unknown>, expression: string) {
  let current: unknown = state
  for (const segment of statePathSegments(expression)) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function resolveTemplateString(value: string, state: Record<string, unknown>) {
  const matches = Array.from(value.matchAll(DATA_TEMPLATE_PATTERN))
  if (!matches.length) return value

  if (matches.length === 1 && matches[0][0] === value.trim()) {
    const resolved = getTemplateValue(state, matches[0][1])
    return resolved === undefined ? value : resolved
  }

  return value.replace(DATA_TEMPLATE_PATTERN, (match, expression) => {
    const resolved = getTemplateValue(state, expression)
    return resolved === undefined ? match : String(resolved)
  })
}

function resolveDataTemplates(value: unknown, state: Record<string, unknown>): unknown {
  if (typeof value === 'string') return resolveTemplateString(value, state)
  if (Array.isArray(value)) return value.map(item => resolveDataTemplates(item, state))
  const record = toRecord(value)
  if (!record || !Object.keys(record).length) return value
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, resolveDataTemplates(item, state)]),
  )
}

function formStatePathForElement(id: string) {
  const safeId = id.replace(/[^A-Za-z0-9_-]+/g, '_') || 'form'
  return `/_forms/${safeId}`
}

function chartStatePathForElement(id: string) {
  const safeId = id.replace(/[^A-Za-z0-9_-]+/g, '_') || 'chart'
  return `/_charts/${safeId}/selectedPoint`
}

const INTERACTIVE_CHART_TYPES = new Set([
  'BarChart',
  'AreaChart',
  'LineChart',
  'PieChart',
  'ScatterChart',
  'BubbleChart',
  'BoxplotChart',
  'HistogramChart',
  'WaterfallChart',
  'XmrChart',
  'SankeyChart',
  'FunnelChart',
  'HeatmapChart',
  'CalendarChart',
  'SparklineChart',
  'ComboChart',
  'DumbbellChart',
  'RadarChart',
])

function isInteractiveChart(type: string | undefined) {
  return typeof type === 'string' && INTERACTIVE_CHART_TYPES.has(type)
}

const FLEXIBLE_ROW_CONTAINER_TYPES = new Set(['Card', 'Container'])
const ROW_CHART_CARD_MIN_HEIGHT = 360

function stringChildren(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((child): child is string => typeof child === 'string' && child.length > 0)
    : []
}

function ownProp(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function elementContainsChart(
  id: string,
  elements: NonNullable<VizualSpec['elements']>,
  seen = new Set<string>(),
): boolean {
  if (seen.has(id)) return false
  seen.add(id)
  const element = elements[id]
  if (!element) return false
  if (isInteractiveChart(element.type)) return true
  return stringChildren(element.children).some(childId => elementContainsChart(childId, elements, seen))
}

function rowChildCanReceiveLayoutDefaults(element: NonNullable<VizualSpec['elements']>[string] | undefined): boolean {
  if (!element?.type) return false
  return FLEXIBLE_ROW_CONTAINER_TYPES.has(element.type)
}

function applyLayoutDefaultsToRows(
  elements: NonNullable<VizualSpec['elements']>,
): NonNullable<VizualSpec['elements']> {
  let next = elements

  const updateElementProps = (id: string, patch: Record<string, unknown>) => {
    const current = next[id]
    if (!current) return
    const props = current.props && typeof current.props === 'object' && !Array.isArray(current.props)
      ? { ...(current.props as Record<string, unknown>) }
      : {}
    let changed = false
    for (const [key, value] of Object.entries(patch)) {
      if (!ownProp(props, key) || props[key] == null) {
        props[key] = value
        changed = true
      }
    }
    if (!changed) return
    if (next === elements) next = { ...elements }
    next[id] = { ...current, props }
  }

  for (const [rowId, row] of Object.entries(elements)) {
    if (row?.type !== 'Row') continue
    const children = stringChildren(row.children)
    if (children.length < 2) continue

    const eligibleChildren = children.filter(childId => {
      const child = elements[childId]
      return rowChildCanReceiveLayoutDefaults(child)
    })
    if (eligibleChildren.length < 2) continue

    const rowProps = row.props && typeof row.props === 'object' && !Array.isArray(row.props)
      ? row.props as Record<string, unknown>
      : {}
    if (eligibleChildren.length > 2 && !ownProp(rowProps, 'wrap')) {
      updateElementProps(rowId, { wrap: true })
    }

    for (const childId of eligibleChildren) {
      const child = elements[childId]
      if (!child?.type) continue

      updateElementProps(childId, { flex: '1 1 0', width: 0 })
      if (elementContainsChart(childId, elements)) {
        updateElementProps(childId, { minHeight: ROW_CHART_CARD_MIN_HEIGHT })
      }
    }
  }

  return next
}

const ACTIONABLE_CONTAINER_TYPES = new Set([
  'Button',
  'Card',
  'Column',
  'Container',
  'Row',
])

function deriveFormDefaults(fields: unknown): Record<string, unknown> {
  if (!Array.isArray(fields)) return {}
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const record = toRecord(field)
    const name = typeof record.name === 'string' ? record.name : ''
    if (!name) return acc
    if (record.defaultValue !== undefined) {
      acc[name] = record.defaultValue
      return acc
    }
    if (record.type === 'select' && !record.placeholder) {
      const options = Array.isArray(record.options) ? record.options : []
      const first = options[0]
      if (typeof first === 'string') acc[name] = first
      else {
        const firstRecord = toRecord(first)
        if (firstRecord.value !== undefined) acc[name] = firstRecord.value
      }
    }
    return acc
  }, {})
}

function hydrateDefaultEventBindings(
  id: string,
  element: NonNullable<VizualSpec['elements']>[string],
  props: Record<string, unknown>,
  state: Record<string, unknown>,
) {
  const on = toRecord(element.on)

  if (ACTIONABLE_CONTAINER_TYPES.has(String(element.type))) {
    const actionIntent = normalizeActionIntent(props.action ?? props.onClick ?? props.onPress)
    const params: Record<string, unknown> = {
      ...toRecord(props.actionParams),
      ...(actionIntent.params ?? {}),
    }
    if (actionIntent.name) {
      props.action = actionIntent.name
      if (Object.keys(params).length) props.actionParams = params
    }
    if (actionIntent.name && !on[actionIntent.name]) {
      on[actionIntent.name] = {
        action: actionIntent.name,
        ...(Object.keys(params).length ? { params } : {}),
      }
    }
    delete props.onClick
    delete props.onPress
  }

  if (isInteractiveChart(element.type)) {
    const actionIntent = normalizeActionIntent(props.action ?? props.onPointClick ?? props.onClick ?? 'drillDown')
    const actionName = actionIntent.name ?? 'drillDown'
    const selectedPointPath = isBindStateExpression(props.selectedPoint)
      ? props.selectedPoint.$bindState
      : chartStatePathForElement(id)
    props.action = actionName
    if (!isBindStateExpression(props.selectedPoint)) {
      props.selectedPoint = { $bindState: selectedPointPath }
    }
    if (getAtPath(state, selectedPointPath) === undefined) {
      setAtPath(state, selectedPointPath, null)
    }
    if (!on[actionName]) {
      on[actionName] = {
        action: actionName,
        params: {
          chartId: id,
          point: { $state: selectedPointPath },
          ...(actionIntent.params ?? {}),
        },
      }
    }
  }

  if (element.type === 'FormBuilder') {
    const existingBinding = isBindStateExpression(props.value) ? props.value.$bindState : undefined
    const bindingPath = existingBinding ?? formStatePathForElement(id)
    if (!existingBinding) {
      const explicitValue = toRecord(props.value)
      const defaults = Object.keys(explicitValue).length ? explicitValue : deriveFormDefaults(props.fields)
      props.value = { $bindState: bindingPath }
      if (getAtPath(state, bindingPath) === undefined) setAtPath(state, bindingPath, defaults)
    } else if (getAtPath(state, bindingPath) === undefined) {
      setAtPath(state, bindingPath, deriveFormDefaults(props.fields))
    }
    const submitIntent = normalizeActionIntent(
      props.submitAction ?? props.action ?? props.onSubmit ?? props.onClick ?? 'submitForm',
    )
    const actionName = submitIntent.name ?? 'submitForm'
    const submitParams = {
      ...toRecord(props.actionParams),
      ...(submitIntent.params ?? {}),
    }
    props.action = actionName
    if (Object.keys(submitParams).length) props.actionParams = submitParams
    delete props.submitAction
    delete props.onSubmit
    delete props.onClick
    if (!on.submit) {
      on.submit = {
        action: actionName,
        params: {
          formId: id,
          data: { $bindState: bindingPath },
          ...submitParams,
        },
      }
    }
  }

  return Object.keys(on).length ? on : undefined
}

const RENDERER_TYPE_ALIASES: Record<string, string> = {
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
  mixed: 'ComboChart',
  dumbbell: 'DumbbellChart',
  dumbbellchart: 'DumbbellChart',
  funnel: 'FunnelChart',
  funnelchart: 'FunnelChart',
  gantt: 'GanttChart',
  ganttchart: 'GanttChart',
  heatmap: 'HeatmapChart',
  heatmapchart: 'HeatmapChart',
  histogram: 'HistogramChart',
  histogramchart: 'HistogramChart',
  line: 'LineChart',
  linechart: 'LineChart',
  h1: 'Markdown',
  h2: 'Markdown',
  h3: 'Markdown',
  h4: 'Markdown',
  h5: 'Markdown',
  h6: 'Markdown',
  p: 'Markdown',
  paragraph: 'Markdown',
  span: 'Markdown',
  sliderchange: 'Slider',
  sliderchanged: 'Slider',
  range: 'Slider',
  rangeslider: 'Slider',
  rangesliderinput: 'Slider',
  mermaid: 'MermaidDiagram',
  mermaiddiagram: 'MermaidDiagram',
  kpi: 'KpiDashboard',
  kpicard: 'KpiDashboard',
  kpidashboard: 'KpiDashboard',
  metriccard: 'KpiDashboard',
  org: 'OrgChart',
  orgchart: 'OrgChart',
  organizationchart: 'OrgChart',
  organisationchart: 'OrgChart',
  timeline: 'Timeline',
  hstack: 'Row',
  horizontalstack: 'Row',
  stackhorizontal: 'Row',
  vstack: 'Column',
  verticalstack: 'Column',
  stackvertical: 'Column',
  container: 'Container',
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

function normalizeRendererType(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const text = value.trim()
  return RENDERER_TYPE_ALIASES[text.replace(/\s+/g, '').toLowerCase()] ?? text
}

export function withDefaultElementProps(spec: VizualSpec | undefined | null): VizualSpec {
  if (!spec?.elements) return spec || {}
  const elements = spec.elements
  const state = { ...toRecord(spec.state) }
  const normalizedElements = Object.fromEntries(
    Object.entries(elements).map(([id, element]) => {
      const elementRecord = toRecord(element)
      const rawComponent = typeof elementRecord.component === 'string' ? elementRecord.component : undefined
      const rawType = typeof elementRecord.type === 'string' ? elementRecord.type : undefined
      const componentType = normalizeRendererType(rawComponent) ?? normalizeRendererType(rawType)
      const props = element?.props && typeof element.props === 'object' && !Array.isArray(element.props)
        ? { ...(element.props as Record<string, unknown>) }
        : {}
      if (componentType && props.type == null && rawType && rawType !== componentType) props.type = rawType
      const resolvedProps = resolveDataTemplates(props, state) as Record<string, unknown>
      const normalizedProps = normalizeElementProps(componentType, resolvedProps)
      const nextElement: NonNullable<VizualSpec['elements']>[string] = {
        ...element,
        ...(componentType ? { type: componentType } : {}),
        props: normalizedProps,
      }
      delete (nextElement as Record<string, unknown>).component
      const on = hydrateDefaultEventBindings(id, nextElement, normalizedProps, state)
      if (on) nextElement.on = on
      return [
        id,
        nextElement,
      ]
    }),
  )
  return {
    ...spec,
    state,
    elements: applyLayoutDefaultsToRows(normalizedElements),
  }
}

export function assertNoCyclicChildren(spec: VizualSpec | undefined | null): void {
  const elements = spec?.elements
  const root = spec?.root
  if (!elements || !root) return
  const elementMap = elements

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const path: string[] = []

  function visit(id: string) {
    if (visited.has(id)) return
    if (visiting.has(id)) {
      const start = path.indexOf(id)
      const cycle = [...path.slice(Math.max(start, 0)), id].join(' -> ')
      throw new Error(`VizualSpec contains cyclic children: ${cycle}`)
    }

    const element = elementMap[id]
    if (!element) return

    visiting.add(id)
    path.push(id)
    const children = Array.isArray(element.children) ? element.children : []
    for (const child of children) {
      visit(child)
    }
    path.pop()
    visiting.delete(id)
    visited.add(id)
  }

  visit(root)
}
