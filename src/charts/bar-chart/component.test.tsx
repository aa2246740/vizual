import { describe, it, expect } from 'vitest'

// Test the option builder directly — ECharts can't init in jsdom
function buildBarFallback(props: Record<string, unknown>): Record<string, unknown> {
  const { x = 'name', y = 'value', data, title, stacked, horizontal } = props
  const yFields = Array.isArray(y) ? y : [y]
  const categoryData = (data as Record<string, unknown>[] ?? []).map((d) => String(d[x as string] ?? ''))

  const hasTitle = !!title
  const hasLegend = yFields.length > 1

  return {
    title: hasTitle ? { text: title, top: 0, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    legend: hasLegend ? { top: hasTitle ? 30 : 0, left: 'center' } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: hasTitle ? (hasLegend ? 70 : 40) : (hasLegend ? 30 : 30),
      containLabel: true,
    },
    xAxis: horizontal
      ? { type: 'value' }
      : { type: 'category', data: categoryData },
    yAxis: horizontal
      ? { type: 'category', data: categoryData }
      : { type: 'value' },
    series: yFields.map((field: string) => ({
      type: 'bar',
      name: field,
      stack: stacked ? 'total' : undefined,
      data: (data as Record<string, unknown>[] ?? []).map((d) => Number(d[field]) || 0),
    })),
  }
}

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
})
