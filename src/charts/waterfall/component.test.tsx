import { describe, expect, it } from 'vitest'
import { buildWaterfallFallback } from './component'

describe('WaterfallChart fallback builder', () => {
  it('does not throw when agent data is not yet normalized to rows', () => {
    const option = buildWaterfallFallback({
      title: '费用拆解',
      data: { labels: ['收入', '成本'], datasets: [{ label: '金额', data: [100, -35] }] },
      x: 'label',
      y: '金额',
    } as any)

    expect(option).toMatchObject({
      xAxis: { data: [] },
      series: [
        expect.objectContaining({ data: [] }),
        expect.objectContaining({ data: [] }),
      ],
    })
  })
})
