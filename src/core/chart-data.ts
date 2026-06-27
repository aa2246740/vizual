export function parseChartNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  let text = value.trim()
  if (!text) return null

  let negative = false
  if (text.startsWith('(') && text.endsWith(')')) {
    negative = true
    text = text.slice(1, -1).trim()
  }

  text = text
    .replace(/\u2212/g, '-')
    .replace(/^[￥¥$]/, '')
    .replace(/[,，\s]/g, '')
    .replace(/(?:%|％|元|万元|亿元|件|分钟|分|家|人|次|笔|户|kg|km|ms|s)$/i, '')

  if (!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(text)) return null
  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return null
  return negative ? -Math.abs(parsed) : parsed
}

export function chartNumberOrZero(value: unknown): number {
  return parseChartNumber(value) ?? 0
}

export function hasNumericChartValue(rows: Array<Record<string, unknown>>, field: string): boolean {
  return rows.some(row => parseChartNumber(row[field]) !== null)
}

export function hasCategoricalChartValue(rows: Array<Record<string, unknown>>, field: string): boolean {
  return rows.some(row => {
    const value = row[field]
    return value !== null && value !== undefined && value !== '' && parseChartNumber(value) === null
  })
}

export function chartCategoryLabels(rows: Array<Record<string, unknown>>, field: string): string[] {
  return rows.map(row => String(row[field] ?? ''))
}
