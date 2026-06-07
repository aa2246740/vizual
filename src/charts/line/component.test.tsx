import { describe, expect, it } from 'vitest'
import { buildLineFallback } from './component'

describe('LineChart fallback', () => {
  it('uses a secondary axis when agent mixes revenue with small-scale rates or counts', () => {
    const option = buildLineFallback({
      type: 'line',
      title: '华东区 AI 内容运营趋势',
      x: 'time',
      y: ['exposure', 'churn', 'revenue'],
      data: [
        { time: '09:00', exposure: 10, churn: 20, revenue: 16600 },
        { time: '12:00', exposure: 42, churn: 58, revenue: 16020 },
        { time: '16:00', exposure: 68, churn: 115, revenue: 15120 },
      ],
    })

    expect(Array.isArray(option.yAxis)).toBe(true)
    expect(option.series).toEqual([
      expect.objectContaining({ name: 'exposure', yAxisIndex: 0, data: [10, 42, 68] }),
      expect.objectContaining({ name: 'churn', yAxisIndex: 0, data: [20, 58, 115] }),
      expect.objectContaining({ name: 'revenue', yAxisIndex: 1, data: [16600, 16020, 15120] }),
    ])
  })

  it('keeps one axis for comparable series', () => {
    const option = buildLineFallback({
      type: 'line',
      x: 'day',
      y: ['current', 'previous'],
      data: [
        { day: 'D1', current: 40, previous: 35 },
        { day: 'D2', current: 60, previous: 52 },
      ],
    })

    expect(option.yAxis).toEqual({ type: 'value' })
    expect(option.series).toEqual([
      expect.objectContaining({ name: 'current', yAxisIndex: 0 }),
      expect.objectContaining({ name: 'previous', yAxisIndex: 0 }),
    ])
  })
})
