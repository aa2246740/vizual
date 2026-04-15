import { describe, it, expect } from 'vitest'
import { parseFunnelChart } from '../parser'
import { renderFunnelChart } from '../renderer'

const validFixture = {
  title: '销售转化漏斗',
  steps: [
    { label: '页面访问', value: 102847 },
    { label: '商品点击', value: 38472 },
    { label: '加入购物车', value: 12850 },
    { label: '完成支付', value: 2614 },
  ],
}

describe('Funnel Chart — Parser Tests', () => {
  it('parses valid input correctly', () => {
    const parsed = parseFunnelChart(validFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.title).toBe('销售转化漏斗')
    expect(parsed.steps.length).toBe(4)
  })

  it('parses step values correctly', () => {
    const parsed = parseFunnelChart(validFixture)
    expect(parsed.steps[0].label).toBe('页面访问')
    expect(parsed.steps[0].value).toBe(102847)
    expect(parsed.steps[3].label).toBe('完成支付')
    expect(parsed.steps[3].value).toBe(2614)
  })

  it('null input returns invalid', () => {
    const parsed = parseFunnelChart(null)
    expect(parsed.valid).toBe(false)
    expect(parsed.steps).toEqual([])
  })

  it('undefined input returns invalid', () => {
    const parsed = parseFunnelChart(undefined)
    expect(parsed.valid).toBe(false)
  })

  it('missing steps returns invalid', () => {
    const parsed = parseFunnelChart({ title: 'No steps' })
    expect(parsed.valid).toBe(false)
  })
})

describe('Funnel Chart — Render Tests', () => {
  it('renders container with correct class', () => {
    const parsed = parseFunnelChart(validFixture)
    const el = renderFunnelChart(parsed)
    expect(el.className).toBe('funnel-chart')
  })

  it('renders without crashing in any environment', () => {
    const parsed = parseFunnelChart(validFixture)
    expect(() => renderFunnelChart(parsed)).not.toThrow()
  })

  it('container has position relative', () => {
    const parsed = parseFunnelChart(validFixture)
    const el = renderFunnelChart(parsed)
    expect(el.style.position).toBe('relative')
  })

  it('renders single step without crashing', () => {
    const fixture = { steps: [{ label: '唯一步骤', value: 500 }] }
    const parsed = parseFunnelChart(fixture)
    expect(() => renderFunnelChart(parsed)).not.toThrow()
  })

  it('gracefully handles canvas context unavailability', () => {
    const parsed = parseFunnelChart(validFixture)
    const el = renderFunnelChart(parsed)
    const canvas = el.querySelector('canvas[data-schema="funnel-chart"]')
    if (!canvas) {
      // jsdom: no canvas context → fallback
      expect(el.getAttribute('data-fallback')).toBe('true')
    }
  })
})

describe('Funnel Chart — Fallback Tests', () => {
  it('invalid parsed data shows fallback', () => {
    const parsed = parseFunnelChart(null)
    const el = renderFunnelChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty steps shows fallback', () => {
    const parsed = parseFunnelChart({ steps: [] })
    const el = renderFunnelChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('string input shows fallback', () => {
    const parsed = parseFunnelChart('garbage' as any)
    const el = renderFunnelChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('number input shows fallback', () => {
    const parsed = parseFunnelChart(42 as any)
    const el = renderFunnelChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback preserves null input correctly', () => {
    const parsed = parseFunnelChart(null)
    const el = renderFunnelChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')?.textContent).toBe('null')
  })
})
