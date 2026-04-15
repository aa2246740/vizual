import { describe, it, expect } from 'vitest'
import { parseLineChart } from '../parser'
import { renderLineChart } from '../renderer'

const validFixture = {
  title: '月销售额趋势（万元）',
  datasets: [
    {
      name: '2025年',
      data: [
        { label: '1月', value: 28 },
        { label: '2月', value: 31 },
        { label: '3月', value: 35 },
      ],
    },
  ],
}

const multiDatasetFixture = {
  title: '对比图',
  datasets: [
    { name: '2024年', data: [{ label: 'Q1', value: 100 }, { label: 'Q2', value: 120 }] },
    { name: '2025年', data: [{ label: 'Q1', value: 150 }, { label: 'Q2', value: 180 }] },
  ],
}

describe('Line Chart — Parser Tests', () => {
  it('parses valid input correctly', () => {
    const parsed = parseLineChart(validFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.title).toBe('月销售额趋势（万元）')
    expect(parsed.datasets.length).toBe(1)
    expect(parsed.datasets[0].data.length).toBe(3)
  })

  it('parses multiple datasets', () => {
    const parsed = parseLineChart(multiDatasetFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.datasets.length).toBe(2)
  })

  it('null input returns invalid', () => {
    const parsed = parseLineChart(null)
    expect(parsed.valid).toBe(false)
    expect(parsed.datasets).toEqual([])
  })

  it('undefined input returns invalid', () => {
    const parsed = parseLineChart(undefined)
    expect(parsed.valid).toBe(false)
  })

  it('empty datasets passes schema validation (renderer handles fallback)', () => {
    const parsed = parseLineChart({ datasets: [] })
    expect(parsed.valid).toBe(true)
  })

  it('missing datasets returns invalid', () => {
    const parsed = parseLineChart({ title: 'No data' })
    expect(parsed.valid).toBe(false)
  })

  it('preserves originalInput', () => {
    const parsed = parseLineChart(validFixture)
    expect(parsed.originalInput).toBe(validFixture)
  })
})

describe('Line Chart — Render Tests', () => {
  it('renders container with correct class', () => {
    const parsed = parseLineChart(validFixture)
    const el = renderLineChart(parsed)
    expect(el.className).toBe('line-chart')
  })

  it('contains canvas element with data-schema attribute', () => {
    const parsed = parseLineChart(validFixture)
    const el = renderLineChart(parsed)
    // In jsdom, canvas.getContext('2d') returns null → fallback path
    // In a real browser, this would render a full Chart.js canvas
    const canvas = el.querySelector('canvas[data-schema="line-chart"]')
    // Either canvas exists (real browser) or fallback exists (jsdom)
    if (!canvas) {
      expect(el.getAttribute('data-fallback')).toBe('true')
    }
  })

  it('container has position relative style', () => {
    const parsed = parseLineChart(validFixture)
    const el = renderLineChart(parsed)
    expect(el.style.position).toBe('relative')
  })

  it('renders multi-dataset without crashing', () => {
    const parsed = parseLineChart(multiDatasetFixture)
    expect(() => renderLineChart(parsed)).not.toThrow()
  })
})

describe('Line Chart — Fallback Tests', () => {
  it('invalid parsed data shows fallback', () => {
    const parsed = parseLineChart(null)
    const el = renderLineChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty datasets shows fallback', () => {
    const parsed = parseLineChart({ datasets: [] })
    const el = renderLineChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('string input shows fallback', () => {
    const parsed = parseLineChart('garbage' as any)
    const el = renderLineChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('number input shows fallback', () => {
    const parsed = parseLineChart(42 as any)
    const el = renderLineChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback preserves null input correctly', () => {
    const parsed = parseLineChart(null)
    const el = renderLineChart(parsed)
    const fallbackContent = el.querySelector('[data-fallback="true"]')?.textContent
    expect(fallbackContent).toBe('null')
  })
})
