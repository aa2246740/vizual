import { describe, it, expect } from 'vitest'
import { parseBudgetReportSchema } from '../parser'

describe('Budget Report — Parser Deep Tests', () => {
  it('auto-computes variance when omitted', () => {
    const parsed = parseBudgetReportSchema({
      title: 'Q2预算',
      items: [
        { category: '人力成本', budget: 480000, actual: 462000 },
      ],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.items[0].variance).toBe(480000 - 462000) // 18000
  })

  it('uses provided variance when present', () => {
    const parsed = parseBudgetReportSchema({
      title: 'Q2预算',
      items: [
        { category: '人力成本', budget: 480000, actual: 462000, variance: 999 },
      ],
    })
    expect(parsed.items[0].variance).toBe(999)
  })

  it('defaults period to empty string when missing', () => {
    const parsed = parseBudgetReportSchema({
      title: '预算报告',
      items: [{ category: '测试', budget: 100, actual: 80 }],
    })
    expect(parsed.period).toBe('')
  })

  it('defaults currency to ¥ when missing', () => {
    const parsed = parseBudgetReportSchema({
      title: '预算报告',
      items: [{ category: '测试', budget: 100, actual: 80 }],
    })
    expect(parsed.currency).toBe('¥')
  })

  it('accepts custom currency', () => {
    const parsed = parseBudgetReportSchema({
      title: 'Budget',
      items: [{ category: 'Test', budget: 100, actual: 80 }],
      currency: '$',
    })
    expect(parsed.currency).toBe('$')
  })

  it('defaults budget/actual to 0 when missing', () => {
    const parsed = parseBudgetReportSchema({
      title: '预算报告',
      items: [{ category: '测试' }],
    })
    expect(parsed.items[0].budget).toBe(0)
    expect(parsed.items[0].actual).toBe(0)
    expect(parsed.items[0].variance).toBe(0)
  })

  it('filters items without category', () => {
    const parsed = parseBudgetReportSchema({
      title: '预算报告',
      items: [
        { budget: 100, actual: 80 },
        { category: '有效项', budget: 200, actual: 150 },
      ],
    })
    expect(parsed.items.length).toBe(1)
    expect(parsed.items[0].category).toBe('有效项')
  })

  it('empty title returns invalid', () => {
    const parsed = parseBudgetReportSchema({
      title: '',
      items: [{ category: '测试', budget: 100, actual: 80 }],
    })
    expect(parsed.valid).toBe(false)
  })
})
