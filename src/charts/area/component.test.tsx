import { describe, expect, it } from 'vitest'
import { buildAreaFallback } from './component'

describe('AreaChart fallback', () => {
  it('parses formatted numeric strings with the shared chart parser', () => {
    const option = buildAreaFallback({
      type: 'area',
      x: 'month',
      y: ['revenue', 'risk'],
      data: [
        { month: '1月', revenue: '1,200', risk: '0.66%' },
        { month: '2月', revenue: '￥1,480万元', risk: '1.34％' },
      ],
    })

    expect(option.series).toEqual([
      expect.objectContaining({ name: 'revenue', data: [1200, 1480] }),
      expect.objectContaining({ name: 'risk', data: [0.66, 1.34] }),
    ])
  })
})
