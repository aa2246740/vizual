import { describe, it, expect } from 'vitest'
import { parseBarChart } from '../parser'
import { renderBarChart } from '../renderer'

const validFixture = {
  title: '各产品季度销量',
  datasets: [
    { name: 'Q1', labels: ['产品A', '产品B', '产品C'], values: [423, 512, 300] },
    { name: 'Q2', labels: ['产品A', '产品B', '产品C'], values: [512, 489, 350] },
  ],
}

const horizontalFixture = {
  title: '水平柱状图',
  horizontal: true,
  datasets: [
    { name: 'Sales', labels: ['Alpha', 'Beta', 'Gamma', 'Delta'], values: [100, 200, 150, 80] },
  ],
}

describe('Bar Chart — Parser Tests', () => {
  it('parses valid input correctly', () => {
    const parsed = parseBarChart(validFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.title).toBe('各产品季度销量')
    expect(parsed.datasets.length).toBe(2)
    expect(parsed.horizontal).toBe(false)
  })

  it('parses horizontal flag', () => {
    const parsed = parseBarChart(horizontalFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.horizontal).toBe(true)
  })

  it('defaults horizontal to false when omitted', () => {
    const parsed = parseBarChart({ datasets: [{ name: 'S', labels: ['A'], values: [1] }] })
    expect(parsed.horizontal).toBe(false)
  })

  it('null input returns invalid', () => {
    const parsed = parseBarChart(null)
    expect(parsed.valid).toBe(false)
    expect(parsed.datasets).toEqual([])
  })

  it('undefined input returns invalid', () => {
    const parsed = parseBarChart(undefined)
    expect(parsed.valid).toBe(false)
  })

  it('missing datasets returns invalid', () => {
    const parsed = parseBarChart({ title: 'No data' })
    expect(parsed.valid).toBe(false)
  })
})

describe('Bar Chart — Render Tests', () => {
  it('renders container with correct class', () => {
    const parsed = parseBarChart(validFixture)
    const el = renderBarChart(parsed)
    expect(el.className).toBe('bar-chart')
  })

  it('contains canvas or fallback', () => {
    const parsed = parseBarChart(validFixture)
    const el = renderBarChart(parsed)
    const canvas = el.querySelector('canvas[data-schema="bar-chart"]')
    if (!canvas) {
      // jsdom: canvas context unavailable → fallback
      expect(el.getAttribute('data-fallback')).toBe('true')
    }
  })

  it('container has position relative', () => {
    const parsed = parseBarChart(validFixture)
    const el = renderBarChart(parsed)
    expect(el.style.position).toBe('relative')
  })

  it('renders multi-dataset without crashing', () => {
    const parsed = parseBarChart(validFixture)
    expect(() => renderBarChart(parsed)).not.toThrow()
  })

  it('renders horizontal chart without crashing', () => {
    const parsed = parseBarChart(horizontalFixture)
    expect(() => renderBarChart(parsed)).not.toThrow()
  })
})

describe('Bar Chart — Fallback Tests', () => {
  it('invalid parsed data shows fallback', () => {
    const parsed = parseBarChart(null)
    const el = renderBarChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty datasets shows fallback', () => {
    const parsed = parseBarChart({ datasets: [] })
    const el = renderBarChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('string input shows fallback', () => {
    const parsed = parseBarChart('garbage' as any)
    const el = renderBarChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('number input shows fallback', () => {
    const parsed = parseBarChart(42 as any)
    const el = renderBarChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback preserves null input correctly', () => {
    const parsed = parseBarChart(null)
    const el = renderBarChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')?.textContent).toBe('null')
  })
})
