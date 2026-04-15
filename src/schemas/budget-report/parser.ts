import type { ParsedSchema } from '../../core/types'

export interface BudgetItem {
  category: string
  budget: number
  actual: number
  variance: number
}

export interface BudgetReportParsed extends ParsedSchema {
  title: string
  period: string
  currency: string
  items: BudgetItem[]
}

export function parseBudgetReportSchema(input: unknown): BudgetReportParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, title: '', period: '', currency: '¥', items: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (typeof obj.title !== 'string' || obj.title === '') {
    return { valid: false, title: '', period: '', currency: '¥', items: [], fallback: true, originalInput: input }
  }

  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    return { valid: false, title: '', period: '', currency: '¥', items: [], fallback: true, originalInput: input }
  }

  const items: BudgetItem[] = obj.items
    .filter((item: unknown) => item && typeof item === 'object')
    .map((item: Record<string, unknown>) => {
      const budget = typeof item.budget === 'number' ? item.budget : 0
      const actual = typeof item.actual === 'number' ? item.actual : 0
      return {
        category: typeof item.category === 'string' ? item.category : '',
        budget,
        actual,
        variance: typeof item.variance === 'number' ? item.variance : budget - actual,
      }
    })
    .filter(item => item.category)

  if (items.length === 0) {
    return { valid: false, title: '', period: '', currency: '¥', items: [], fallback: true, originalInput: input }
  }

  return {
    valid: true,
    title: obj.title,
    period: typeof obj.period === 'string' ? obj.period : '',
    currency: typeof obj.currency === 'string' ? obj.currency : '¥',
    items,
  }
}
