import { describe, it, expect } from 'vitest'
import { parseBudgetReportSchema } from '../parser'
import { renderBudgetReport } from '../renderer'

describe('Budget Report — Render Tests', () => {
  const fixture = {
    title: 'Q2 预算报告',
    period: '2026-Q2',
    currency: '¥',
    items: [
      { category: '研发', budget: 500000, actual: 480000, variance: 20000 },
      { category: '市场', budget: 200000, actual: 220000, variance: -20000 },
      { category: '运营', budget: 150000, actual: 140000, variance: 10000 },
    ],
  }

  it('renders report title', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('.budget-title')?.textContent).toBe('Q2 预算报告')
  })

  it('renders report period', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('.budget-period')?.textContent).toBe('2026-Q2')
  })

  it('renders correct number of budget rows', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    expect(container.querySelectorAll('[data-category]').length).toBe(3)
  })

  it('renders category names', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('[data-category="研发"] [data-field="category"]')?.textContent).toBe('研发')
  })

  it('renders budget amounts with currency', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('[data-category="研发"] [data-field="budget"]')?.textContent).toContain('500,000')
  })

  it('positive variance gets positive class', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    const row = container.querySelector('[data-category="研发"]')
    expect(row?.getAttribute('data-variance-sign')).toBe('positive')
  })

  it('negative variance gets negative class', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    const row = container.querySelector('[data-category="市场"]')
    expect(row?.getAttribute('data-variance-sign')).toBe('negative')
  })

  it('renders total row in footer', () => {
    const parsed = parseBudgetReportSchema(fixture)
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('.budget-total-row')).not.toBeNull()
  })
})

describe('Budget Report — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseBudgetReportSchema(null)
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('missing title shows fallback', () => {
    const parsed = parseBudgetReportSchema({ items: [{ category: 'R&D', budget: 100, actual: 80 }] })
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty items shows fallback', () => {
    const parsed = parseBudgetReportSchema({ title: 'Report', items: [] })
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseBudgetReportSchema(42 as any)
    expect(() => renderBudgetReport(parsed)).not.toThrow()
    const container = renderBudgetReport(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
