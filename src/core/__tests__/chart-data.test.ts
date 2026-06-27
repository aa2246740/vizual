import { describe, expect, it } from 'vitest'
import { parseChartNumber } from '../chart-data'

describe('chart data parsing', () => {
  it('parses common agent-formatted numeric cells without accepting mixed labels', () => {
    expect(parseChartNumber('1,234.5')).toBe(1234.5)
    expect(parseChartNumber('2.28%')).toBe(2.28)
    expect(parseChartNumber('-4.5％')).toBe(-4.5)
    expect(parseChartNumber('10.8分钟')).toBe(10.8)
    expect(parseChartNumber('￥12.6亿元')).toBe(12.6)
    expect(parseChartNumber('(1,200)')).toBe(-1200)
    expect(parseChartNumber('branch0')).toBeNull()
    expect(parseChartNumber('2026年')).toBeNull()
  })
})
