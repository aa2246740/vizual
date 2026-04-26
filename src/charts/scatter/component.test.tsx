import { describe, expect, it } from 'vitest'
import { buildScatterFallback } from './component'

describe('ScatterChart option builder', () => {
  it('emits ECharts array points so scatter marks are visible', () => {
    const option = buildScatterFallback({
      type: 'scatter',
      x: 'height',
      y: 'weight',
      data: [
        { height: 155, weight: 45 },
        { height: 180, weight: 72 },
      ],
    })

    const series = option.series as Array<{ type: string; data: unknown[]; symbolSize?: number }>
    expect(series).toHaveLength(1)
    expect(series[0].type).toBe('scatter')
    expect(series[0].data).toEqual([[155, 45], [180, 72]])
    expect(series[0].symbolSize).toBe(10)
  })
})
