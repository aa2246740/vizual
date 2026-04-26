import { describe, expect, it } from 'vitest'
import { buildDumbbellFallback } from './component'

describe('DumbbellChart option builder', () => {
  it('maps category and low/high values for custom dumbbell rendering', () => {
    const option = buildDumbbellFallback({
      type: 'dumbbell',
      x: 'department',
      y: ['s2023', 's2024'],
      data: [
        { department: '市场', s2023: 70, s2024: 80 },
        { department: '研发', s2023: 72, s2024: 78 },
      ],
    })

    const xAxis = option.xAxis as { data: string[] }
    const series = option.series as Array<{ type: string; data: number[][]; renderItem: unknown }>
    expect(xAxis.data).toEqual(['市场', '研发'])
    expect(series[0].type).toBe('custom')
    expect(series[0].data).toEqual([
      [0, 70, 80],
      [1, 72, 78],
    ])

    const shape = (series[0].renderItem as Function)({}, {
      value: (index: number) => [0, 70, 80][index],
      coord: ([x, y]: [number, number]) => [x * 100, y],
      visual: () => '#c76f4d',
    })
    expect(shape.children[0].type).toBe('rect')
    expect(shape.children[0].shape).toEqual({ x: -2.5, y: 70, width: 5, height: 10 })
    expect(shape.children[0].style.opacity).toBe(0.85)
  })
})
