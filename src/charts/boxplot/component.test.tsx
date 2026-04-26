import { describe, expect, it } from 'vitest'
import { buildBoxplotFallback } from './component'

describe('BoxplotChart option builder', () => {
  it('supports precomputed five-number summary rows', () => {
    const option = buildBoxplotFallback({
      type: 'boxplot',
      x: 'class',
      data: [
        { class: 'A班', min: 60, q1: 70, median: 80, q3: 85, max: 95 },
        { class: 'B班', min: 55, q1: 65, median: 75, q3: 80, max: 90 },
      ],
    })

    const xAxis = option.xAxis as { data: string[] }
    const series = option.series as Array<{ type: string; data: number[][] }>
    expect(xAxis.data).toEqual(['A班', 'B班'])
    expect(series[0].type).toBe('boxplot')
    expect(series[0].data).toEqual([
      [60, 70, 80, 85, 95],
      [55, 65, 75, 80, 90],
    ])
  })

  it('still calculates quartiles from raw grouped rows', () => {
    const option = buildBoxplotFallback({
      type: 'boxplot',
      x: 'subject',
      y: 'score',
      data: [
        { subject: '数学', score: 60 },
        { subject: '数学', score: 70 },
        { subject: '数学', score: 80 },
        { subject: '数学', score: 90 },
      ],
    })

    const series = option.series as Array<{ data: number[][] }>
    expect(series[0].data).toEqual([[60, 60, 70, 80, 90]])
  })
})
