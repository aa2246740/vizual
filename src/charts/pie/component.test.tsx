import { describe, expect, it } from 'vitest'
import { buildPieFallback } from './component'

describe('PieChart option builder', () => {
  it('uses label/value aliases so native agent pie legends are named', () => {
    const option = buildPieFallback({
      type: 'pie',
      categoryField: 'channel',
      valueField: 'amount',
      data: [
        { channel: 'Online', amount: 680000 },
        { channel: 'Store', amount: 420000 },
        { channel: 'Dealer', amount: 180000 },
      ],
    })

    expect(option.series).toEqual([
      expect.objectContaining({
        type: 'pie',
        data: [
          { name: 'Online', value: 680000 },
          { name: 'Store', value: 420000 },
          { name: 'Dealer', value: 180000 },
        ],
      }),
    ])
    const legendFormatter = (option.legend as { formatter?: (name: string) => string }).formatter
    expect(legendFormatter?.('Online')).toBe('Online 53.1%')
  })
})
