import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { buildLineFallback } from '../../charts/line/component'
import { normalizeArtifact, type VizualSpec } from '../artifact'
import {
  VizualArtifactView,
  VizualRenderer,
  applyVizualStateChanges,
  getVizualStateValue,
} from '../react-renderer'
import { withDefaultElementProps } from '../spec-validation'
import { tcss } from '../theme-colors'

function makeControlsSpec(title: unknown = 'Controls'): VizualSpec {
  return {
    root: 'controls',
    state: {
      controls: {
        points: 4,
        mode: 'grouped',
      },
    },
    elements: {
      controls: {
        type: 'FormBuilder',
        props: {
          type: 'form_builder',
          title,
          submitLabel: 'Apply',
          value: { $bindState: '/controls' },
          fields: [
            { name: 'points', label: 'Points', type: 'slider', min: 3, max: 12 },
            { name: 'mode', label: 'Mode', type: 'select', options: ['grouped', 'stacked'] },
          ],
        },
        children: [],
      },
    },
  }
}

describe('VizualRenderer', () => {
  it('emits CSS variables with fallbacks for standalone pages without theme roots', () => {
    expect(tcss('--rk-accent')).toMatch(/^var\(--rk-accent, .+\)$/)
  })

  it('applies and extracts state changes by JSON pointer path', () => {
    const previous = {
      controls: { chartType: 'bar', points: 6 },
      other: { locked: true },
    }
    const changes = [
      { path: '/controls', value: { chartType: 'line', points: 10 } },
    ]

    expect(applyVizualStateChanges(previous, changes)).toEqual({
      controls: { chartType: 'line', points: 10 },
      other: { locked: true },
    })
    expect(getVizualStateValue(changes, '/controls', previous.controls)).toEqual({
      chartType: 'line',
      points: 10,
    })
  })

  it('wraps json-render with the required providers', async () => {
    const onStateChange = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { container } = render(
      <VizualRenderer
        spec={makeControlsSpec({
          $computed: 'panelTitle',
          args: { label: 'Live controls' },
        })}
        functions={{
          panelTitle: ({ label }) => `${label} panel`,
        }}
        onStateChange={onStateChange}
      />,
    )

    await waitFor(() => {
      expect(container.textContent).toContain('Live controls panel')
    })

    fireEvent.change(container.querySelector('input[type="range"]')!, {
      target: { value: '8' },
    })

    await waitFor(() => {
      expect(onStateChange).toHaveBeenLastCalledWith([
        { path: '/controls', value: { points: 8, mode: 'grouped' } },
      ])
    })

    expect(consoleError.mock.calls.flat().join('\n')).not.toContain('useVisibility')
    consoleError.mockRestore()
  })

  it('hydrates direct spec Button actions and FormBuilder submissions for host callbacks', async () => {
    const submitForm = vi.fn()
    const submitNextMonthPlan = vi.fn()
    const onStateChange = vi.fn()
    const directSpec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['planForm', 'followUp'] },
        planForm: {
          type: 'FormBuilder',
          props: {
            type: 'form_builder',
            submitLabel: 'Send plan',
            fields: [
              { name: 'owner', label: 'Owner', type: 'text' },
            ],
          },
        },
        followUp: {
          type: 'Button',
          props: {
            label: 'Continue analysis',
            action: 'submitNextMonthPlan',
            params: { symptom: 'bad_smell' },
          },
        },
      },
    }

    const hydrated = withDefaultElementProps(directSpec)
    expect(hydrated.elements!.planForm.props!.value).toEqual({ $bindState: '/_forms/planForm' })
    expect(hydrated.elements!.planForm.on).toEqual({
      submit: {
        action: 'submitForm',
        params: {
          formId: 'planForm',
          data: { $bindState: '/_forms/planForm' },
        },
      },
    })
    expect(hydrated.elements!.followUp.on).toEqual({
      submitNextMonthPlan: {
        action: 'submitNextMonthPlan',
        params: { symptom: 'bad_smell' },
      },
    })

    render(
      <VizualRenderer
        spec={directSpec}
        handlers={{ submitForm, submitNextMonthPlan }}
        onStateChange={onStateChange}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Owner' }), {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send plan' }))

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({
        formId: 'planForm',
        data: { owner: 'Ada' },
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continue analysis' }))

    await waitFor(() => {
      expect(submitNextMonthPlan).toHaveBeenCalledWith({ symptom: 'bad_smell' })
    })
    expect(onStateChange).toHaveBeenCalledWith([
      { path: '/_forms/planForm', value: { owner: 'Ada' } },
    ])
  })

  it('normalizes agent-style Gantt aliases into renderable task props', () => {
    const spec: VizualSpec = {
      root: 'plan',
      elements: {
        plan: {
          component: 'gantt',
          props: {
            title: '项目计划',
            data: [
              { key: 'contract', title: '供应商合同', startDate: '6月16日', duration: '7天', percent: '50%' },
              { key: 'delivery', title: '设备到货', begin: '6月28日', finish: '7月6日', dependsOn: 'contract' },
            ],
          },
        },
      },
    }

    const hydrated = withDefaultElementProps(spec)
    expect(hydrated.elements!.plan.type).toBe('GanttChart')
    expect(hydrated.elements!.plan.props).toMatchObject({
      type: 'gantt',
      tasks: [
        {
          id: 'contract',
          name: '供应商合同',
          start: '6月16日',
          duration: '7天',
          progress: '50%',
        },
        {
          id: 'delivery',
          name: '设备到货',
          start: '6月28日',
          end: '7月6日',
          dependencies: ['contract'],
        },
      ],
    })
  })

  it('hydrates natural clickable layout actions and forwards action params', async () => {
    const selectLocation = vi.fn()
    const directSpec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['option'] },
        option: {
          type: 'Column',
          props: {
            onClick: { action: 'selectLocation', location: 'overheat', label: '异常发热' },
            gap: 8,
          },
          children: ['label'],
        },
        label: { type: 'Text', props: { content: '发热故障' } },
      },
    }

    const hydrated = withDefaultElementProps(directSpec)
    expect(hydrated.elements!.option.props).toMatchObject({
      action: 'selectLocation',
      actionParams: { location: 'overheat', label: '异常发热' },
    })
    expect(hydrated.elements!.option.on).toEqual({
      selectLocation: {
        action: 'selectLocation',
        params: { location: 'overheat', label: '异常发热' },
      },
    })

    render(<VizualRenderer spec={directSpec} handlers={{ selectLocation }} />)

    fireEvent.click(screen.getByRole('button', { name: /发热故障/ }))

    await waitFor(() => {
      expect(selectLocation).toHaveBeenCalledWith({
        location: 'overheat',
        label: '异常发热',
      })
    })
  })

  it('forwards Card action params to host callbacks', async () => {
    const verifySunlight = vi.fn()
    const directSpec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['option'] },
        option: {
          type: 'Card',
          props: {
            padding: 16,
            action: 'verify_sunlight',
            actionParams: { result: 'confirm_sunlight' },
          },
          children: ['label'],
        },
        label: {
          type: 'Markdown',
          props: {
            content: '### ✅ 遮挡阳光后正常了\n遮住传感器后恢复正常',
          },
        },
      },
    }

    const hydrated = withDefaultElementProps(directSpec)
    expect(hydrated.elements!.option.on).toEqual({
      verify_sunlight: {
        action: 'verify_sunlight',
        params: { result: 'confirm_sunlight' },
      },
    })

    render(<VizualRenderer spec={directSpec} handlers={{ verify_sunlight: verifySunlight }} />)

    fireEvent.click(screen.getByRole('button', { name: /遮挡阳光后正常了/ }))

    await waitFor(() => {
      expect(verifySunlight).toHaveBeenCalledWith({ result: 'confirm_sunlight' })
    })
  })

  it('keeps custom FormBuilder submit actions instead of forcing submitForm', async () => {
    const submitBinarySearchConfig = vi.fn()
    const directSpec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['playground'] },
        playground: {
          type: 'FormBuilder',
          props: {
            submitLabel: '重新推演',
            action: { name: 'submitBinarySearchConfig', params: { concept: 'binary-search' } },
            fields: [
              { name: 'target', label: '目标值', type: 'number', defaultValue: 42 },
            ],
          },
        },
      },
    }

    const hydrated = withDefaultElementProps(directSpec)
    expect(hydrated.elements!.playground.on).toEqual({
      submit: {
        action: 'submitBinarySearchConfig',
        params: {
          formId: 'playground',
          data: { $bindState: '/_forms/playground' },
          concept: 'binary-search',
        },
      },
    })

    render(
      <VizualRenderer
        spec={directSpec}
        handlers={{ submitBinarySearchConfig }}
      />,
    )

    fireEvent.change(screen.getByRole('spinbutton', { name: '目标值' }), {
      target: { value: '55' },
    })
    fireEvent.click(screen.getByRole('button', { name: '重新推演' }))

    await waitFor(() => {
      expect(submitBinarySearchConfig).toHaveBeenCalledWith({
        formId: 'playground',
        data: { target: 55 },
        concept: 'binary-search',
      })
    })
  })

  it('normalizes agent FormBuilder fields without names before submit binding', async () => {
    const submitForm = vi.fn()
    const directSpec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['planForm'] },
        planForm: {
          type: 'FormBuilder',
          props: {
            type: 'form_builder',
            submitLabel: '提交整改计划',
            fields: [
              { label: '优先整改门店', type: 'select', options: ['B店'] },
              { id: 'actionPlan', label: '具体整改措施', type: 'textarea' },
            ],
          } as any,
        },
      },
    }

    const hydrated = withDefaultElementProps(directSpec)
    expect(hydrated.elements!.planForm.props!.fields).toMatchObject([
      { name: '优先整改门店', label: '优先整改门店', type: 'select' },
      { name: 'actionPlan', label: '具体整改措施', type: 'textarea' },
    ])

    render(<VizualRenderer spec={directSpec} handlers={{ submitForm }} />)

    fireEvent.change(screen.getByRole('textbox', { name: '具体整改措施' }), {
      target: { value: '48小时内补齐核心库存' },
    })
    fireEvent.click(screen.getByRole('button', { name: '提交整改计划' }))

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({
        formId: 'planForm',
        data: {
          优先整改门店: 'B店',
          actionPlan: '48小时内补齐核心库存',
        },
      })
    })
  })

  it('hydrates chart clicks into drillDown action bindings with selected point state', () => {
    const normalized = withDefaultElementProps({
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['trend'] },
        trend: {
          type: 'LineChart',
          props: {
            type: 'line',
            title: '门店趋势',
            x: 'date',
            y: 'revenue',
            data: [{ date: '06-01', revenue: 128000 }],
          },
        },
      },
    })

    expect(normalized.elements!.trend.props).toMatchObject({
      action: 'drillDown',
      selectedPoint: { $bindState: '/_charts/trend/selectedPoint' },
    })
    expect(normalized.elements!.trend.on).toEqual({
      drillDown: {
        action: 'drillDown',
        params: {
          chartId: 'trend',
          point: { $state: '/_charts/trend/selectedPoint' },
        },
      },
    })
    expect(normalized.state).toMatchObject({
      _charts: {
        trend: {
          selectedPoint: null,
        },
      },
    })
  })

  it('renders a normalized artifact directly', async () => {
    const artifact = normalizeArtifact(makeControlsSpec('Artifact controls'))
    const { container } = render(<VizualArtifactView artifact={artifact} />)

    await waitFor(() => {
      expect(container.textContent).toContain('Artifact controls')
    })
  })

  it('rejects cyclic children before rendering', () => {
    const cyclic: VizualSpec = {
      root: 'a',
      elements: {
        a: { type: 'Row', props: {}, children: ['b'] },
        b: { type: 'Column', props: {}, children: ['a'] },
      },
    }

    expect(() => render(<VizualRenderer spec={cyclic} />)).toThrow('cyclic children')
  })

  it('renders elements with omitted props without crashing json-render bindings', async () => {
    const spec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['text', 'form'] },
        text: { type: 'Text', props: { content: 'Props defaulted' }, children: [] },
        form: { type: 'FormBuilder', props: {}, children: [] },
      },
    }

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<VizualRenderer spec={spec} />)

    await waitFor(() => {
      expect(container.textContent).toContain('Props defaulted')
    })
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('binds native input primitives to json-render state', async () => {
    const onStateChange = vi.fn()
    const spec: VizualSpec = {
      root: 'root',
      state: {
        form: {
          owner: '经营分析组',
          priority: '中',
          budget: 150000,
          measures: ['控费专项'],
        },
      },
      elements: {
        root: { type: 'Column', props: { gap: 8 }, children: ['owner', 'priority', 'budget', 'measures'] },
        owner: { type: 'TextField', props: { label: '负责人', value: { $bindState: '/form/owner' } } },
        priority: { type: 'ChoicePicker', props: { label: '优先级', options: ['高', '中', '低'], value: { $bindState: '/form/priority' } } },
        budget: { type: 'Slider', props: { label: '预算', min: 0, max: 300000, step: 10000, value: { $bindState: '/form/budget' } } },
        measures: { type: 'CheckBox', props: { label: '动作清单', options: ['控费专项', '线上投放优化'], value: { $bindState: '/form/measures' } } },
      },
    }

    const { container } = render(<VizualRenderer spec={spec} onStateChange={onStateChange} />)
    const text = container.querySelector('input[type="text"]') as HTMLInputElement
    const select = container.querySelector('select') as HTMLSelectElement
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')

    fireEvent.change(text, { target: { value: 'Codex验收' } })
    fireEvent.change(select, { target: { value: '高' } })
    fireEvent.change(slider, { target: { value: '180000' } })
    fireEvent.click(checkboxes[1])

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith([{ path: '/form/owner', value: 'Codex验收' }])
      expect(onStateChange).toHaveBeenCalledWith([{ path: '/form/priority', value: '高' }])
      expect(onStateChange).toHaveBeenCalledWith([{ path: '/form/budget', value: 180000 }])
      expect(onStateChange).toHaveBeenCalledWith([{ path: '/form/measures', value: ['控费专项', '线上投放优化'] }])
    })
  })

  it('normalizes common cold-start agent prop aliases before rendering', async () => {
    const spec: VizualSpec = {
      root: 'dashboard',
      elements: {
        dashboard: { type: 'Column', props: { gap: 12 }, children: ['title', 'kpi', 'chart', 'pie', 'table'] },
        title: { type: 'Text', props: { text: 'Agent dashboard title', variant: 'section' }, children: [] },
        kpi: {
          type: 'KpiDashboard',
          props: {
            items: [
              { name: '累计新增用户', value: 2470 },
              { name: '累计营收', value: 201200 },
            ],
          },
          children: [],
        },
        chart: {
          type: 'ComboChart',
          props: {
            data: [
              { date: 'D1', revenue: 12000, churn: 20 },
              { date: 'D2', revenue: 13800, churn: 22 },
            ],
            xField: 'date',
            barField: 'revenue',
            lineField: 'churn',
          },
          children: [],
        },
        pie: {
          type: 'PieChart',
          props: {
            data: [
              { factor: '新增', value: 45 },
              { factor: '留存', value: 35 },
            ],
            nameField: 'factor',
            valueField: 'value',
          },
          children: [],
        },
        table: {
          type: 'DataTable',
          props: {
            columns: [
              { title: '日期', field: 'day' },
              { title: '收入', field: 'revenue' },
            ],
            rows: [
              ['D1', 12000],
              ['D2', 13800],
            ],
          },
          children: [],
        },
      },
    }

    const normalized = withDefaultElementProps(spec)
    expect(normalized.elements.dashboard.props).toMatchObject({
      gap: 12,
    })
    expect(normalized.elements.dashboard.children).toEqual(['title', 'kpi', 'chart', 'pie', 'table'])
    expect(normalized.elements.title.props).toMatchObject({ content: 'Agent dashboard title', variant: 'heading' })
    expect(normalized.elements.kpi.props).toMatchObject({
      type: 'kpi_dashboard',
      metrics: [
        { label: '累计新增用户', value: 2470 },
        { label: '累计营收', value: 201200 },
      ],
    })
    expect(normalized.elements.chart.props).toMatchObject({
      type: 'combo',
      x: 'date',
      y: ['revenue', 'churn'],
      series: [
        { type: 'bar', y: 'revenue' },
        { type: 'line', y: 'churn' },
      ],
    })
    expect(normalized.elements.pie.props).toMatchObject({
      type: 'pie',
      label: 'factor',
      value: 'value',
    })
    expect(normalized.elements.table.props).toMatchObject({
      type: 'table',
      columns: [
        { key: 'day', label: '日期' },
        { key: 'revenue', label: '收入' },
      ],
      data: [
        { day: 'D1', revenue: 12000 },
        { day: 'D2', revenue: 13800 },
      ],
    })

    const renderableSpec: VizualSpec = {
      root: 'dashboard',
      elements: {
        dashboard: { ...normalized.elements.dashboard, children: ['title', 'kpi', 'table'] },
        title: normalized.elements.title,
        kpi: normalized.elements.kpi,
        table: normalized.elements.table,
      },
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<VizualRenderer spec={renderableSpec} />)

    await waitFor(() => {
      expect(container.textContent).toContain('Agent dashboard title')
      expect(container.textContent).toContain('累计新增用户')
      expect(container.textContent).toContain('D1')
    })
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('normalizes common stack layout aliases before rendering', async () => {
    const spec: VizualSpec = {
      root: 'layout',
      elements: {
        layout: { type: 'VStack', props: { gap: 12 }, children: ['row'] },
        row: { type: 'HStack', props: { gap: 8 }, children: ['title'] },
        title: { type: 'Text', props: { text: 'Stack aliases render visibly' }, children: [] },
      },
    }

    const normalized = withDefaultElementProps(spec)
    expect(normalized.elements.layout.type).toBe('Column')
    expect(normalized.elements.row.type).toBe('Row')

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<VizualRenderer spec={normalized} />)

    await waitFor(() => {
      expect(container.textContent).toContain('Stack aliases render visibly')
    })
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('resolves cold-start agent state templates before component normalization', () => {
    const spec: VizualSpec = {
      root: 'root',
      state: {
        summary: {
          totalRevenue: 1282000,
          revenueWoW: -7.4,
          abnormalStores: 3,
        },
      },
      elements: {
        root: { type: 'Column', props: {}, children: ['summary', 'kpi'] },
        summary: {
          type: 'Text',
          props: { text: '总营收 {{summary.totalRevenue}} 元，异常门店 {{summary.abnormalStores}} 家。' },
          children: [],
        },
        kpi: {
          type: 'KpiDashboard',
          props: {
            metrics: [
              {
                label: '总营收',
                value: '{{summary.totalRevenue}}',
                suffix: '元',
                trend: 'down',
                trendValue: '{{summary.revenueWoW}}%',
              },
            ],
          },
          children: [],
        },
      },
    }

    const normalized = withDefaultElementProps(spec)
    expect(normalized.elements.summary.props.content).toBe('总营收 1282000 元，异常门店 3 家。')
    expect(normalized.elements.kpi.props.metrics).toMatchObject([
      { label: '总营收', value: 1282000, suffix: '元', trend: 'down', trendValue: '-7.4%' },
    ])
  })

  it('normalizes common A2UI control aliases before rendering', async () => {
    const spec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', props: {}, children: ['title', 'tabs', 'controls', 'button'] },
        title: { type: 'Text', props: { value: '增长诊断参数配置' }, children: [] },
        tabs: {
          type: 'Tabs',
          props: {
            items: [
              { key: 'scope', label: '诊断参数' },
              { key: 'impact', label: '口径影响' },
            ],
            activeKey: 'scope',
          },
          children: [],
        },
        controls: {
          type: 'FormBuilder',
          props: {
            fields: [{ name: 'budget', label: '预算', type: 'range', min: 0, max: 100 }],
          },
          children: [],
        },
        button: { type: 'Button', props: { text: '更新诊断口径', variant: 'default' }, children: [] },
      },
    }

    const normalized = withDefaultElementProps(spec)
    expect(normalized.elements.tabs.props).toMatchObject({
      tabs: [
        { key: 'scope', label: '诊断参数' },
        { key: 'impact', label: '口径影响' },
      ],
      activeTab: 'scope',
    })
    expect(normalized.elements.button.props).toMatchObject({ label: '更新诊断口径', variant: 'secondary' })
    expect(normalized.elements.title.props).toMatchObject({ content: '增长诊断参数配置' })
    expect(normalized.elements.controls.props.fields[0]).toMatchObject({ name: 'budget', type: 'slider' })

    const { container } = render(<VizualRenderer spec={spec} />)
    await waitFor(() => {
      expect(container.textContent).toContain('增长诊断参数配置')
      expect(container.textContent).toContain('诊断参数')
      expect(container.textContent).toContain('口径影响')
      expect(container.textContent).toContain('更新诊断口径')
    })
  })

  it('normalizes chart array series and xKey/yKey aliases before rendering', () => {
    const normalized = withDefaultElementProps({
      root: 'root',
      elements: {
        root: { type: 'Column', children: ['combo', 'bar'] },
        combo: {
          type: 'ComboChart',
          props: {
            x: ['去年同期', '上月', '本月'],
            series: [
              { name: '营收', type: 'bar', data: [980000, 1180000, 1280000] },
              { name: '利润', type: 'line', data: [390000, 475000, 520000] },
            ],
          },
        },
        bar: {
          type: 'BarChart',
          props: {
            xKey: 'name',
            yKey: 'revenue',
            data: [{ name: '直销', revenue: 520000 }],
          },
        },
      },
    })

    expect(normalized.elements!.combo.props).toMatchObject({
      x: 'label',
      y: ['营收', '利润'],
      data: [
        { label: '去年同期', '营收': 980000, '利润': 390000 },
        { label: '上月', '营收': 1180000, '利润': 475000 },
        { label: '本月', '营收': 1280000, '利润': 520000 },
      ],
      series: [{ type: 'bar', y: '营收' }, { type: 'line', y: '利润' }],
    })
    expect(normalized.elements!.bar.props).toMatchObject({ x: 'name', y: 'revenue' })
  })

  it('normalizes string series field names so wide time-series charts do not render as zero', () => {
    const rows = [
      { quarter: '2025Q3', '甲': 1.1688, '乙': 1.0828, '丙': 1.2146, '丁': 1.1861, '沪深300': 1.0087 },
      { quarter: '2025Q4', '甲': 1.2401, '乙': 1.1283, '丙': 1.2851, '丁': 1.2442, '沪深300': 1.043 },
    ]
    const normalized = withDefaultElementProps({
      root: 'chart',
      state: { navSeries: rows },
      elements: {
        chart: {
          type: 'LineChart',
          props: {
            title: '累计净值走势',
            data: { path: '/navSeries' },
            xField: 'quarter',
            series: ['甲', '乙', '丙', '丁', '沪深300'],
          },
        },
      },
    })

    expect(normalized.elements!.chart.props).toMatchObject({
      x: 'quarter',
      y: ['甲', '乙', '丙', '丁', '沪深300'],
    })

    const option = buildLineFallback({
      ...(normalized.elements!.chart.props as any),
      data: rows,
    })
    expect(option.series).toEqual([
      expect.objectContaining({ name: '甲', data: [1.1688, 1.2401] }),
      expect.objectContaining({ name: '乙', data: [1.0828, 1.1283] }),
      expect.objectContaining({ name: '丙', data: [1.2146, 1.2851] }),
      expect.objectContaining({ name: '丁', data: [1.1861, 1.2442] }),
      expect.objectContaining({ name: '沪深300', data: [1.0087, 1.043] }),
    ])
  })

  it('normalizes explicit agent grid hints, KPI items, and ComboChart yField series', () => {
    const normalized = withDefaultElementProps({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          props: { gap: 16 },
          children: ['kpi', 'trend', 'table'],
        },
        kpi: {
          type: 'KpiDashboard',
          props: {
            grid: { colSpan: 12 },
            items: [
              { label: '本月营收', value: 1280000, format: 'currencyCNY', delta: 8.47, deltaLabel: '较上月' },
              { label: '利润率', value: 40.63, format: 'percent', delta: 0.38, deltaLabel: '较上月' },
              { label: '营收同比', value: 0.3061, format: 'percent' },
              { label: '本月成本', value: 760000, delta: 0.078, deltaLabel: '环比' },
              { label: '利润率提升', value: 40.63, format: 'percent', delta: { value: 0.38, unit: 'pct' }, deltaLabel: '较上月' },
            ],
            columns: 4,
          },
        },
        trend: {
          type: 'ComboChart',
          props: {
            grid: { colSpan: 12 },
            data: [{ period: '2026-04', revenue: 1280000, cost: 760000 }],
            xField: 'period',
            series: [
              { type: 'bar', yField: 'revenue', name: '营收' },
              { type: 'line', yField: 'cost', name: '成本' },
            ],
          },
        },
        table: {
          type: 'DataTable',
          props: {
            grid: { colSpan: 12 },
            data: [{ channel: '直销', amount: 520000 }],
            columns: [{ key: 'channel', title: '渠道' }, { key: 'amount', title: '收入' }],
          },
        },
      },
    })

    expect(normalized.elements!.root.props).toMatchObject({
      gap: 16,
    })
    expect(normalized.elements!.kpi.props!.metrics).toMatchObject([
      { label: '本月营收', value: 1280000, suffix: '元', trend: 'up', trendValue: '较上月 8.47' },
      { label: '利润率', value: 40.63, suffix: '%', trend: 'up', trendValue: '较上月 0.38' },
      { label: '营收同比', value: 30.61, suffix: '%' },
      { label: '本月成本', value: 760000, trend: 'up', trendValue: '环比 7.8%' },
      { label: '利润率提升', value: 40.63, suffix: '%', trend: 'up', trendValue: '较上月 0.38个百分点' },
    ])
    expect(normalized.elements!.trend.props).toMatchObject({
      x: 'period',
      y: ['revenue', 'cost'],
      series: [{ type: 'bar', y: 'revenue' }, { type: 'line', y: 'cost' }],
    })
    expect(normalized.elements!.table.props).toMatchObject({
      columns: [{ key: 'channel', label: '渠道' }, { key: 'amount', label: '收入' }],
    })
  })

  it('normalizes daemon agent dashboard props before rendering', async () => {
    const spec: VizualSpec = {
      root: 'root',
      elements: {
        root: { type: 'Column', props: {}, children: ['title', 'kpi', 'table', 'doc'] },
        title: { type: 'Card', props: { title: '华东增长与流失风险总览', subtitle: 'AI内容占比需要因果验证' }, children: [] },
        kpi: {
          type: 'KpiDashboard',
          props: {
            metrics: [
              { name: 'D10流失人数', value: 115, unit: '人', trend: 'up', change: '+18人' },
              { name: 'D10 AI内容占比', value: 62, unit: '%', trend: 'up' },
            ],
          },
          children: [],
        },
        table: {
          type: 'DataTable',
          props: {
            columns: [
              { key: '日期', title: '日期' },
              { key: '区域', title: '区域' },
              { key: '流失', title: '流失' },
              { key: 'AI内容占比', title: 'AI内容占比' },
            ],
            data: [['D10', '华东', 115, '62%']],
          },
          children: [],
        },
        doc: {
          type: 'Markdown',
          props: {
            content: [
              '增长诊断的审阅摘要不能空白。',
              '## 一、业务结论',
              '华东流失风险上升。',
              '## 二、验证边界',
              'AI内容占比不能直接下因果结论。',
            ].join('\n\n'),
          },
          children: [],
        },
      },
    }

    const normalized = withDefaultElementProps(spec)
    expect(normalized.elements.kpi.props.metrics).toMatchObject([
      { label: 'D10流失人数', value: 115, suffix: '人', trendValue: '+18人' },
      { label: 'D10 AI内容占比', value: 62, suffix: '%' },
    ])
    expect(normalized.elements.table.props).toMatchObject({
      columns: [
        { key: '日期', label: '日期' },
        { key: '区域', label: '区域' },
        { key: '流失', label: '流失' },
        { key: 'AI内容占比', label: 'AI内容占比' },
      ],
      data: [{ 日期: 'D10', 区域: '华东', 流失: 115, AI内容占比: '62%' }],
    })
    expect(normalized.elements.doc.props.content).toContain('增长诊断的审阅摘要')
    expect(normalized.elements.doc.props.content).toContain('华东流失风险上升')

    const { container } = render(<VizualRenderer spec={spec} />)
    await waitFor(() => {
      expect(container.textContent).toContain('华东增长与流失风险总览')
      expect(container.textContent).toContain('D10流失人数')
      expect(container.textContent).toContain('华东')
      expect(container.textContent).toContain('增长诊断的审阅摘要')
      expect(container.textContent).toContain('AI内容占比不能直接下因果结论')
    })
  })
})
