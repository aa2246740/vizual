import { describe, it, expect } from 'vitest'
import { parseDataTableSchema } from '../parser'
import { renderDataTable } from '../renderer'

describe('Data Table — Render Tests', () => {
  const fixture = {
    headers: ['月份', '收入', '支出', '利润'],
    rows: [
      ['1月', 120000, 80000, 40000],
      ['2月', 135000, 85000, 50000],
      ['3月', 142000, 90000, 52000],
    ],
  }

  it('renders correct number of header cells', () => {
    const parsed = parseDataTableSchema(fixture)
    const container = renderDataTable(parsed)
    expect(container.querySelectorAll('th').length).toBe(4)
  })

  it('renders correct number of rows', () => {
    const parsed = parseDataTableSchema(fixture)
    const container = renderDataTable(parsed)
    expect(container.querySelectorAll('[data-row-index]').length).toBe(3)
  })

  it('header text matches input', () => {
    const parsed = parseDataTableSchema(fixture)
    const container = renderDataTable(parsed)
    const headers = Array.from(container.querySelectorAll('th')).map(th => th.textContent)
    expect(headers).toEqual(['月份', '收入', '支出', '利润'])
  })

  it('cell values are rendered as strings', () => {
    const parsed = parseDataTableSchema(fixture)
    const container = renderDataTable(parsed)
    const firstRow = container.querySelector('[data-row-index="0"]')
    const cells = Array.from(firstRow!.querySelectorAll('td')).map(td => td.textContent)
    expect(cells).toEqual(['1月', '120000', '80000', '40000'])
  })

  it('rows have correct data-row-index attributes', () => {
    const parsed = parseDataTableSchema(fixture)
    const container = renderDataTable(parsed)
    expect(container.querySelector('[data-row-index="0"]').getAttribute('data-row-index')).toBe('0')
    expect(container.querySelector('[data-row-index="2"]').getAttribute('data-row-index')).toBe('2')
  })
})

describe('Data Table — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseDataTableSchema(null)
    const container = renderDataTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty headers shows fallback', () => {
    const parsed = parseDataTableSchema({ headers: [], rows: [[1]] })
    const container = renderDataTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty rows shows fallback', () => {
    const parsed = parseDataTableSchema({ headers: ['A'], rows: [] })
    const container = renderDataTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseDataTableSchema({ headers: 'bad' } as any)
    expect(() => renderDataTable(parsed)).not.toThrow()
    const container = renderDataTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('undefined input shows fallback', () => {
    const parsed = parseDataTableSchema(undefined)
    const container = renderDataTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
