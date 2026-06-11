import { describe, expect, it } from 'vitest'
import { buildLineFallback } from '../../charts/line/component'
import { buildScatterFallback } from '../../charts/scatter/component'
import { nativeInputsToVizualSnapshot } from '../../native-core/core'
import { validateVizualNativeInput } from '../../native-core/validate'
import type { VizualSpec } from '../artifact'
import { withDefaultElementProps } from '../spec-validation'

function normalizeChart(type: string, props: Record<string, unknown>) {
  const spec: VizualSpec = {
    root: 'chart',
    elements: {
      chart: { type, props },
    },
  }
  return withDefaultElementProps(spec).elements!.chart.props as Record<string, unknown>
}

describe('chart field alias normalization', () => {
  const rows = [
    {
      quarter: '2025Q3',
      fund: '甲',
      risk: 18.5,
      return: 23.7,
      aum: 32,
      low: 10,
      high: 24,
      sourceName: '渠道A',
      targetName: '产品B',
      amount: 128,
      stage: '访问',
      date: '2026-06-01',
      region: '华东',
      product: '存款',
      score: 91,
    },
    {
      quarter: '2025Q4',
      fund: '乙',
      risk: 32.7,
      return: 12.1,
      aum: 118,
      low: 12,
      high: 30,
      sourceName: '渠道B',
      targetName: '产品C',
      amount: 256,
      stage: '转化',
      date: '2026-06-02',
      region: '华南',
      product: '理财',
      score: 78,
    },
  ]

  it.each([
    ['AreaChart', { data: rows, xField: 'quarter', series: ['return', 'risk'] }, { x: 'quarter', y: ['return', 'risk'] }],
    ['BarChart', { data: rows, xKey: 'fund', yKey: 'return' }, { x: 'fund', y: 'return' }],
    ['BoxplotChart', { data: rows, xField: 'fund', valueField: 'return' }, { x: 'fund', groupField: 'fund', valueField: 'return', y: 'return' }],
    ['BubbleChart', { data: rows, xField: 'risk', yField: 'return', sizeField: 'aum', labelField: 'fund' }, { x: 'risk', y: 'return', size: 'aum', label: 'fund' }],
    ['CalendarChart', { data: rows, xField: 'date', yField: 'score' }, { x: 'date', y: 'score', dateField: 'date', valueField: 'score' }],
    ['ComboChart', { data: rows, xField: 'quarter', series: ['return', 'risk'] }, { x: 'quarter', y: ['return', 'risk'] }],
    ['DumbbellChart', { data: rows, categoryField: 'fund', lowField: 'low', highField: 'high' }, { x: 'fund', groupField: 'fund', low: 'low', high: 'high', y: ['low', 'high'] }],
    ['FunnelChart', { data: rows, labelField: 'stage', valueField: 'amount' }, { x: 'stage', label: 'stage', value: 'amount', y: 'amount' }],
    ['HeatmapChart', { data: rows, xField: 'region', yField: 'product', valueField: 'score' }, { x: 'region', y: 'product', xField: 'region', yField: 'product', valueField: 'score' }],
    ['HistogramChart', { data: rows, valueField: 'score' }, { y: 'score' }],
    ['LineChart', { data: rows, xField: 'quarter', series: ['return', 'risk'] }, { x: 'quarter', y: ['return', 'risk'] }],
    ['LineChart', { data: rows, xAxisKey: 'quarter', series: [{ key: 'return', label: '收益率' }] }, { x: 'quarter', y: ['return'] }],
    ['LineChart', { data: rows, xAxis: 'quarter', yAxis: { key: 'return', label: '收益率' } }, { x: 'quarter', y: ['return'] }],
    ['PieChart', { data: rows, nameField: 'fund', valueField: 'return' }, { x: 'fund', label: 'fund', value: 'return', y: 'return' }],
    ['RadarChart', { data: rows, xField: 'fund', yFields: ['return', 'risk'] }, { x: 'fund', y: ['return', 'risk'] }],
    ['SankeyChart', { data: rows, sourceField: 'sourceName', targetField: 'targetName', valueField: 'amount' }, { data: expect.arrayContaining([expect.objectContaining({ source: '渠道A', target: '产品B', value: 128 })]) }],
    ['ScatterChart', { data: rows, xField: 'risk', yField: 'return', sizeField: 'aum', labelField: 'fund' }, { x: 'risk', y: 'return', size: 'aum', label: 'fund' }],
    ['SparklineChart', { data: rows, xField: 'quarter', yField: 'score' }, { x: 'quarter', y: 'score' }],
    ['WaterfallChart', { data: rows, labelField: 'stage', valueField: 'amount' }, { x: 'stage', label: 'stage', value: 'amount', y: 'amount' }],
    ['XmrChart', { data: rows, xField: 'quarter', yField: 'score' }, { x: 'quarter', y: 'score', label: 'quarter', value: 'score' }],
  ])('normalizes %s agent field aliases', (componentType, props, expected) => {
    expect(normalizeChart(componentType, props)).toMatchObject(expected)
  })

  it('normalizes typed chart encoding without requiring agents to hand-write renderer props', () => {
    expect(normalizeChart('BarChart', {
      data: rows,
      encoding: {
        x: { field: 'fund', type: 'nominal' },
        y: { field: 'return', type: 'quantitative' },
      },
    })).toMatchObject({ x: 'fund', y: 'return' })

    expect(normalizeChart('PieChart', {
      data: rows,
      encoding: {
        label: { field: 'fund', type: 'nominal' },
        value: { field: 'return', type: 'quantitative' },
      },
    })).toMatchObject({ label: 'fund', value: 'return', y: 'return' })

    expect(normalizeChart('ScatterChart', {
      data: rows,
      encoding: {
        x: { field: 'risk', type: 'quantitative' },
        y: { field: 'return', type: 'quantitative' },
        size: { field: 'aum', type: 'quantitative' },
        label: { field: 'fund', type: 'nominal' },
      },
    })).toMatchObject({ x: 'risk', y: 'return', size: 'aum', label: 'fund' })

    expect(normalizeChart('HeatmapChart', {
      data: rows,
      encoding: {
        x: { field: 'region', type: 'nominal' },
        y: { field: 'product', type: 'nominal' },
        value: { field: 'score', type: 'quantitative' },
      },
    })).toMatchObject({ x: 'region', y: 'product', xField: 'region', yField: 'product', valueField: 'score' })

    expect(normalizeChart('CalendarChart', {
      data: rows,
      encoding: {
        date: { field: 'date', type: 'temporal' },
        value: { field: 'score', type: 'quantitative' },
      },
    })).toMatchObject({ dateField: 'date', valueField: 'score' })

    expect(normalizeChart('DumbbellChart', {
      data: rows,
      encoding: {
        group: { field: 'fund', type: 'nominal' },
        low: { field: 'low', type: 'quantitative' },
        high: { field: 'high', type: 'quantitative' },
      },
    })).toMatchObject({ groupField: 'fund', low: 'low', high: 'high', y: ['low', 'high'] })
  })

  it('compiles measures into ComboChart series instead of asking agents to hand-code series', () => {
    const normalized = normalizeChart('ComboChart', {
      data: rows,
      encoding: { x: { field: 'quarter', type: 'ordinal' } },
      measures: [
        { field: 'return', label: '收益率', mark: 'bar', axis: 'left' },
        { field: 'risk', label: '风险值', mark: 'line', axis: 'right' },
        { field: 'aum', label: '规模', mark: 'scatter', size: 'aum', axis: 'right' },
      ],
    })

    expect(normalized).toMatchObject({
      x: 'quarter',
      y: ['return', 'risk', 'aum'],
      series: [
        { type: 'bar', y: 'return', name: '收益率', yAxisIndex: 0 },
        { type: 'line', y: 'risk', name: '风险值', yAxisIndex: 1 },
        { type: 'scatter', y: 'aum', name: '规模', size: 'aum', yAxisIndex: 1 },
      ],
    })
  })

  it('pivots long-form chart encoding into wide renderer data for grouped trends', () => {
    const normalized = normalizeChart('LineChart', {
      title: '客户端活跃用户趋势',
      data: [
        { month: '2025-01', client: 'iOS', activeUsers: 45000 },
        { month: '2025-01', client: 'Android', activeUsers: 52000 },
        { month: '2025-02', client: 'iOS', activeUsers: 48000 },
        { month: '2025-02', client: 'Android', activeUsers: 55000 },
      ],
      encoding: {
        x: { field: 'month', type: 'temporal' },
        y: { field: 'activeUsers', type: 'quantitative' },
        color: { field: 'client', type: 'nominal' },
      },
    })

    expect(normalized).toMatchObject({
      x: 'month',
      y: ['iOS', 'Android'],
      data: [
        { month: '2025-01', iOS: 45000, Android: 52000 },
        { month: '2025-02', iOS: 48000, Android: 55000 },
      ],
    })

    const option = buildLineFallback(normalized as any)
    expect(option.series).toEqual([
      expect.objectContaining({ name: 'iOS', data: [45000, 48000] }),
      expect.objectContaining({ name: 'Android', data: [52000, 55000] }),
    ])
  })

  it('aggregates duplicate long-form groups while pivoting typed chart encoding', () => {
    const normalized = normalizeChart('BarChart', {
      data: [
        { month: '2025-01', client: 'iOS', business: '个人助手', calls: 120 },
        { month: '2025-01', client: 'iOS', business: '企业Agent', calls: 380 },
        { month: '2025-01', client: 'Android', business: '个人助手', calls: 135 },
        { month: '2025-01', client: 'Android', business: '企业Agent', calls: 520 },
      ],
      encoding: {
        x: 'month',
        y: 'calls',
        color: 'client',
      },
    })

    expect(normalized).toMatchObject({
      x: 'month',
      y: ['iOS', 'Android'],
      data: [{ month: '2025-01', iOS: 500, Android: 655 }],
    })
  })

  it('normalizes typed Sankey encoding into source/target/value rows', () => {
    const normalized = normalizeChart('SankeyChart', {
      data: rows,
      encoding: {
        source: { field: 'sourceName', type: 'nominal' },
        target: { field: 'targetName', type: 'nominal' },
        value: { field: 'amount', type: 'quantitative' },
      },
    })

    expect(normalized.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: '渠道A', target: '产品B', value: 128 }),
      expect.objectContaining({ source: '渠道B', target: '产品C', value: 256 }),
    ]))
  })

  it('does not treat a scalar series string as a required numeric measure', () => {
    expect(normalizeChart('LineChart', {
      data: rows,
      xField: 'quarter',
      yField: 'return',
      series: 'line',
    })).toMatchObject({
      x: 'quarter',
      y: 'return',
    })
  })

  it('normalizes agent BarChart series x/y points when axis labels are display text', () => {
    const normalized = normalizeChart('BarChart', {
      title: '请求重复度对命中率的影响',
      xAxis: '请求重复度(%)',
      yAxis: '命中率(%)',
      series: [
        {
          name: '命中率',
          data: [
            { x: '20%', y: 11.8 },
            { x: '60%', y: 60.7 },
            { x: '90%', y: 93.0 },
          ],
        },
      ],
    })

    expect(normalized).toMatchObject({
      x: 'x',
      y: ['命中率'],
      data: [
        { x: '20%', 命中率: 11.8 },
        { x: '60%', 命中率: 60.7 },
        { x: '90%', 命中率: 93.0 },
      ],
    })

    const result = validateVizualNativeInput({
      type: 'vizual_native',
      version: '1.0',
      root: 'chart',
      elements: {
        chart: { type: 'BarChart', props: normalized },
      },
    } as any)
    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).not.toContain('vizual.chart_missing_data_field')
  })

  it('normalizes agent ComboChart x/y point series into tabular rows', () => {
    const normalized = normalizeChart('ComboChart', {
      xAxis: '缓存容量（槽位）',
      yAxes: ['命中率(%)', '平均延迟(ms)'],
      series: [
        {
          name: '命中率',
          type: 'line',
          yAxisIndex: 0,
          data: [{ x: 10, y: 13.3 }, { x: 50, y: 60.7 }],
        },
        {
          name: '平均延迟',
          type: 'line',
          yAxisIndex: 1,
          data: [{ x: 10, y: 174 }, { x: 50, y: 80 }],
        },
      ],
    })

    expect(normalized).toMatchObject({
      x: 'x',
      y: ['命中率', '平均延迟'],
      data: [
        { x: 10, 命中率: 13.3, 平均延迟: 174 },
        { x: 50, 命中率: 60.7, 平均延迟: 80 },
      ],
      series: [
        { type: 'line', y: '命中率', yAxisIndex: 0 },
        { type: 'line', y: '平均延迟', yAxisIndex: 1 },
      ],
    })
  })

  it('canonicalizes direct native component fields into renderer type fields', () => {
    const spec = withDefaultElementProps({
      root: 'chart',
      elements: {
        chart: {
          component: 'BarChart',
          props: {
            type: 'bar',
            title: 'A/B/C',
            data: [
              { label: 'A', value: 10 },
              { label: 'B', value: 18 },
              { label: 'C', value: 7 },
            ],
            x: 'label',
            y: 'value',
          },
        },
      },
    })

    expect(spec.elements!.chart).toMatchObject({
      type: 'BarChart',
      props: {
        type: 'bar',
        x: 'label',
        y: 'value',
      },
    })
    expect(spec.elements!.chart.component).toBeUndefined()
  })

  it('keeps generic Container as a renderable native primitive', () => {
    const spec = withDefaultElementProps({
      root: 'root',
      elements: {
        root: {
          component: 'Container',
          props: {
            direction: 'row',
            gap: 16,
            flexWrap: 'wrap',
            background: '#fff',
            padding: '24px',
          },
          children: ['dot', 'label'],
        },
        dot: {
          component: 'Container',
          props: {
            width: 14,
            height: 14,
            background: '#3b82f6',
            borderRadius: '50%',
          },
        },
        label: {
          component: 'Text',
          props: {
            content: 'Container renders',
          },
        },
      },
    })

    expect(spec.elements!.root).toMatchObject({
      type: 'Container',
      props: {
        direction: 'row',
        flexWrap: 'wrap',
        padding: '24px',
      },
    })
    expect(spec.elements!.dot).toMatchObject({
      type: 'Container',
      props: {
        width: 14,
        height: 14,
        background: '#3b82f6',
      },
    })
  })

  it('fills responsive defaults for chart cards placed in a Row', () => {
    const spec = withDefaultElementProps({
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['row'] },
        row: { type: 'Row', children: ['left', 'right'] },
        left: { type: 'Card', props: { title: '会员来源占比' }, children: ['pie'] },
        right: { type: 'Card', props: { title: '营销投入 vs 获客人数' }, children: ['combo'] },
        pie: {
          type: 'PieChart',
          props: {
            type: 'pie',
            label: 'channel',
            value: 'share',
            data: [{ channel: '官网', share: 31.2 }, { channel: '门店', share: 19.6 }],
          },
        },
        combo: {
          type: 'ComboChart',
          props: {
            type: 'combo',
            x: 'channel',
            data: [{ channel: '抖音', spend: 720, acquired: 8600 }, { channel: '小红书', spend: 120, acquired: 3700 }],
            series: [
              { type: 'bar', y: 'spend', name: '投入' },
              { type: 'line', y: 'acquired', name: '获客' },
            ],
          },
        },
      },
    })

    expect(spec.elements!.left.props).toMatchObject({ flex: '1 1 0', width: 0, minHeight: 360 })
    expect(spec.elements!.right.props).toMatchObject({ flex: '1 1 0', width: 0, minHeight: 360 })
  })

  it('preserves explicit row child layout props', () => {
    const spec = withDefaultElementProps({
      root: 'root',
      elements: {
        root: { type: 'Row', children: ['left', 'right'] },
        left: {
          type: 'Card',
          props: { flex: '2 1 0', width: '60%', minHeight: 420 },
          children: ['chart'],
        },
        right: { type: 'Card', props: { flex: '1 1 0', width: '40%' }, children: ['note'] },
        chart: {
          type: 'BarChart',
          props: {
            type: 'bar',
            x: 'name',
            y: 'value',
            data: [{ name: 'A', value: 1 }],
          },
        },
        note: { type: 'Markdown', props: { content: 'OK' } },
      },
    })

    expect(spec.elements!.left.props).toMatchObject({ flex: '2 1 0', width: '60%', minHeight: 420 })
    expect(spec.elements!.right.props).toMatchObject({ flex: '1 1 0', width: '40%' })
  })

  it('warns when a row contains too many peer chart panels', () => {
    const result = validateVizualNativeInput({
      root: 'root',
      elements: {
        root: { type: 'Row', children: ['a', 'b', 'c'] },
        a: {
          type: 'Card',
          children: ['a-chart'],
          props: {},
        },
        b: {
          type: 'Card',
          children: ['b-chart'],
          props: {},
        },
        c: {
          type: 'Card',
          children: ['c-chart'],
          props: {},
        },
        'a-chart': { type: 'BarChart', props: { type: 'bar', x: 'name', y: 'value', data: [{ name: 'A', value: 1 }] } },
        'b-chart': { type: 'BarChart', props: { type: 'bar', x: 'name', y: 'value', data: [{ name: 'B', value: 2 }] } },
        'c-chart': { type: 'BarChart', props: { type: 'bar', x: 'name', y: 'value', data: [{ name: 'C', value: 3 }] } },
      },
    } as any)

    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).toContain('vizual.layout.too_many_peer_charts')
  })

  it('warns when line charts mix fields with very different scales', () => {
    const result = validateVizualNativeInput({
      root: 'chart',
      elements: {
        chart: {
          type: 'LineChart',
          props: {
            type: 'line',
            x: 'month',
            y: ['retention', 'mau'],
            data: [
              { month: '1月', retention: 82, mau: 64000 },
              { month: '2月', retention: 79, mau: 61000 },
            ],
          },
        },
      },
    } as any)

    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).toContain('vizual.layout.mixed_scale_line_chart')
  })

  it('normalizes ECharts-style categories plus nested series data from Claude Code', () => {
    expect(normalizeChart('BarChart', {
      title: '各门店营收环比变化',
      data: {
        categories: ['宁波天一店', '苏州中心店'],
        series: [
          {
            name: '营收环比变化(%)',
            type: 'bar',
            data: [
              { value: -22.2, itemStyle: { color: '#ef4444' } },
              { value: -18.6, itemStyle: { color: '#ef4444' } },
            ],
          },
        ],
      },
    })).toMatchObject({
      data: [
        { label: '宁波天一店', '营收环比变化(%)': -22.2 },
        { label: '苏州中心店', '营收环比变化(%)': -18.6 },
      ],
      x: 'label',
      y: ['营收环比变化(%)'],
    })
  })

  it('accepts Claude Code ComboChart bar/line field arrays without requiring a generic value field', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'real-claude-combo', catalogId: 'vizual' },
      {
        type: 'surface.updateComponents',
        surfaceId: 'real-claude-combo',
        components: [
          { id: 'root', component: 'Column', children: ['chart'] },
          {
            id: 'chart',
            component: 'ComboChart',
            props: {
              title: '各门店营收环比变化 vs 转化率',
              x: '门店',
              bar: ['营收环比变化(%)'],
              line: ['转化率(%)'],
              data: [
                { '门店': '宁波天一', '营收环比变化(%)': -22.2, '转化率(%)': 15.9 },
                { '门店': '苏州中心', '营收环比变化(%)': -18.6, '转化率(%)': 18.3 },
              ],
            },
          },
        ],
      },
    ] as any)

    expect(result.ok).toBe(true)
    const normalized = withDefaultElementProps(result.normalized.snapshot!.spec)
    expect(normalized.elements!.chart.props).toMatchObject({
      x: '门店',
      y: ['营收环比变化(%)', '转化率(%)'],
      series: [
        { type: 'bar', y: '营收环比变化(%)' },
        { type: 'line', y: '转化率(%)' },
      ],
    })
  })

  it('accepts ComboChart bar/line/scatter series for dual-axis dense visualizations', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'rd-combo', catalogId: 'vizual' },
      {
        type: 'surface.updateComponents',
        surfaceId: 'rd-combo',
        components: [
          { id: 'root', component: 'Column', props: { children: ['chart'] } },
          {
            id: 'chart',
            component: 'ComboChart',
            props: {
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
            },
          },
        ],
      },
    ] as any)

    expect(result.ok).toBe(true)
    const normalized = withDefaultElementProps(result.normalized.snapshot!.spec)
    expect(normalized.elements!.chart.props).toMatchObject({
      x: 'week',
      series: [
        { type: 'bar', y: 'hours' },
        { type: 'line', y: 'crashRate' },
        { type: 'scatter', y: 'crashRate', size: 'churnRate' },
      ],
    })
  })

  it('keeps wide line series numeric instead of falling back to value=0', () => {
    const normalized = normalizeChart('LineChart', {
      data: rows,
      xField: 'quarter',
      series: ['return', 'risk'],
    })

    const option = buildLineFallback(normalized as any)
    expect(option.series).toEqual([
      expect.objectContaining({ name: 'return', data: [23.7, 12.1] }),
      expect.objectContaining({ name: 'risk', data: [18.5, 32.7] }),
    ])
  })

  it('normalizes agent chart-local series data with xLabels into row data', () => {
    const normalized = normalizeChart('LineChart', {
      xLabels: ['2024Q1', '2024Q2'],
      series: [
        { name: '甲', data: [1, 1.052] },
        { name: '乙', data: [1, 0.982] },
      ],
    })

    expect(normalized).toMatchObject({
      x: 'label',
      y: ['甲', '乙'],
      data: [
        { label: '2024Q1', '甲': 1, '乙': 1 },
        { label: '2024Q2', '甲': 1.052, '乙': 0.982 },
      ],
    })
    const option = buildLineFallback(normalized as any)
    expect(option.series).toEqual([
      expect.objectContaining({ name: '甲', data: [1, 1.052] }),
      expect.objectContaining({ name: '乙', data: [1, 0.982] }),
    ])
  })

  it.each([
    'AreaChart',
    'BarChart',
    'ComboChart',
    'LineChart',
    'PieChart',
    'RadarChart',
    'ScatterChart',
    'SparklineChart',
    'WaterfallChart',
    'XmrChart',
  ])(
    'normalizes Chart.js labels and datasets nested under data for %s',
    componentType => {
      const normalized = normalizeChart(componentType, {
        title: '各区域响应超时情况（实际-目标）',
        xLabel: '区域',
        yLabel: '超时分钟数',
        data: {
          labels: ['Downtown', 'Westside', 'Northside', 'Eastside'],
          datasets: [
            { label: '平均超时(分钟)', data: [0.3, 10, -1, 4] },
          ],
        },
      })

      expect(normalized).toMatchObject({
        x: 'label',
        y: ['平均超时(分钟)'],
        data: [
          { label: 'Downtown', '平均超时(分钟)': 0.3 },
          { label: 'Westside', '平均超时(分钟)': 10 },
          { label: 'Northside', '平均超时(分钟)': -1 },
          { label: 'Eastside', '平均超时(分钟)': 4 },
        ],
      })
    },
  )

  it.each(['AreaChart', 'BarChart', 'ComboChart', 'LineChart'])(
    'normalizes ECharts xAxis.data and series nested under data for %s',
    componentType => {
      const normalized = normalizeChart(componentType, {
        data: {
          xAxis: { data: ['D1', 'D2'] },
          series: [
            { name: '超时', data: [3, 8] },
            { name: '达标', data: [9, 4] },
          ],
        },
      })

      expect(normalized).toMatchObject({
        x: 'label',
        y: ['超时', '达标'],
        data: [
          { label: 'D1', 超时: 3, 达标: 9 },
          { label: 'D2', 超时: 8, 达标: 4 },
        ],
      })
    },
  )

  it('normalizes top-level ECharts xAxis.data and series', () => {
    const normalized = normalizeChart('BarChart', {
      xAxis: { data: ['D1', 'D2'] },
      series: [
        { name: '超时', data: [3, 8] },
      ],
    })

    expect(normalized).toMatchObject({
      x: 'label',
      y: ['超时'],
      data: [
        { label: 'D1', 超时: 3 },
        { label: 'D2', 超时: 8 },
      ],
    })
  })

  it('normalizes chart-local label/value series and scatter points', () => {
    expect(normalizeChart('BarChart', {
      series: [
        { label: '甲', value: 11.2 },
        { label: '乙', value: 5.9 },
      ],
    })).toMatchObject({
      x: 'label',
      y: 'value',
      data: [
        { label: '甲', value: 11.2 },
        { label: '乙', value: 5.9 },
      ],
    })

    expect(normalizeChart('ScatterChart', {
      points: [
        { x: 18.5, y: 11.2, size: 16.2, label: '甲' },
        { x: 32.7, y: 5.9, size: 35.8, label: '乙' },
      ],
    })).toMatchObject({
      x: 'x',
      y: 'y',
      size: 'size',
      label: 'label',
      data: [
        { x: 18.5, y: 11.2, size: 16.2, label: '甲' },
        { x: 32.7, y: 5.9, size: 35.8, label: '乙' },
      ],
    })
  })

  it('preserves scatter point labels and size values for click payloads', () => {
    const normalized = normalizeChart('ScatterChart', {
      data: rows,
      xField: 'risk',
      yField: 'return',
      sizeField: 'aum',
      labelField: 'fund',
    })

    const option = buildScatterFallback(normalized as any)
    expect(option.series).toEqual([
      expect.objectContaining({
        data: [
          expect.objectContaining({ name: '甲', value: [18.5, 23.7, 32] }),
          expect.objectContaining({ name: '乙', value: [32.7, 12.1, 118] }),
        ],
      }),
    ])
  })

  it('resolves dataPath/dataKey for every native chart component', () => {
    const chartTypes = [
      'AreaChart',
      'BarChart',
      'BoxplotChart',
      'BubbleChart',
      'CalendarChart',
      'ComboChart',
      'DumbbellChart',
      'FunnelChart',
      'HeatmapChart',
      'HistogramChart',
      'LineChart',
      'PieChart',
      'RadarChart',
      'SankeyChart',
      'ScatterChart',
      'SparklineChart',
      'WaterfallChart',
      'XmrChart',
    ]
    const snapshot = nativeInputsToVizualSnapshot([
      { type: 'surface.create', surfaceId: 'charts', catalogId: 'vizual' },
      { type: 'surface.updateData', surfaceId: 'charts', path: '/', value: { rows } },
      {
        type: 'surface.updateComponents',
        surfaceId: 'charts',
        components: [
          { id: 'root', component: 'Column', children: chartTypes.map((_, index) => `chart_${index}`) },
          ...chartTypes.map((component, index) => ({
            id: `chart_${index}`,
            component,
            dataPath: '/rows',
            xField: 'quarter',
            yField: 'score',
          })),
        ],
      },
    ] as any)
    const normalized = withDefaultElementProps(snapshot!.spec)

    chartTypes.forEach((component, index) => {
      expect(normalized.elements![`chart_${index}`]).toMatchObject({
        type: component,
        props: { data: rows },
      })
    })
  })

  it('resolves native string data bindings and xAxis/yAxis aliases from a real agent shape', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { type: 'surface.create', surfaceId: 'real-agent-chart', catalogId: 'vizual' },
      { type: 'surface.updateData', surfaceId: 'real-agent-chart', path: '/', value: { trend: rows } },
      {
        type: 'surface.updateComponents',
        surfaceId: 'real-agent-chart',
        components: [
          { id: 'root', component: 'Column', children: ['trendChart'] },
          {
            id: 'trendChart',
            type: 'LineChart',
            title: '近7日营收趋势',
            data: '/trend',
            xAxis: 'quarter',
            yAxis: { key: 'return', label: '收益率' },
            action: 'drillDown',
          },
        ],
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.trendChart).toMatchObject({
      type: 'LineChart',
      props: {
        data: rows,
        x: 'quarter',
        y: ['return'],
        action: 'drillDown',
      },
    })

    const validation = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'real-agent-chart', catalogId: 'vizual' },
      { type: 'surface.updateData', surfaceId: 'real-agent-chart', path: '/', value: { trend: rows } },
      {
        type: 'surface.updateComponents',
        surfaceId: 'real-agent-chart',
        components: [
          { id: 'root', component: 'Column', children: ['trendChart'] },
          {
            id: 'trendChart',
            type: 'LineChart',
            title: '近7日营收趋势',
            data: '/trend',
            xAxis: 'quarter',
            yAxis: { key: 'return', label: '收益率' },
          },
        ],
      },
    ] as any)
    expect(validation.ok).toBe(true)
  })

  it('renders a real Codex root/layout + props envelope shape instead of orphaning children', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { type: 'surface.create', surfaceId: 'real-codex-r6', catalogId: 'vizual' },
      {
        type: 'surface.updateData',
        surfaceId: 'real-codex-r6',
        path: '/',
        value: {
          kpis: [{ name: '近7日营收', value: 1282000, unit: '元' }],
          trend: [{ day: 'D1', conversion: 24.1 }, { day: 'D2', conversion: 23.8 }],
          stores: [{ name: '宁波天一店', priority: 1, risk: '高' }],
        },
      },
      {
        type: 'surface.updateComponents',
        surfaceId: 'real-codex-r6',
        components: [
          { id: 'root', type: 'root', layout: { type: 'Column' }, children: ['kpi1', 'trend1', 'table1', 'form1'] },
          { id: 'kpi1', type: 'KpiDashboard', props: { dataPath: '/kpis' } },
          {
            id: 'trend1',
            type: 'LineChart',
            props: {
              dataPath: '/trend',
              xAxis: { field: 'day', title: '日期' },
              series: [{ field: 'conversion', name: '转化率 %' }],
              action: 'drillDown',
            },
          },
          {
            id: 'table1',
            type: 'DataTable',
            props: {
              dataPath: '/stores',
              columns: [{ field: 'priority', header: '优先级' }, { field: 'name', header: '门店' }],
            },
          },
          {
            id: 'form1',
            type: 'FormBuilder',
            props: {
              submitLabel: '提交整改计划',
              onSubmit: { action: 'submitForm' },
              fields: [{ name: 'owner', label: '执行责任人', type: 'text' }],
            },
          },
        ],
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.root).toBe('root')
    expect(normalized.elements!.root).toMatchObject({ type: 'Column', children: ['kpi1', 'trend1', 'table1', 'form1'] })
    expect(normalized.elements!.trend1).toMatchObject({
      type: 'LineChart',
      props: { data: [{ day: 'D1', conversion: 24.1 }, { day: 'D2', conversion: 23.8 }], x: 'day', y: ['conversion'] },
    })
    expect(normalized.elements!.table1).toMatchObject({
      type: 'DataTable',
      props: {
        data: [{ name: '宁波天一店', priority: 1, risk: '高' }],
        columns: [{ field: 'priority', header: '优先级', key: 'priority', label: '优先级' }, { field: 'name', header: '门店', key: 'name', label: '门店' }],
      },
    })
    expect(normalized.elements!.form1).toMatchObject({
      type: 'FormBuilder',
      props: { submitLabel: '提交整改计划' },
      on: { submit: { action: 'submitForm' } },
    })
  })

  it('normalizes r7-style top-level child props without a props envelope', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { type: 'surface.create', surfaceId: 'real-codex-r7', catalogId: 'vizual' },
      {
        type: 'surface.updateComponents',
        surfaceId: 'real-codex-r7',
        components: [
          {
            id: 'root',
            type: 'root',
            layout: { type: 'Column', gap: 'md' },
            children: [
              {
                id: 'trend-line',
                type: 'LineChart',
                title: '近7天转化率趋势',
                action: 'drillDown',
                xAxis: { key: 'day', label: '日期' },
                yAxis: { key: 'conversion', label: '转化率%' },
                series: [{ key: 'conversion', label: '转化率' }],
                data: [
                  { day: 'D1', conversion: 24.1 },
                  { day: 'D2', conversion: 23.8 },
                ],
              },
              {
                id: 'stores-table',
                type: 'DataTable',
                columns: [{ key: 'store', title: '门店' }, { key: 'risk', title: '风险' }],
                data: [{ store: '宁波天一店', risk: '高' }],
              },
              {
                id: 'action-form',
                type: 'FormBuilder',
                submitAction: 'submitForm',
                submitLabel: '提交整改计划',
                fields: [{ name: 'targetStore', label: '优先整改门店', type: 'select', options: ['宁波天一店'] }],
              },
            ],
          },
        ],
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.root).toMatchObject({ type: 'Column', children: ['trend-line', 'stores-table', 'action-form'] })
    expect(normalized.elements!['trend-line']).toMatchObject({
      type: 'LineChart',
      props: { x: 'day', y: ['conversion'], data: [{ day: 'D1', conversion: 24.1 }, { day: 'D2', conversion: 23.8 }] },
    })
    expect(normalized.elements!['stores-table']).toMatchObject({
      type: 'DataTable',
      props: { columns: [{ key: 'store', title: '门店', label: '门店' }, { key: 'risk', title: '风险', label: '风险' }] },
    })
    expect(normalized.elements!['action-form']).toMatchObject({
      type: 'FormBuilder',
      props: { submitLabel: '提交整改计划' },
      on: { submit: { action: 'submitForm' } },
    })
  })

  it('normalizes DataTable columns that use common name plus label objects', () => {
    const normalized = withDefaultElementProps({
      root: 'table',
      elements: {
        table: {
          type: 'DataTable',
          props: {
            columns: [
              { name: 'name', label: '门店' },
              { name: 'revenue', label: '收入 (元)' },
              { name: 'stockout', label: '缺货率 (%)' },
            ],
            data: [
              { name: '门店A', revenue: 1280000, stockout: 3 },
              { name: '门店B', revenue: 980000, stockout: 11 },
            ],
          },
        },
      },
    } as any)

    expect(normalized.elements!.table.props).toMatchObject({
      columns: [
        { name: 'name', key: 'name', label: '门店' },
        { name: 'revenue', key: 'revenue', label: '收入 (元)' },
        { name: 'stockout', key: 'stockout', label: '缺货率 (%)' },
      ],
    })
  })

  it('normalizes r9-style single series object rows from a real Codex cold start', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { type: 'surface.create', surfaceId: 'real-codex-r9', catalogId: 'vizual' },
      {
        type: 'surface.updateComponents',
        surfaceId: 'real-codex-r9',
        components: [
          { id: 'root', type: 'Root', props: { layout: 'Column', children: ['trend'] } },
          {
            id: 'trend',
            type: 'LineChart',
            props: {
              title: '近7日转化率趋势（诊断焦点）',
              xField: 'day',
              yField: 'conversion',
              yAxisLabel: '转化率(%)',
              series: [
                {
                  name: '转化率',
                  color: '#4F6BED',
                  data: [
                    { day: 'D1', conversion: 24.1 },
                    { day: 'D2', conversion: 23.8 },
                    { day: 'D3', conversion: 23.1 },
                  ],
                },
              ],
            },
          },
        ],
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.trend).toMatchObject({
      type: 'LineChart',
      props: {
        x: 'day',
        y: 'conversion',
        data: [
          { day: 'D1', conversion: 24.1 },
          { day: 'D2', conversion: 23.8 },
          { day: 'D3', conversion: 23.1 },
        ],
      },
    })

    const option = buildLineFallback(normalized.elements!.trend.props as any)
    expect(option.series).toEqual([
      expect.objectContaining({ name: 'conversion', data: [24.1, 23.8, 23.1] }),
    ])
  })

  it('fails validation when a chart references a field absent from all data rows', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'bad-chart', catalogId: 'vizual' },
      { type: 'surface.updateData', surfaceId: 'bad-chart', path: '/', value: { rows } },
      {
        type: 'surface.updateComponents',
        surfaceId: 'bad-chart',
        components: [
          { id: 'root', component: 'Column', children: ['line'] },
          { id: 'line', component: 'LineChart', dataPath: '/rows', xField: 'quarter', yField: 'missingMetric' },
        ],
      },
    ] as any)

    expect(result.ok).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'vizual.chart_missing_data_field',
        evidence: expect.objectContaining({ chartId: 'line', field: 'missingMetric' }),
      }),
    ]))
  })

  it('warns when a charted metric is all zero while sibling numeric fields are non-zero', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'zero-risk', catalogId: 'vizual' },
      {
        type: 'surface.updateData',
        surfaceId: 'zero-risk',
        path: '/',
        value: {
          rows: [
            { quarter: '2025Q3', value: 0, actualReturn: 23.7 },
            { quarter: '2025Q4', value: 0, actualReturn: 12.1 },
          ],
        },
      },
      {
        type: 'surface.updateComponents',
        surfaceId: 'zero-risk',
        components: [
          { id: 'root', component: 'Column', children: ['line'] },
          { id: 'line', component: 'LineChart', dataPath: '/rows', xField: 'quarter', yField: 'value' },
        ],
      },
    ] as any)

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: 'warning',
        code: 'vizual.chart_all_zero_numeric_field',
        evidence: expect.objectContaining({
          chartId: 'line',
          field: 'value',
          otherNumericFields: [{ field: 'actualReturn', sample: 23.7 }],
        }),
      }),
    ]))
  })

  it('does not warn for legitimate all-zero charts when no sibling numeric signal exists', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'legit-zero', catalogId: 'vizual' },
      {
        type: 'surface.updateData',
        surfaceId: 'legit-zero',
        path: '/',
        value: {
          rows: [
            { quarter: '2025Q3', value: 0 },
            { quarter: '2025Q4', value: 0 },
          ],
        },
      },
      {
        type: 'surface.updateComponents',
        surfaceId: 'legit-zero',
        components: [
          { id: 'root', component: 'Column', children: ['line'] },
          { id: 'line', component: 'LineChart', dataPath: '/rows', xField: 'quarter', yField: 'value' },
        ],
      },
    ] as any)

    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).not.toContain('vizual.chart_all_zero_numeric_field')
  })
})
