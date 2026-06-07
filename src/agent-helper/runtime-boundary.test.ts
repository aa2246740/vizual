import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readRepoFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('Agent-autonomous runtime boundary', () => {
  it('keeps acceptance execution free of Host-side Vizual intent verdicts', () => {
    const daemon = readRepoFile('validation/daemon-acceptance-server.mjs')

    expect(daemon).not.toContain('shouldUseVizualUi')
    expect(daemon).not.toContain('requiresVizualUi')
    expect(daemon).not.toContain('本轮是否需要 Vizual UI')
    expect(daemon).not.toContain('本轮不需要 Vizual UI')
    expect(daemon).not.toContain('shortcut-no-cli')
    expect(daemon).not.toContain('intent coverage failed')
    expect(daemon).not.toContain('chart values repaired from user prompt')
    expect(daemon).toContain("boundary: 'agent-autonomous'")
  })

  it('keeps the Pi direct tool focused on payload contract, not user-message intent', () => {
    const directTool = readRepoFile('validation/pi-vizual-direct-tool.mjs')

    expect(directTool).not.toContain('VIZUAL_USER_MESSAGE')
    expect(directTool).not.toContain('requestWants')
    expect(directTool).not.toContain('isExplicitCreativeArtifactRequest')
    expect(directTool).not.toContain('explicit-creative-artifact')
    expect(directTool).not.toContain('User asked for')
    expect(directTool).toContain('Native chart component(s) have no data rows or data binding')
  })

  it('ignores partial streaming Vizual tool-call fragments when composing daemon transcripts', async () => {
    const { __daemonAcceptanceInternals } = await import('../../validation/daemon-acceptance-server.mjs')
    const input = {
      root: 'profitChart',
      elements: {
        profitChart: {
          component: 'BarChart',
          props: {
            title: '利润走势',
            data: [{ month: '6月', profit: 2300 }],
            x: 'month',
            y: 'profit',
          },
        },
      },
    }
    const raw = JSON.stringify({
      type: 'agent_end',
      messages: [
        {
          role: 'assistant',
          content: [
            {
              type: 'toolCall',
              name: 'present_vizual_ui',
              arguments: {
                display: { title: '半截输出' },
                input: '{"root":"profitChart","elements":{',
              },
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'toolCall',
              name: 'present_vizual_ui',
              arguments: {
                display: { title: '完整输出' },
                input: JSON.stringify(input),
              },
            },
          ],
        },
        {
          role: 'toolResult',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                toolCall: {
                  name: 'present_vizual_ui',
                  arguments: {
                    display: { title: '完整输出' },
                    input,
                    runtimeAudit: { inputMode: 'native', conversion: null },
                  },
                },
              }),
            },
          ],
        },
      ],
    })

    const parsed = __daemonAcceptanceInternals.parseAgentEventTranscript(raw)

    expect(parsed.toolCalls).toHaveLength(1)
    expect(parsed.toolCall.arguments.input.root).toBe('profitChart')
  })

  it('normalizes hyphenated direct spec component aliases before Pi tool execution', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: {
        root: 'root',
        elements: {
          root: { component: 'view', props: { children: ['trend', 'returns'] } },
          trend: {
            component: 'combo-chart',
            props: {
              data: [{ month: '6月', revenue: 16800, profit: 2300 }],
              x: 'month',
              series: [{ type: 'bar', y: 'revenue', name: '营收' }, { type: 'line', y: 'profit', name: '利润' }],
            },
          },
          returns: {
            component: 'bar-chart',
            props: {
              data: [{ channel: '拼多多', rate: 12.7 }],
              x: 'channel',
              y: 'rate',
            },
          },
        },
      },
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'native-shape',
    })
    expect(prepared.input.elements.root.component).toBe('View')
    expect(prepared.input.elements.trend.component).toBe('ComboChart')
    expect(prepared.input.elements.returns.component).toBe('BarChart')
  })

  it('normalizes Pi create_root operation compatibility without treating it as unknown input', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: [
        {
          op: 'create_root',
          elementId: 'insights',
          component: 'DataTable',
          props: {
            columns: [{ key: 'problem', label: 'Problem' }],
            data: [{ problem: 'Registration drop-off' }],
          },
        },
      ],
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'op-create-array',
    })
    expect(prepared.input.root).toBe('insights')
    expect(prepared.input.elements.insights.component).toBe('DataTable')
  })

  it('does not hide child components under a non-container create_root component', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: [
        {
          op: 'create_root',
          elementId: 'dashboard',
          component: 'KpiDashboard',
          props: { metrics: [{ label: 'Total Signups', value: '513' }] },
        },
        {
          op: 'create',
          elementId: 'funnel',
          parent: 'dashboard',
          component: 'ComboChart',
          props: {
            data: [{ day: 'Mon', signups: 82, trials: 31 }],
            x: 'day',
            y: ['signups', 'trials'],
            series: [
              { type: 'bar', y: 'signups', name: 'Signups' },
              { type: 'line', y: 'trials', name: 'Trials' },
            ],
          },
        },
      ],
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'op-create-array',
    })
    expect(prepared.input.root).toBe('root')
    expect(prepared.input.elements.root.children).toEqual(['dashboard', 'funnel'])
    expect(prepared.input.elements.dashboard.children).toEqual([])
    expect(prepared.input.elements.funnel.component).toBe('ComboChart')
  })

  it('normalizes Pi append elements compatibility into a rooted Vizual spec', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: [
        {
          op: 'append',
          path: 'page',
          elements: [
            { id: 'header', component: 'View', children: ['title'], props: {} },
            { id: 'title', component: 'Text', props: { text: 'Growth diagnosis' } },
            {
              id: 'trend',
              component: 'BarChart',
              props: {
                data: [{ label: 'Jan', value: 52 }],
                x: 'label',
                y: 'value',
              },
            },
          ],
        },
      ],
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'op-append-elements-array',
    })
    expect(prepared.input.root).toBe('root')
    expect(prepared.input.elements.root.children).toEqual(['header', 'trend'])
    expect(prepared.input.elements.trend.component).toBe('BarChart')
  })

  it('normalizes Pi createComponent operation arrays into a rooted Vizual spec', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: [
        {
          operation: 'createComponent',
          component: 'KpiDashboard',
          props: { metrics: [{ label: 'June users', value: '31万' }] },
        },
        {
          operation: 'createComponent',
          component: 'BarChart',
          props: {
            data: [{ label: 'Jan', value: 52 }],
            x: 'label',
            y: 'value',
          },
        },
      ],
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'operation-create-component-array',
    })
    expect(prepared.input.root).toBe('root')
    expect(prepared.input.elements.root.children).toEqual(['KpiDashboard', 'BarChart'])
    expect(prepared.input.elements.KpiDashboard.component).toBe('KpiDashboard')
  })

  it('normalizes Pi upsert value arrays into a rooted Vizual spec', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: [
        {
          op: 'upsert',
          path: '/dashboard',
          value: {
            component: 'KpiDashboard',
            props: { metrics: [{ label: 'Reports', value: 132, trend: 'up' }] },
          },
        },
        {
          op: 'upsert',
          path: '/diag',
          value: {
            component: 'DataTable',
            props: {
              columns: [{ key: 'risk', label: 'Risk' }],
              data: [{ risk: 'Report volume rose faster than retention' }],
            },
          },
        },
        {
          op: 'upsert',
          path: '/timeline',
          value: {
            component: 'ComboChart',
            props: {
              data: [{ day: 'D1', reports: '18', retention: '72%' }],
              x: 'day',
              series: [
                { type: 'bar', y: 'reports', name: 'Reports' },
                { type: 'line', y: 'retention', name: 'Retention', yAxisIndex: 1 },
              ],
            },
          },
        },
      ],
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'op-upsert-value-array',
    })
    expect(prepared.input.root).toBe('root')
    expect(prepared.input.elements.root.children).toEqual(['dashboard', 'diag', 'timeline'])
    expect(prepared.input.elements.dashboard.component).toBe('KpiDashboard')
    expect(prepared.input.elements.diag.component).toBe('DataTable')
    expect(prepared.input.elements.timeline.component).toBe('ComboChart')
    expect(prepared.input.elements.timeline.props.data[0]).toMatchObject({ reports: 18, retention: 72 })
  })

  it('normalizes stringified Pi upsert element arrays from concept explanation payloads', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: '[{"op":"upsert","id":"root","element":{"type":"VStack","gap":12,"children":["title","trace","tips"]}},{"op":"upsert","id":"title","element":{"type":"Text","text":"二分查找教学：low / high / mid 怎么动","size":"xl"}},{"op":"upsert","id":"trace","element":{"type":"DataTable","columns":[{"key":"step","label":"步骤"},{"key":"move","label":"边界怎么动"}],"rows":[{"step":1,"move":"target 更小，high = mid - 1"}]}},{"op":"upsert","id":"tips","element":{"type":"Markdown","text":"循环条件通常配合"找到立即返回"，不能混用。"}}]',
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'op-upsert-element-array',
    })
    expect(prepared.input.root).toBe('root')
    expect(prepared.input.elements.root.component).toBe('Column')
    expect(prepared.input.elements.root.children).toEqual(['title', 'trace', 'tips'])
    expect(prepared.input.elements.title).toMatchObject({
      component: 'Text',
      props: { text: '二分查找教学：low / high / mid 怎么动', size: 'xl' },
    })
    expect(prepared.input.elements.trace).toMatchObject({
      component: 'DataTable',
      props: {
        columns: [{ key: 'step', label: '步骤' }, { key: 'move', label: '边界怎么动' }],
        data: [{ step: 1, move: 'target 更小，high = mid - 1' }],
      },
    })
    expect(prepared.input.elements.tips).toMatchObject({
      component: 'Markdown',
      props: { content: '循环条件通常配合"找到立即返回"，不能混用。' },
    })
  })

  it('normalizes stringified Pi upsert value arrays', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: JSON.stringify([
        {
          op: 'upsert',
          path: '/timeline',
          value: {
            component: 'BarChart',
            props: {
              data: [{ label: 'A', value: '31' }],
              x: 'label',
              y: 'value',
            },
          },
        },
      ]),
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'op-upsert-value-array',
    })
    expect(prepared.input.root).toBe('timeline')
    expect(prepared.input.elements.timeline.component).toBe('BarChart')
    expect(prepared.input.elements.timeline.props.data[0].value).toBe(31)
  })

  it('absorbs semantic op-analysis payloads without inventing chart data', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: {
        type: 'op-analysis',
        summary: '结论：新政策触达引发认知缺口。',
        constraints: ['咨询量不是核心变量。'],
        charts: [{ type: 'line', x: 'Day', y: ['会话', '差评'], title: '关键指标趋势' }],
        priorityInsights: [
          {
            priority: '最高',
            issue: '新政策触达与差评增长耦合',
            reason: 'D4 开始加速，与政策触达跃升同步。',
            evidence: ['D4 差评 48', 'D4 新政策触达 42%'],
          },
        ],
        metricTrends: [
          { metric: '首响', trend: '持续恶化', min: 'D1', max: 'D8', units: 's' },
        ],
        analysis: [
          { type: '因果与相关', finding: '高度相关但不能直接说因果。', action: '验证知识库与话术。' },
        ],
      },
    })

    expect(prepared.runtimeAudit).toMatchObject({
      inputMode: 'native-normalized',
      conversion: 'semantic-op-analysis',
      catalogGaps: [
        {
          code: 'vizual.semantic_analysis_chart_missing_data',
        },
      ],
    })
    expect(prepared.input.root).toBe('root')
    expect(prepared.input.elements.root.children).toEqual(['summary', 'priority', 'metricTrends', 'analysis'])
    expect(prepared.input.elements.summary.component).toBe('Markdown')
    expect(prepared.input.elements.priority.component).toBe('DataTable')
    expect(prepared.input.elements.metricTrends.component).toBe('DataTable')
    expect(prepared.input.elements.analysis.component).toBe('DataTable')
    expect(Object.values(prepared.input.elements).some((element: any) => /Chart$/.test(element.component))).toBe(false)
  })

  it('does not silently accept unknown Vizual payloads', async () => {
    const { default: registerVizualDirectTool } = await import('../../validation/pi-vizual-direct-tool.mjs')
    let tool: any = null
    registerVizualDirectTool({
      registerTool(definition: any) {
        tool = definition
      },
    })

    const prepared = tool.prepareArguments({
      input: { type: 'opaque-analysis', summary: 'No render contract.' },
    })
    const result = await tool.execute('call-1', prepared)

    expect(prepared.runtimeAudit).toMatchObject({ inputMode: 'unknown' })
    expect(result.isError).toBe(true)
    expect(result.details.validationErrors).toContain('unknown input shape')
  })
})
