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
})
