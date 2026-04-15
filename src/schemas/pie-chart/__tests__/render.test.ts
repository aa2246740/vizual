import { describe, it, expect } from 'vitest'
import { parsePieChart } from '../parser'
import { renderPieChart } from '../renderer'

const validFixture = {
  title: '销售收入占比',
  donut: true,
  segments: [
    { label: '华东地区', value: 842000 },
    { label: '华南地区', value: 638000 },
    { label: '华北地区', value: 520000 },
  ],
}

const pieNoDonutFixture = {
  title: '简单饼图',
  donut: false,
  segments: [
    { label: 'A', value: 50 },
    { label: 'B', value: 30 },
    { label: 'C', value: 20 },
  ],
}

describe('Pie Chart — Parser Tests', () => {
  it('parses valid input correctly', () => {
    const parsed = parsePieChart(validFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.title).toBe('销售收入占比')
    expect(parsed.donut).toBe(true)
    expect(parsed.segments.length).toBe(3)
  })

  it('parses donut=false', () => {
    const parsed = parsePieChart(pieNoDonutFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.donut).toBe(false)
  })

  it('defaults donut to false when omitted', () => {
    const parsed = parsePieChart({
      segments: [{ label: 'A', value: 1 }],
    })
    expect(parsed.donut).toBe(false)
  })

  it('null input returns invalid', () => {
    const parsed = parsePieChart(null)
    expect(parsed.valid).toBe(false)
    expect(parsed.segments).toEqual([])
  })

  it('undefined input returns invalid', () => {
    const parsed = parsePieChart(undefined)
    expect(parsed.valid).toBe(false)
  })

  it('missing segments returns invalid', () => {
    const parsed = parsePieChart({ title: 'No data' })
    expect(parsed.valid).toBe(false)
  })
})

describe('Pie Chart — Render Tests', () => {
  it('renders container with correct class', () => {
    const parsed = parsePieChart(validFixture)
    const el = renderPieChart(parsed)
    expect(el.className).toBe('pie-chart')
  })

  it('renders without crashing in any environment', () => {
    const parsed = parsePieChart(validFixture)
    expect(() => renderPieChart(parsed)).not.toThrow()
  })

  it('renders non-donut pie without crashing', () => {
    const parsed = parsePieChart(pieNoDonutFixture)
    expect(() => renderPieChart(parsed)).not.toThrow()
  })

  it('in jsdom, gracefully falls back when canvas context unavailable', () => {
    const parsed = parsePieChart(validFixture)
    const el = renderPieChart(parsed)
    // jsdom doesn't support canvas 2D context → renderer returns fallback
    const canvas = el.querySelector('canvas[data-schema="pie-chart"]')
    if (!canvas) {
      expect(el.getAttribute('data-fallback')).toBe('true')
    } else {
      // Real browser: check custom legend
      const legendItems = el.querySelectorAll('[role="option"]')
      expect(legendItems.length).toBe(3)
    }
  })
})

describe('Pie Chart — Fallback Tests', () => {
  it('invalid parsed data shows fallback', () => {
    const parsed = parsePieChart(null)
    const el = renderPieChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty segments shows fallback', () => {
    const parsed = parsePieChart({ segments: [] })
    const el = renderPieChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('string input shows fallback', () => {
    const parsed = parsePieChart('garbage' as any)
    const el = renderPieChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('number input shows fallback', () => {
    const parsed = parsePieChart(42 as any)
    const el = renderPieChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback preserves null input correctly', () => {
    const parsed = parsePieChart(null)
    const el = renderPieChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')?.textContent).toBe('null')
  })
})
