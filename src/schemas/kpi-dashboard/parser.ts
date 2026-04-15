import type { ParsedSchema } from '../../core/types'

export type KPITrend = 'up' | 'down' | 'flat'

export interface KPIMetric {
  name: string
  value: number
  target: number
  unit: string
  trend: KPITrend
}

export interface KPIDashboardParsed extends ParsedSchema {
  title: string
  metrics: KPIMetric[]
}

const VALID_TRENDS: KPITrend[] = ['up', 'down', 'flat']

export function parseKpiDashboardSchema(input: unknown): KPIDashboardParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, title: '', metrics: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (typeof obj.title !== 'string' || obj.title === '') {
    return { valid: false, title: '', metrics: [], fallback: true, originalInput: input }
  }

  if (!Array.isArray(obj.metrics) || obj.metrics.length === 0) {
    return { valid: false, title: '', metrics: [], fallback: true, originalInput: input }
  }

  const metrics: KPIMetric[] = obj.metrics
    .filter((m: unknown) => m && typeof m === 'object')
    .map((m: Record<string, unknown>) => ({
      name: typeof m.name === 'string' ? m.name : '',
      value: typeof m.value === 'number' ? m.value : 0,
      target: typeof m.target === 'number' ? m.target : 0,
      unit: typeof m.unit === 'string' ? m.unit : '',
      trend: VALID_TRENDS.includes(m.trend as KPITrend) ? (m.trend as KPITrend) : 'flat',
    }))
    .filter(m => m.name)

  if (metrics.length === 0) {
    return { valid: false, title: '', metrics: [], fallback: true, originalInput: input }
  }

  return { valid: true, title: obj.title, metrics }
}
