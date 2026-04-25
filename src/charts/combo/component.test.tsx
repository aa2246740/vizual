import { describe, expect, it } from 'vitest'
import { buildComboOption } from './component'

describe('ComboChart option builder', () => {
  it('keeps secondary line series values instead of flattening to zero', () => {
    const option = buildComboOption({
      type: 'combo',
      x: 'day',
      y: ['revenue', 'ai_ratio'],
      data: [
        { day: 'D1', revenue: 1200, ai_ratio: 0.08 },
        { day: 'D2', revenue: 1180, ai_ratio: 0.12 },
        { day: 'D3', revenue: 990, ai_ratio: 0.3 },
      ],
    })

    const series = option.series as Array<{ type: string; data: number[]; yAxisIndex?: number }>
    expect(series).toHaveLength(2)
    expect(series[0].type).toBe('bar')
    expect(series[1].type).toBe('line')
    expect(series[1].data).toEqual([0.08, 0.12, 0.3])
    expect(series[1].yAxisIndex).toBe(1)
  })

  it('honors explicit bar/line series mappings when provided', () => {
    const option = buildComboOption({
      type: 'combo',
      x: 'day',
      y: ['revenue'],
      series: [
        { type: 'bar', y: 'revenue' },
        { type: 'line', y: 'arppu' },
      ],
      data: [
        { day: 'D1', revenue: '1,200', arppu: 12.5 },
        { day: 'D2', revenue: '1,180', arppu: 14.8 },
      ],
    })

    const series = option.series as Array<{ type: string; data: number[]; yAxisIndex?: number }>
    expect(series).toHaveLength(2)
    expect(series[0].data).toEqual([1200, 1180])
    expect(series[1].type).toBe('line')
    expect(series[1].data).toEqual([12.5, 14.8])
    expect(series[1].yAxisIndex).toBe(1)
  })
})
