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

describe('repairAgentInput — native model shorthand conventions', () => {
  it('normalizes KpiDashboard props.kpis to props.metrics inside root/elements specs', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: { kpis: [{ label: '优先加资源', value: '3家' }] },
        },
      },
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.issues.some(i => i.code === 'vizual.repair.native_component_props')).toBe(true)
    expect(preview.spec?.elements.root?.props?.metrics).toEqual([
      { label: '优先加资源', value: '3家' },
    ])
  })

  it('normalizes a single KpiDashboard card shorthand without inventing values', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['risk'] },
        risk: {
          type: 'KpiDashboard',
          props: {
            label: '风险预警',
            value: '北苑支行',
            subtext: '不良2.35%',
            trend: 'down',
          },
        },
      },
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.spec?.elements.risk?.props?.metrics).toMatchObject([
      {
        label: '风险预警',
        value: '北苑支行',
        description: '不良2.35%',
        trend: 'down',
      },
    ])
  })

  it('does not fabricate a KpiDashboard metric when label or value is missing', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: { label: '风险预警' },
        },
      },
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(false)
    expect(preview.issues.some(i => i.code === 'vizual.empty_content')).toBe(true)
  })

  it('normalizes chart field aliases only to fields that really exist in data rows', () => {
    const preview = previewVizualNativeInput({
      components: [
        {
          type: 'BubbleChart',
          title: '增长-效率-风险匹配验证',
          xAxis: '月活环比(%)',
          yAxis: '手机银行活跃率(%)',
          sizeField: '存款增量(亿元)',
          colorField: '不良率(%)',
          data: [
            { name: '云谷支行', x: 26.8, y: 88, size: 31, color: 0.52 },
            { name: '北苑支行', x: -3.2, y: 45, size: 1, color: 2.35 },
          ],
        },
      ],
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.issues.some(i => i.code === 'vizual.repair.native_component_props')).toBe(true)
    const chart = Object.values(preview.spec?.elements ?? {}).find(element => element.type === 'BubbleChart')
    expect(chart?.props?.x).toBe('x')
    expect(chart?.props?.y).toBe('y')
    expect(chart?.props?.size).toBe('size')
    expect(chart?.props?.color).toBe('color')
  })

  it('normalizes invalid display-label chart bindings to existing x/y/size row fields', () => {
    const preview = previewVizualNativeInput({
      components: [
        {
          type: 'BubbleChart',
          title: '增长质量 vs 风险水平',
          x: '客户增长(%)',
          y: '不良率(%)',
          size: '手机银行活跃率(%)',
          data: [
            { name: '高科分行', x: 22.5, y: 0.66, size: 84 },
            { name: '北岭分行', x: -4.5, y: 2.28, size: 39 },
          ],
        },
      ],
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.issues.some(i => i.code === 'vizual.repair.native_component_props')).toBe(true)
    const chart = Object.values(preview.spec?.elements ?? {}).find(element => element.type === 'BubbleChart')
    expect(chart?.props?.x).toBe('x')
    expect(chart?.props?.y).toBe('y')
    expect(chart?.props?.size).toBe('size')
  })

  it('normalizes common RadarChart indicators plus data values into direct series mode', () => {
    const preview = previewVizualNativeInput({
      components: [
        {
          type: 'RadarChart',
          title: '五分行能力画像对比',
          indicators: ['客户增长', '手机活跃率', '等候效率', '资产质量', '贷款投放'],
          data: [
            { name: '高科分行', values: [95, 90, 95, 95, 85] },
            { name: '北岭分行', values: [5, 38, 5, 20, 32] },
          ],
        },
      ],
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.issues.some(i => i.code === 'vizual.repair.native_component_props')).toBe(true)
    const chart = Object.values(preview.spec?.elements ?? {}).find(element => element.type === 'RadarChart')
    expect(chart?.props?.indicators).toEqual([
      { name: '客户增长' },
      { name: '手机活跃率' },
      { name: '等候效率' },
      { name: '资产质量' },
      { name: '贷款投放' },
    ])
    expect(chart?.props?.series).toEqual([
      { name: '高科分行', values: [95, 90, 95, 95, 85] },
      { name: '北岭分行', values: [5, 38, 5, 20, 32] },
    ])
    expect(chart?.props?.data).toBeUndefined()
  })

  it('normalizes common RadarChart categories plus series values into indicators mode', () => {
    const preview = previewVizualNativeInput({
      components: [
        {
          type: 'RadarChart',
          title: '五分行能力画像对比',
          categories: ['客户增长', '手机活跃', '资产质量'],
          series: [
            { name: '高科分行', values: [95, 90, 95] },
            { name: '北岭分行', values: [5, 38, 20] },
          ],
        },
      ],
    } as unknown as VizualNativeInput)

    expect(preview.ok).toBe(true)
    expect(preview.issues.some(i => i.code === 'vizual.repair.native_component_props')).toBe(true)
    const chart = Object.values(preview.spec?.elements ?? {}).find(element => element.type === 'RadarChart')
    expect(chart?.props?.indicators).toEqual([
      { name: '客户增长' },
      { name: '手机活跃' },
      { name: '资产质量' },
    ])
    expect(chart?.props?.categories).toBeUndefined()
    expect(chart?.props?.series).toEqual([
      { name: '高科分行', values: [95, 90, 95] },
      { name: '北岭分行', values: [5, 38, 20] },
    ])
  })
})
