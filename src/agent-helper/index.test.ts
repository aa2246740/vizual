import { describe, expect, it } from 'vitest'
import {
  assertVizualAgentToolCoverage,
  createVizualAgentEnvelope,
  createVizualAgentToolDefinition,
  inferVizualAgentUserIntent,
  isVizualAgentEnvelope,
  renderVizualAgentInput,
  vizualEnvelopeToMcpEmbeddedResource,
  vizualPreviewToMcpEmbeddedResource,
  VIZUAL_AGENT_ENVELOPE_MIME,
  VIZUAL_AGENT_TOOL_NAME,
} from './index'
import { createVizualCatalogManifest } from '../catalog-manifest'
import {
  normalizeVizualNativeInput,
  previewVizualNativeInput,
  validateVizualNativeInput,
} from '../native-core'

const revenueDashboardInput = [
  { version: 'v0.10', createSurface: { surfaceId: 'agent-demo', catalogId: 'vizual' } },
  {
    version: 'v0.10',
    updateDataModel: {
      surfaceId: 'agent-demo',
      path: '/',
      value: {
        rows: [
          { month: 'Jan', revenue: 120 },
          { month: 'Feb', revenue: 160 },
        ],
      },
    },
  },
  {
    version: 'v0.10',
    updateComponents: {
      surfaceId: 'agent-demo',
      components: [
        { id: 'root', component: 'Column', children: ['chart', 'table'] },
        { id: 'chart', component: 'BarChart', data: { path: '/rows' }, x: 'month', y: 'revenue', title: 'Revenue' },
        {
          id: 'table',
          component: 'Table',
          data: { path: '/rows' },
          columns: [
            { key: 'month', label: 'Month' },
            { key: 'revenue', label: 'Revenue' },
          ],
        },
      ],
    },
  },
] as any

