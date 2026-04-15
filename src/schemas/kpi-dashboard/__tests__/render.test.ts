import { describe, it, expect } from 'vitest'
import { parseKpiDashboardSchema } from '../parser'
import { renderKpiDashboard } from '../renderer'

describe('KPI Dashboard — Render Tests', () => {
  const fixture = {
    title: 'Q2 业务概览',
    metrics: [
      { name: '月活用户', value: 1250000, target: 1500000, unit: '', trend: 'up' },
      { name: '转化率', value: 3.8, target: 4.0, unit: '%', trend: 'up' },
      { name: '流失率', value: 2.1, target: 2.0, unit: '%', trend: 'down' },
      { name: '满意度', value: 92, target: 90, unit: '%', trend: 'flat' },
    ],
  }

  it('renders dashboard title', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('.kpi-title')?.textContent).toBe('Q2 业务概览')
  })

  it('renders correct number of metric cards', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    expect(container.querySelectorAll('.kpi-card').length).toBe(4)
  })

  it('renders metric names', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('[data-metric="月活用户"] .kpi-metric-name')?.textContent).toBe('月活用户')
  })

  it('renders metric values', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('[data-metric="月活用户"] .kpi-value')?.textContent).toBe('1,250,000')
  })

  it('renders trend arrows', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('.kpi-trend[data-trend="up"]')?.textContent).toBe('↑')
    expect(container.querySelector('.kpi-trend[data-trend="down"]')?.textContent).toBe('↓')
    expect(container.querySelector('.kpi-trend.trend-flat')?.textContent).toBe('→')
  })

  it('renders progress bar when target exists', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    const card = container.querySelector('[data-metric="月活用户"]')
    expect(card?.querySelector('.kpi-progress-bar')).not.toBeNull()
  })

  it('renders target text', () => {
    const parsed = parseKpiDashboardSchema(fixture)
    const container = renderKpiDashboard(parsed)
    const card = container.querySelector('[data-metric="月活用户"]')
    expect(card?.querySelector('.kpi-target')?.textContent).toContain('1,500,000')
  })
})

describe('KPI Dashboard — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseKpiDashboardSchema(null)
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('missing title shows fallback', () => {
    const parsed = parseKpiDashboardSchema({ metrics: [{ name: 'MAU', value: 100 }] })
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty metrics shows fallback', () => {
    const parsed = parseKpiDashboardSchema({ title: 'Dashboard', metrics: [] })
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseKpiDashboardSchema('bad' as any)
    expect(() => renderKpiDashboard(parsed)).not.toThrow()
    const container = renderKpiDashboard(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
