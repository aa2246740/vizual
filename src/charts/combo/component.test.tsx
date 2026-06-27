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
        { day: 'D1', revenue: '1,200', arppu: '12.5%' },
        { day: 'D2', revenue: '￥1,180万元', arppu: '14.8％' },
      ],
    })

    const series = option.series as Array<{ type: string; data: number[]; yAxisIndex?: number }>
    expect(series).toHaveLength(2)
    expect(series[0].data).toEqual([1200, 1180])
    expect(series[1].type).toBe('line')
    expect(series[1].data).toEqual([12.5, 14.8])
    expect(series[1].yAxisIndex).toBe(1)
  })

  it('supports agent-native y series objects with field, type, and name', () => {
    const option = buildComboOption({
      type: 'combo',
      x: 'day',
      y: [
        { type: 'bar', field: 'revenue', name: '收入' },
        { type: 'line', field: 'aiRatioPct', name: 'AI内容占比(%)' },
      ],
      data: [
        { day: 'D1', revenue: 12000, aiRatioPct: 10 },
        { day: 'D2', revenue: 13800, aiRatioPct: 15 },
      ],
    } as any)

    const series = option.series as Array<{ name: string; type: string; data: number[]; yAxisIndex?: number }>
    expect(series).toHaveLength(2)
    expect(series[0]).toMatchObject({ type: 'bar', name: '收入', data: [12000, 13800] })
    expect(series[1]).toMatchObject({ type: 'line', name: 'AI内容占比(%)', data: [10, 15], yAxisIndex: 1 })
  })

  it('supports bar plus line plus scatter with symbol size from a third metric', () => {
    const option = buildComboOption({
      type: 'combo',
      title: '研发投入与报错率双轴动态关联',
      x: 'week',
      leftAxisName: '研发投入工时',
      rightAxisName: '百分比(%)',
      data: [
        { week: 'W1', hours: 420, crashRate: 1.2, churnRate: 0.5 },
        { week: 'W6', hours: 820, crashRate: 8.5, churnRate: 3.8 },
      ],
      series: [
        { type: 'bar', y: 'hours', name: '研发投入工时' },
        { type: 'line', y: 'crashRate', name: '系统崩溃率(%)' },
        { type: 'scatter', y: 'crashRate', size: 'churnRate', name: '用户流失率(点大小)' },
      ],
    })

    const series = option.series as Array<{ type: string; data: unknown[]; yAxisIndex?: number; symbolSize?: unknown }>
    expect(series.map(item => item.type)).toEqual(['bar', 'line', 'scatter'])
    expect(series[0]).toMatchObject({ data: [420, 820], yAxisIndex: 0 })
    expect(series[1]).toMatchObject({ data: [1.2, 8.5], yAxisIndex: 1 })
    expect(series[2].data).toEqual([
      ['W1', 1.2, 0.5],
      ['W6', 8.5, 3.8],
    ])
    expect(typeof series[2].symbolSize).toBe('function')
  })
})
