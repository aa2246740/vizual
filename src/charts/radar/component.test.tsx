import { describe, expect, it } from 'vitest'
import { buildRadarFallback } from './component'

describe('RadarChart fallback builder', () => {
  it('ignores non-array direct ECharts fields instead of throwing', () => {
    const option = buildRadarFallback({
      title: '能力雷达',
      indicators: { name: '效率', max: 100 },
      series: { name: '当前', values: [80] },
      data: [
        { branch: 'A', score: 82 },
      ],
      x: 'branch',
      y: 'score',
    } as any)

    expect(option).toMatchObject({
      radar: {
        indicator: [
          expect.objectContaining({ name: 'A' }),
        ],
      },
      series: [
        expect.objectContaining({
          type: 'radar',
          data: [
            expect.objectContaining({ name: 'score', value: [82] }),
          ],
        }),
      ],
    })
  })
})
