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

  it('infers horizontal ranking bars when x is numeric and y is categorical', () => {
    const option = buildBarFallback({
      type: 'bar',
      x: 'badRate',
      y: 'branch',
      data: [
        { branch: '北岭分行', badRate: 2.28 },
        { branch: '中城分行', badRate: 1.34 },
        { branch: '高科分行', badRate: 0.66 },
      ],
    })

    expect((option.xAxis as Record<string, unknown>).type).toBe('value')
    expect(option.yAxis).toMatchObject({
      type: 'category',
      data: ['北岭分行', '中城分行', '高科分行'],
    })
    expect((option.series as Record<string, unknown>[])[0]).toMatchObject({
      name: 'badRate',
      data: [2.28, 1.34, 0.66],
    })
  })

  it('keeps formatted numeric strings visible instead of collapsing them to zero', () => {
    const option = buildBarFallback({
      type: 'bar',
      x: 'branch',
      y: 'badRate',
      data: [
        { branch: '北岭分行', badRate: '2.28%' },
        { branch: '中城分行', badRate: '1.34％' },
        { branch: '南湾分行', badRate: '1,060' },
      ],
    })

    expect((option.series as Record<string, unknown>[])[0]).toMatchObject({
      name: 'badRate',
      data: [2.28, 1.34, 1060],
    })
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
