import { describe, expect, it } from 'vitest'
import { repairAgentInput } from '../repair'
import { previewVizualNativeInput } from '../preview'
import type { VizualNativeInput } from '../types'

function singleElement(input: VizualNativeInput) {
  const result = repairAgentInput(input)
  const spec = result.input as { root?: string; elements?: Record<string, { type?: string; props?: Record<string, unknown> }> }
  const id = spec.root ?? Object.keys(spec.elements ?? {})[0]
  return { result, element: spec.elements?.[id ?? ''] }
}

describe('repairAgentInput — ECharts option objects', () => {
  it('converts a single-series bar option into a native BarChart with the same data', () => {
    const { result, element } = singleElement({
      title: { text: '月度销售' },
      tooltip: {},
      xAxis: { type: 'category', data: ['1月', '2月', '3月'] },
      yAxis: { type: 'value' },
      series: [{ name: '销量', type: 'bar', data: [120, 135, 168] }],
    } as unknown as VizualNativeInput)

    expect(result.changed).toBe(true)
    expect(result.repairs[0].code).toBe('vizual.repair.echarts_option')
    expect(element?.type).toBe('BarChart')
    expect(element?.props?.title).toBe('月度销售')
    expect(element?.props?.x).toBe('category')
    expect(element?.props?.y).toBe('销量')
    expect(element?.props?.data).toEqual([
      { category: '1月', 销量: 120 },
      { category: '2月', 销量: 135 },
      { category: '3月', 销量: 168 },
    ])
  })

  it('preserves multi-series bars as a multi-y BarChart that really renders', () => {
    const preview = previewVizualNativeInput({
      xAxis: { type: 'category', data: ['Q1', 'Q2'] },
      yAxis: { type: 'value' },
      series: [
        { name: 'online', type: 'bar', data: [80, 120] },
        { name: 'offline', type: 'bar', data: [40, 80] },
      ],
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.spec?.elements && Object.values(preview.spec.elements)[0]?.type).toBe('BarChart')
    expect(preview.issues.some(i => i.code === 'vizual.repair.echarts_option')).toBe(true)
    expect(preview.issues.every(i => i.severity !== 'error')).toBe(true)
  })

  it('converts mixed bar+line series into a ComboChart with explicit series mapping', () => {
    const { element } = singleElement({
      xAxis: { data: ['1月', '2月'] },
      yAxis: [{ type: 'value' }, { type: 'value' }],
      series: [
        { name: 'revenue', type: 'bar', data: [120, 135] },
        { name: 'growth', type: 'line', data: [15, 12] },
      ],
    } as unknown as VizualNativeInput)

    expect(element?.type).toBe('ComboChart')
    const series = element?.props?.series as Array<{ name: string; type: string; y: string }>
    expect(series).toEqual([
      { name: 'revenue', type: 'bar', y: 'revenue' },
      { name: 'growth', type: 'line', y: 'growth' },
    ])
  })

  it('converts a pie option (name/value pairs) into a native PieChart', () => {
    const { element } = singleElement({
      series: [{ type: 'pie', data: [{ name: '直营', value: 60 }, { name: '加盟', value: 40 }] }],
      legend: {},
    } as unknown as VizualNativeInput)

    expect(element?.type).toBe('PieChart')
    expect(element?.props?.data).toEqual([
      { name: '直营', value: 60 },
      { name: '加盟', value: 40 },
    ])
  })

  it('coerces thousands-separated and percent strings inside ECharts series', () => {
    const { element } = singleElement({
      xAxis: { data: ['东城', '西城'] },
      yAxis: {},
      series: [{ name: 'wait', type: 'bar', data: ['1,234', '2,345'] }],
    } as unknown as VizualNativeInput)

    expect(element?.props?.data).toEqual([
      { category: '东城', wait: 1234 },
      { category: '西城', wait: 2345 },
    ])
  })

  it('does NOT convert (and lets the validator reject) when series data is non-numeric / fabricated would be required', () => {
    const result = repairAgentInput({
      xAxis: { data: ['A', 'B'] },
      yAxis: {},
      series: [{ name: 's', type: 'bar', data: ['n/a', 'pending'] }],
    } as unknown as VizualNativeInput)
    // No faithful numeric mapping exists → leave untouched so opaque/empty rejection fires.
    expect(result.changed).toBe(false)
    const preview = previewVizualNativeInput(result.input)
    expect(preview.ok).toBe(false)
  })

  it('does NOT convert unsupported chart families (radar) — they fall through to rejection', () => {
    const result = repairAgentInput({
      radar: { indicator: [{ name: 'A', max: 100 }] },
      series: [{ type: 'radar', data: [{ value: [80], name: 'x' }] }],
    } as unknown as VizualNativeInput)
    expect(result.changed).toBe(false)
  })
})

describe('repairAgentInput — Chart.js configs', () => {
  it('converts a Chart.js bar config into a native BarChart', () => {
    const { result, element } = singleElement({
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Sales', data: [120, 135, 168] }],
      },
      options: { plugins: { title: { text: 'Monthly Sales' } } },
    } as unknown as VizualNativeInput)

    expect(result.repairs[0].code).toBe('vizual.repair.chartjs_config')
    expect(element?.type).toBe('BarChart')
    expect(element?.props?.title).toBe('Monthly Sales')
    expect(element?.props?.data).toEqual([
      { category: 'Jan', Sales: 120 },
      { category: 'Feb', Sales: 135 },
      { category: 'Mar', Sales: 168 },
    ])
  })

  it('converts a Chart.js doughnut config into a PieChart with donut mode', () => {
    const { element } = singleElement({
      type: 'doughnut',
      data: { labels: ['A', 'B'], datasets: [{ data: [30, 70] }] },
    } as unknown as VizualNativeInput)

    expect(element?.type).toBe('PieChart')
    expect(element?.props?.donut).toBe(true)
    expect(element?.props?.data).toEqual([{ name: 'A', value: 30 }, { name: 'B', value: 70 }])
  })

  it('renders the converted Chart.js chart end-to-end (ok:true, no errors)', () => {
    const preview = previewVizualNativeInput({
      type: 'line',
      data: { labels: ['Jan', 'Feb'], datasets: [{ label: 'users', data: [10, 20] }] },
    } as unknown as VizualNativeInput)
    expect(preview.ok).toBe(true)
    expect(preview.issues.every(i => i.severity !== 'error')).toBe(true)
  })
})

