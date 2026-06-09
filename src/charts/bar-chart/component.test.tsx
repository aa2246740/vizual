import { describe, it, expect } from 'vitest'
import { buildBarFallback } from './component'

describe('BarChart option builder', () => {
  it('builds correct option with default dimensions', () => {
    const option = buildBarFallback({
      type: 'bar',
      x: 'name',
      y: 'value',
      data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }],
    })
    expect(option.xAxis).toBeDefined()
    expect((option.xAxis as Record<string, unknown>).type).toBe('category')
    expect((option.series as Record<string, unknown>[]).length).toBe(1)
  })

  it('includes title in option when provided', () => {
    const option = buildBarFallback({
      type: 'bar',
      title: 'Sales Report',
      x: 'name',
      y: 'value',
      data: [{ name: 'A', value: 10 }],
    })
    expect(option.title).toBeDefined()
    expect((option.title as Record<string, unknown>).text).toBe('Sales Report')
  })

  it('handles stacked and horizontal variants', () => {
    const option = buildBarFallback({
      type: 'bar',
      x: 'name',
      y: ['sales', 'profit'],
      stacked: true,
      horizontal: true,
      data: [{ name: 'A', sales: 10, profit: 5 }],
    })
    expect((option.xAxis as Record<string, unknown>).type).toBe('value')
    expect((option.yAxis as Record<string, unknown>).type).toBe('category')
    expect((option.series as Record<string, unknown>[]).length).toBe(2)
    expect((option.series as Record<string, unknown>[])[0]).toHaveProperty('stack', 'total')
  })

  it('builds an empty series instead of throwing when data is missing', () => {
    const option = buildBarFallback({
      type: 'bar',
      x: 'label',
      y: 'value',
    } as any)

    expect((option.xAxis as Record<string, unknown>).type).toBe('category')
    expect((option.series as Array<{ data: unknown[] }>)[0].data).toEqual([])
  })
})