describe('Vizual agent runtime harness', () => {
  it('normalizes agent-native input into a surface, artifact, and operation log', () => {
    const result = normalizeVizualNativeInput(revenueDashboardInput)

    expect(result.ok).toBe(true)
    expect(result.surfaceId).toBe('agent-demo')
    expect(result.snapshot!.spec.elements!.chart.type).toBe('BarChart')
    expect(result.snapshot!.artifact.metadata).toMatchObject({ runtime: 'vizual-native-core' })
    expect(result.nativeOperationLog.map(operation => operation.type)).toEqual([
      'surface.create',
      'surface.updateData',
      'surface.updateComponents',
    ])
  })

  it('validates visible renderability and reports missing-surface errors', () => {
    const result = validateVizualNativeInput({
      type: 'surface.updateComponents',
      surfaceId: 'missing',
      components: [{ id: 'root', component: 'Text', text: 'orphan' }],
    } as any)

    expect(result.ok).toBe(false)
    expect(result.issues.map(issue => issue.code)).toContain('native.update')
    expect(result.issues.map(issue => issue.code)).toContain('vizual.no_renderable_surface')
  })

  it('previews normalized specs with component summaries for host renderers', () => {
    const result = previewVizualNativeInput(revenueDashboardInput, {
      fallbackText: 'Revenue dashboard is ready.',
    })

    expect(result.ok).toBe(true)
    expect(result.fallbackText).toBe('Revenue dashboard is ready.')
    expect(result.summary.componentTypes).toEqual(['Column', 'BarChart', 'DataTable'])
    expect(result.artifact!.id).toBe('vizual-surface-agent-demo')
  })

  it('defines a stable tool-call envelope that chat products can render natively', () => {
    const tool = createVizualAgentToolDefinition()
    const envelope = createVizualAgentEnvelope(revenueDashboardInput, {
      surfaceId: 'agent-demo',
      fallbackText: 'Revenue dashboard is ready.',
      display: { mode: 'inline', persist: true },
    })
    const renderResult = renderVizualAgentInput(envelope.input, {
      fallbackText: envelope.fallbackText,
      display: envelope.display,
    })

    expect(tool.name).toBe(VIZUAL_AGENT_TOOL_NAME)
    expect(tool.inputSchema.required).toEqual(['input'])
    expect(tool.catalog).toMatchObject({
      schema: 'vizual.catalog.manifest.v1',
      catalogId: 'vizual',
      catalogVersion: 'v1',
    })
    expect((tool.inputSchema.$defs as Record<string, unknown>).vizualSpec).toBeTruthy()
    const defs = tool.inputSchema.$defs as Record<string, any>
    expect(defs.nativeComponent.properties.component.enum).toContain('KpiDashboard')
    expect(defs.nativeComponent.properties.component.enum).toContain('ComboChart')
    expect(defs.nativeComponent.properties.component.enum).not.toContain('GridLayout')
    expect(defs.nativeComponent.properties.component.enum).not.toContain('SplitLayout')
    expect(defs.nativeComponent.properties.component.enum).not.toContain('HeroLayout')
    expect(defs.vizualSpec.properties.elements.additionalProperties.properties.component.enum).toContain('DataTable')
    expect(defs.vizualSpec.properties.elements.additionalProperties.properties.componentType.enum).toContain('FormBuilder')
    expect(tool.description).toContain('when you decide the current answer would be clearer')
    expect(tool.description).toContain('explicit creative requests such as webpages/games/custom HTML/code artifacts')
    expect(tool.description).toContain('business-dashboard: KpiDashboard')
    expect(tool.description).toContain('mixed-or-dual-axis-chart: ComboChart')
    expect(tool.description).toContain('discovery hints, not creative gates or mandatory component bundles')
    expect(tool.description).toContain('DataTable may support details')
    expect(tool.description).not.toContain('Invocation contract')
    expect(tool.description).not.toContain('must use KpiDashboard')
    expect(tool.description).toContain('Do not invent dates, years, YoY')
    expect(tool.description).toContain('Do not invent regulatory thresholds')
    expect(tool.description).toContain('Forbidden unless present in the source data')
    expect(tool.description).toContain('host QA report may flag UI input')
    expect(tool.description).toContain('Charts are hydrated with real drillDown actions')
    expect(tool.description).toContain('Do not claim validation passed or failed')
    expect(tool.description).toContain('never infer the current year')
    expect(tool.description).toContain('Page-level layout widgets are not native core components')
    expect(isVizualAgentEnvelope(envelope)).toBe(true)
    expect(envelope.mimeType).toBe(VIZUAL_AGENT_ENVELOPE_MIME)
    expect(renderResult.ok).toBe(true)
    expect(vizualEnvelopeToMcpEmbeddedResource(envelope).resource.mimeType).toBe(VIZUAL_AGENT_ENVELOPE_MIME)
    expect(vizualPreviewToMcpEmbeddedResource(renderResult.preview).resource.uri).toBe('vizual://preview/agent-demo')
  })

  it('reports user intent coverage gaps as QA guidance against actual rendered components', () => {
    const chartOnly = [
      { version: 'v0.10', createSurface: { surfaceId: 'bank-dashboard', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'bank-dashboard',
          components: [
            { id: 'root', component: 'Column', children: ['chart'] },
            {
              id: 'chart',
              component: 'ComboChart',
              title: '月度趋势',
              data: [
                { month: '1月', amount: 215, risk: 1.21 },
                { month: '2月', amount: 228, risk: 1.23 },
              ],
              x: 'month',
              series: [
                { name: '消费金额', type: 'bar', y: 'amount' },
                { name: '不良率', type: 'line', y: 'risk', yAxisIndex: 1 },
              ],
            },
          ],
        },
      },
    ] as any
    const preview = previewVizualNativeInput(chartOnly)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请做一个全国信用卡经营驾驶舱，要 KPI 看板、图表布局、风险提示。',
      input: chartOnly,
      preview,
    })

    expect(inferVizualAgentUserIntent('请输出 Dashboard 和 KPI 看板').wantsKpi).toBe(true)
    expect(preview.ok).toBe(true)
    expect(coverage.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.missing_kpi')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.missing_kpi')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.missing_risk_surface')
    expect(coverage.componentTypes).toContain('ComboChart')
  })

  it('fails coverage when a chart-evidence request only returns an opaque action panel', () => {
    const input = {
      root: 'actions',
      elements: {
        actions: {
          type: 'ActionPanel',
          props: {
            title: '行动建议',
            items: [
              { label: '立即优化低价渠道', description: '退货率偏高', priority: 'high' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '分析利润下降原因，找出最值得关注的渠道和隐藏风险，并用图表证明你的结论。',
      input,
      preview,
    })

    expect(preview.ok).toBe(false)
    expect(coverage.ok).toBe(false)
    expect(coverage.issues.map(issue => issue.code)).toContain('vizual.unsupported_component')
    expect(coverage.issues.map(issue => issue.code)).toContain('vizual.agent.missing_chart')
  })

  it('reports QA guidance when an explicit HTML artifact request is forced into Vizual native', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          component: 'VerticalLayout',
          props: { gap: 24 },
          children: ['brand', 'cta'],
        },
        brand: { component: 'Text', props: { text: '慢时光咖啡' } },
        cta: { component: 'Button', props: { label: '探索菜单' } },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '帮我写一个极简咖啡店 landing page 的 HTML/CSS 单文件代码，第一屏有品牌名、主按钮和三张菜单卡片。',
      input,
      preview,
    })

    expect(coverage.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).toContain('vizual.agent.explicit_artifact_forced_native')
  })

  it('reports QA guidance when raw KPI input is dropped from the rendered preview', () => {
    const input = [
      {
        type: 'KpiDashboard',
        title: '全国信用卡经营驾驶舱',
        kpis: [{ label: '累计发卡量', value: '83万张' }],
      },
      {
        type: 'BarChart',
        title: '营销活动',
        data: [{ 活动: '开卡礼', 投入: 1800 }],
        x: '活动',
        y: '投入',
      },
    ] as any
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请做一个全国信用卡经营驾驶舱，要 KPI 看板、图表布局、风险提示。',
      input,
      preview: {
        ok: true,
        issues: [],
        summary: { componentTypes: ['BarChart'] },
        spec: {
          root: 'root',
          elements: {
            root: { type: 'BarChart', props: { data: [{ 活动: '开卡礼', 投入: 1800 }], x: '活动', y: '投入' } },
          },
        },
      } as any,
    })

    expect(coverage.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.missing_kpi')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.missing_kpi')
  })

  it('rejects unsupported years while reporting YoY claims as QA guidance', () => {
    const unsupportedBaselineInput = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            title: '全国信用卡经营驾驶舱 - 2024年上半年',
            metrics: [
              { label: '消费金额', value: '1,527亿', trendValue: '+18.2% YoY' },
              { label: '不良率', value: '1.42%', trendValue: '+0.21pp' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(unsupportedBaselineInput)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请基于1月到6月的信用卡经营数据做全国经营驾驶舱。',
      input: unsupportedBaselineInput,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.ok).toBe(false)
    expect(coverage.issues.map(issue => issue.code)).toContain('vizual.agent.unsupported_year')
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_baseline_comparison')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.unsupported_baseline_comparison')
  })

  it('treats compact half-year labels such as 2026H1 as supplied years', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            title: '2026H1 手机银行增长诊断',
            metrics: [
              { label: '6月新增用户', value: '31万' },
              { label: '注册总转化率', value: '7.3%' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '2026H1 手机银行新增用户：1月52万，6月31万。请分析增长失速原因。',
      input,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_year')
  })

  it('does not treat monetary values such as 1900万 as invented years', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'BarChart',
          props: {
            title: '月度利润趋势',
            data: [{ month: '8月', profit: 1900 }],
            x: 'month',
            y: 'profit',
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请基于1月到8月利润数据分析趋势。',
      input,
      preview,
      assistantText: '按趋势外推，8月利润约1900万。',
    })

    expect(preview.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_year')
  })

  it('allows conditional baseline suggestions when the agent explicitly asks for missing data first', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            title: '4 月信用卡消费聚焦视图',
            metrics: [
              { label: '4 月消费金额', value: '258', suffix: '亿元' },
              { label: '聚焦月份', value: '4月' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: 'Vizual 交互数据：{"action":"drillDown","params":{"point":{"name":"4月","value":258}}}',
      input,
      preview,
      assistantText: '已聚焦 4 月 = 258 亿元。请提供相邻月份（3 月、去年 4 月）数据，我再加 MoM/YoY 趋势；当前不虚构同期对比。',
    })

    expect(preview.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_baseline_comparison')
    expect(coverage.qaGuidance.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_baseline_comparison')
  })

  it('reports external benchmarks or warning lines as QA guidance when not supplied by the user', () => {
    const unsupportedBenchmarkInput = {
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          children: ['risk', 'chart'],
        },
        risk: {
          type: 'Markdown',
          props: {
            content: '不良率从 1.21% 升至 1.42%，距监管预警线 1.5% 仅剩 8bp。',
          },
        },
        chart: {
          type: 'LineChart',
          props: {
            title: '不良率趋势与预警线',
            x: '月份',
            y: '不良率',
            data: [
              { 月份: '1月', 不良率: 1.21 },
              { 月份: '6月', 不良率: 1.42 },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(unsupportedBenchmarkInput)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: [
        '月份\t发卡量\t活跃卡量\t消费金额(亿元)\t不良率',
        '1月\t12万\t380万\t215\t1.21',
        '6月\t18万\t430万\t305\t1.42',
        '请做全国信用卡经营驾驶舱，要风险提示。',
      ].join('\n'),
      input: unsupportedBenchmarkInput,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_external_benchmark')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.unsupported_external_benchmark')
  })

  it('checks assistant prose for invented thresholds, not only rendered UI text', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'LineChart',
          props: {
            title: '不良率趋势',
            x: '月份',
            y: '不良率',
            data: [
              { 月份: '1月', 不良率: 1.21 },
              { 月份: '6月', 不良率: 1.42 },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: [
        '月份\t发卡量\t活跃卡量\t消费金额(亿元)\t不良率',
        '1月\t12万\t380万\t215\t1.21',
        '6月\t18万\t430万\t305\t1.42',
        '请做全国信用卡经营驾驶舱，要风险提示。',
      ].join('\n'),
      input,
      preview,
      assistantText: '不良率已经接近监管预警线 1.5%，需要立即按红线管控。',
    })

    expect(preview.ok).toBe(true)
    expect(coverage.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_external_benchmark')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.unsupported_external_benchmark')
  })

  it('allows chart drill-down claims because charts hydrate real drillDown actions', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'BarChart',
          props: {
            title: '营销活动投入产出',
            x: '活动',
            y: '投入',
            data: [{ 活动: '推荐有礼', 投入: 900 }],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请做营销活动图表。',
      input,
      preview,
      assistantText: 'Dashboard 支持点击图表数据点进行下钻分析。',
    })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.root.props).toMatchObject({ action: 'drillDown' })
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.unsupported_interaction_claim')
  })

  it('rejects non-chart interaction claims when no real control or action exists', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'Markdown',
          props: {
            content: '营销活动只读摘要。',
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请做营销活动分析。',
      input,
      preview,
      assistantText: '支持点击按钮提交筛选条件并更新计划。',
    })

    expect(preview.ok).toBe(true)
    expect(coverage.ok).toBe(false)
    expect(coverage.issues.map(issue => issue.code)).toContain('vizual.agent.unsupported_interaction_claim')
  })

  it('catches missing risk surfaces without relying on removed layout widgets', () => {
    const layoutOnlyDashboard = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['kpi', 'chart'] },
        kpi: {
          type: 'KpiDashboard',
          props: {
            metrics: [{ label: '不良率', value: '1.42%' }],
          },
        },
        chart: {
          type: 'ComboChart',
          props: {
            x: 'month',
            data: [{ month: '6月', spending: 305, npl: 1.42 }],
            series: [
              { type: 'bar', y: 'spending' },
              { type: 'line', y: 'npl' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(layoutOnlyDashboard)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: '请做全国信用卡经营驾驶舱，要 KPI 看板、图表布局、数据分析、风险提示。',
      input: layoutOnlyDashboard,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(preview.summary.componentTypes).toContain('Column')
    expect(coverage.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.non_agent_facing_layout')
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.missing_risk_surface')
    expect(coverage.qaGuidance.map(issue => issue.code)).toContain('vizual.agent.missing_risk_surface')
  })

  it('rejects KPI values copied from the wrong source table field', () => {
    const swappedKpiInput = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            metrics: [
              { label: '累计发卡量', value: '430万' },
              { label: '活跃卡量', value: '430万' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(swappedKpiInput)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: [
        '月份\t发卡量\t活跃卡量\t消费金额(亿元)',
        '1月\t12万\t380万\t215',
        '2月\t11万\t385万\t228',
        '6月\t18万\t430万\t305',
        '请做全国信用卡经营驾驶舱，要 KPI 看板。',
      ].join('\n'),
      input: swappedKpiInput,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.ok).toBe(false)
    expect(coverage.issues.map(issue => issue.code)).toContain('vizual.agent.kpi_value_swapped_field')
  })

  it('allows KPI source field aggregates when the label requests cumulative metrics', () => {
    const aggregateKpiInput = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            metrics: [
              { label: '累计发卡量', value: '83万' },
              { label: '活跃卡量', value: '430万' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(aggregateKpiInput)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: [
        '月份\t发卡量\t活跃卡量\t消费金额(亿元)',
        '1月\t12万\t380万\t215',
        '2月\t11万\t385万\t228',
        '3月\t13万\t392万\t245',
        '4月\t14万\t401万\t258',
        '5月\t15万\t415万\t276',
        '6月\t18万\t430万\t305',
        '分行\t发卡量\t消费金额\t不良率',
        '深圳\t3.2万\t55亿\t0.81',
        '上海\t2.8万\t48亿\t0.92',
        '请做全国信用卡经营驾驶舱，要 KPI 看板。',
      ].join('\n'),
      input: aggregateKpiInput,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.kpi_value_swapped_field')
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.kpi_value_not_supported_by_source')
  })

  it('allows ratio KPI values derived from supplied numeric fields', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            metrics: [
              { label: '利润率', value: '37.5% -> 13.7%' },
              { label: '广告占营收比', value: '9.4% -> 20.2%' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: [
        '月份\t营收(万元)\t成本(万元)\t利润(万元)',
        '1月\t6400\t4000\t2400',
        '6月\t16800\t14500\t2300',
        '月份\t广告投入(万元)',
        '1月\t600',
        '6月\t3400',
      ].join('\n'),
      input,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.kpi_value_not_supported_by_source')
  })

  it('allows per-unit KPI values derived from two supplied fields in the same table', () => {
    const input = {
      root: 'root',
      elements: {
        root: {
          type: 'KpiDashboard',
          props: {
            metrics: [
              { label: '单位成本变化', value: '500→690元' },
            ],
          },
        },
      },
    } as any
    const preview = previewVizualNativeInput(input)
    const coverage = assertVizualAgentToolCoverage({
      userMessage: [
        '月份\t销量(万台)\t营收(万元)\t成本(万元)\t利润(万元)',
        '1月\t8\t6400\t4000\t2400',
        '6月\t21\t16800\t14500\t2300',
      ].join('\n'),
      input,
      preview,
    })

    expect(preview.ok).toBe(true)
    expect(coverage.issues.map(issue => issue.code)).not.toContain('vizual.agent.kpi_value_not_supported_by_source')
  })

  it('publishes a native catalog manifest from the runtime catalog instead of a hand-written list', () => {
    const manifest = createVizualCatalogManifest({ includeExamples: true })

    expect(manifest.catalogId).toBe('vizual')
    expect(Object.keys(manifest.components).length).toBeGreaterThanOrEqual(44)
    expect(manifest.components.HeroLayout).toBeUndefined()
    expect(manifest.components.GridLayout).toBeUndefined()
    expect(manifest.components.SplitLayout).toBeUndefined()
    expect(manifest.components.Button.propsSchema).toMatchObject({
      type: 'object',
      properties: {
        action: { type: 'string' },
      },
    })
    expect(manifest.components.Text.propsSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['content']),
    })
    expect(manifest.components.BarChart.propsSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['type', 'x', 'y', 'data']),
    })
    expect(manifest.capabilities.map(capability => capability.id)).toEqual(expect.arrayContaining([
      'business-dashboard',
      'mixed-or-dual-axis-chart',
      'structured-input-or-approval',
      'a2ui-basic-primitives',
    ]))
    expect(manifest.capabilities.find(capability => capability.id === 'business-dashboard')?.requiredComponents).toContain('KpiDashboard')
    expect(manifest.functions.submitForm.argsSchema).toMatchObject({
      type: 'object',
      properties: {
        data: { type: 'object' },
      },
    })
    expect(manifest.functions.drillDown).toBeTruthy()
    expect(manifest.examples?.[0]?.components).toContain('FormBuilder')
    expect(manifest.examples?.map(example => example.id)).toEqual(expect.arrayContaining([
      'credit-card-cockpit',
      'engineering-dual-axis-chart',
      'missing-data-intake',
    ]))

    const fullManifest = createVizualCatalogManifest({ includeCompatibilityComponents: true })
    expect(fullManifest.components.HeroLayout).toMatchObject({
      status: 'deprecated',
      agentFacing: false,
    })
    expect(fullManifest.components.GridLayout).toBeUndefined()
    expect(fullManifest.components.SplitLayout).toBeUndefined()
  })
})
