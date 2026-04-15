import { describe, it, expect } from 'vitest'
import { parseKpiDashboardSchema } from '../parser'

describe('KPI Dashboard — Parser Deep Tests', () => {
  it('defaults invalid trend to "flat"', () => {
    const parsed = parseKpiDashboardSchema({
      title: 'KPI',
      metrics: [{ name: 'MAU', value: 100, trend: 'unknown' }],
    })
    expect(parsed.metrics[0].trend).toBe('flat')
  })

  it('accepts all valid trend values', () => {
    for (const trend of ['up', 'down', 'flat']) {
      const parsed = parseKpiDashboardSchema({
        title: 'KPI',
        metrics: [{ name: 'MAU', value: 100, trend }],
      })
      expect(parsed.metrics[0].trend).toBe(trend)
    }
  })

  it('defaults value to 0 when missing', () => {
    const parsed = parseKpiDashboardSchema({
      title: 'KPI',
      metrics: [{ name: 'MAU' }],
    })
    expect(parsed.metrics[0].value).toBe(0)
  })

  it('defaults target to 0 when missing', () => {
    const parsed = parseKpiDashboardSchema({
      title: 'KPI',
      metrics: [{ name: 'MAU', value: 100 }],
    })
    expect(parsed.metrics[0].target).toBe(0)
  })

  it('defaults unit to empty string when missing', () => {
    const parsed = parseKpiDashboardSchema({
      title: 'KPI',
      metrics: [{ name: 'MAU', value: 100 }],
    })
    expect(parsed.metrics[0].unit).toBe('')
  })

  it('filters metrics without name', () => {
    const parsed = parseKpiDashboardSchema({
      title: 'KPI',
      metrics: [
        { value: 100 },
        { name: '有效指标', value: 200 },
      ],
    })
    expect(parsed.metrics.length).toBe(1)
    expect(parsed.metrics[0].name).toBe('有效指标')
  })

  it('empty title returns invalid', () => {
    const parsed = parseKpiDashboardSchema({
      title: '',
      metrics: [{ name: 'MAU', value: 100 }],
    })
    expect(parsed.valid).toBe(false)
  })
})