describe('repairAgentInput — JSON string + idempotency', () => {
  it('parses a JSON string payload and then converts the dialect inside it', () => {
    const result = repairAgentInput(
      JSON.stringify({
        xAxis: { data: ['A', 'B'] },
        yAxis: {},
        series: [{ name: 'v', type: 'bar', data: [1, 2] }],
      }) as unknown as VizualNativeInput,
    )
    expect(result.repairs.map(r => r.code)).toEqual([
      'vizual.repair.parsed_json_string',
      'vizual.repair.echarts_option',
    ])
  })

  it('leaves already-native component input untouched (no repairs)', () => {
    const native = { components: [{ type: 'BarChart', x: 'b', y: 'w', data: [{ b: 'A', w: 5 }] }] } as unknown as VizualNativeInput
    const result = repairAgentInput(native)
    expect(result.changed).toBe(false)
    expect(result.repairs).toEqual([])
    expect(result.input).toBe(native)
  })

  it('leaves a flat root/elements spec untouched', () => {
    const spec = { root: 'c', elements: { c: { type: 'PieChart', props: { type: 'pie', data: [{ name: 'A', value: 1 }] } } } } as unknown as VizualNativeInput
    const result = repairAgentInput(spec)
    expect(result.changed).toBe(false)
  })

  it('is idempotent: repairing a converted spec again is a no-op', () => {
    const once = repairAgentInput({
      xAxis: { data: ['A'] }, yAxis: {}, series: [{ name: 'v', type: 'bar', data: [1] }],
    } as unknown as VizualNativeInput)
    const twice = repairAgentInput(once.input)
    expect(twice.changed).toBe(false)
    expect(twice.input).toBe(once.input)
  })
})
