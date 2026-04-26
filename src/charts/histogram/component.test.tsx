import { describe, expect, it } from 'vitest'
import { buildHistogramFallback } from './component'

describe('HistogramChart option builder', () => {
  it('renders pre-binned range/count rows directly', () => {
    const option = buildHistogramFallback({
      type: 'histogram',
      x: 'range',
      y: 'count',
      data: [
        { range: '0-60', count: 5 },
        { range: '60-70', count: 15 },
        { range: '70-80', count: 35 },
      ],
    })

    const xAxis = option.xAxis as { data: string[] }
    const series = option.series as Array<{ type: string; data: number[] }>
    expect(xAxis.data).toEqual(['0-60', '60-70', '70-80'])
    expect(series[0].type).toBe('bar')
    expect(series[0].data).toEqual([5, 15, 35])
  })

  it('calculates bins from raw value rows using value and bins props', () => {
    const option = buildHistogramFallback({
      type: 'histogram',
      value: 'score',
      bins: 3,
      data: [
        { score: 10 },
        { score: 12 },
        { score: 20 },
        { score: 28 },
      ],
    })

    const xAxis = option.xAxis as { data: string[] }
    const series = option.series as Array<{ data: number[] }>
    expect(xAxis.data).toHaveLength(3)
    expect(series[0].data).toEqual([2, 1, 1])
  })
})
