import { describe, expect, it } from 'vitest'
import {
  VIZUAL_AGENT_TOOL_NAME,
  createVizualAgentEnvelope,
  renderVizualAgentInput,
} from './index'
import {
  extractVizualPresentations,
  selectRenderableVizualPresentations,
  selectVisibleVizualPresentations,
  selectVizualFallbackTexts,
} from '../chat-adapter'

function assistantToolCall(id: string, args: unknown) {
  return {
    role: 'assistant',
    tool_calls: [
      {
        id,
        function: {
          name: VIZUAL_AGENT_TOOL_NAME,
          arguments: JSON.stringify(args),
        },
      },
    ],
  }
}

function toolResult(id: string, result: unknown) {
  return {
    role: 'tool',
    tool_call_id: id,
    content: JSON.stringify(result),
  }
}

describe('chat adapter renderability gate', () => {
  it('does not accept fake ok:true tool results when preview cannot render a native surface', () => {
    const messages = [
      assistantToolCall('call-1', {
        // Raw HTML cannot be faithfully mapped to a native surface, so a tool
        // result that claims ok:true must still be gated out.
        input: '<div class="dashboard"><canvas id="chart"></canvas></div>',
      }),
      toolResult('call-1', { ok: true }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: false,
      renderable: false,
    })
    expect(presentations[0].preview?.ok).toBe(false)
    expect(presentations[0].issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'vizual.opaque_dsl_input' }),
    ]))
    expect(selectRenderableVizualPresentations(presentations)).toEqual([])
    expect(selectVisibleVizualPresentations(presentations)).toEqual([])
  })

  it('gives the host one outcome directive per turn and a single fallback text', () => {
    const messages = [
      // renders
      assistantToolCall('ok-1', { input: { components: [{ type: 'BarChart', x: 'b', y: 'w', data: [{ b: 'A', w: 5 }] }] } }),
      toolResult('ok-1', { ok: true }),
      // fails but provides fallback text → fallback, not a broken card
      assistantToolCall('bad-1', { input: '<div>raw html</div>', fallbackText: '北京网点等待时间最长。' }),
      toolResult('bad-1', { ok: true }),
      // fails, no fallback → suppressed
      assistantToolCall('bad-2', { input: { components: [{ type: 'BarChart', x: 'b', y: 'w', data: [] }] } }),
      toolResult('bad-2', { ok: true }),
    ]

    const presentations = extractVizualPresentations(messages)
    const byId = Object.fromEntries(presentations.map(p => [p.toolCallId, p.outcome]))
    expect(byId['ok-1']).toBe('rendered')
    expect(byId['bad-1']).toBe('fallback')
    expect(byId['bad-2']).toBe('suppressed')
    expect(selectVisibleVizualPresentations(presentations)).toHaveLength(1)
    expect(selectVizualFallbackTexts(presentations)).toEqual(['北京网点等待时间最长。'])
  })

  it('accepts only results whose native preview is successful', () => {
    const result = renderVizualAgentInput({
      components: [
        {
          type: 'BarChart',
          title: '网点排队等待时间',
          data: [
            { branch: '东城', wait: 6 },
            { branch: '西城', wait: 18 },
          ],
          x: 'branch',
          y: 'wait',
        },
      ],
    })
    const messages = [
      assistantToolCall('call-2', {
        input: result.envelope.input,
        surfaceId: result.envelope.surfaceId,
      }),
      toolResult('call-2', {
        ok: true,
        envelope: result.envelope,
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: true,
      renderable: true,
    })
    expect(presentations[0].preview?.spec).toBeTruthy()
    expect(selectRenderableVizualPresentations(presentations)).toEqual([presentations[0]])
    expect(selectVisibleVizualPresentations(presentations)).toEqual([presentations[0]])
  })

  it('does not accept old vizual alias shells as renderable native input', () => {
    const result = {
      ok: true,
      envelope: {
        schema: 'vizual.agent.envelope.v1',
        mimeType: 'application/vnd.vizual.agent+json',
        nativeMimeType: 'application/vnd.vizual.native+json',
        toolName: VIZUAL_AGENT_TOOL_NAME,
        surfaceId: 'server-generated-id',
        fallbackText: '',
        display: { mode: 'inline' },
        input: {
          surfaceId: 'training-panel',
          fallbackText: '培训资源包',
          display: { mode: 'inline', title: '培训资源包' },
          vizual: {
            root: 'root',
            elements: {
              root: {
                type: 'Column',
                children: ['video'],
              },
              video: {
                type: 'Video',
                props: {
                  src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
                  controls: true,
                },
              },
            },
          },
        },
      },
    }
    const messages = [
      assistantToolCall('call-wrapper', { input: result.envelope.input }),
      toolResult('call-wrapper', result),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: false,
      renderable: false,
      fallbackText: '培训资源包',
      outcome: 'fallback',
    })
    expect(selectVisibleVizualPresentations(presentations)).toEqual([])
    expect(selectVizualFallbackTexts(presentations)).toEqual(['培训资源包'])
  })

  it('falls back to the original tool args when an ok result envelope dropped createSurface', () => {
    const argsInput = {
      version: 'v0.10',
      createSurface: { surfaceId: 'bank-branch-diagnosis' },
      operations: [
        {
          version: 'v0.10',
          updateComponents: {
            surfaceId: 'bank-branch-diagnosis',
            components: {
              root: {
                type: 'BarChart',
                props: {
                  data: [{ branch: '南山', score: 82 }],
                  x: 'branch',
                  y: 'score',
                },
              },
            },
          },
        },
      ],
    }
    const badResultInput = [
      ...argsInput.operations,
    ]
    const messages = [
      assistantToolCall('call-dropped-create', { input: JSON.stringify(argsInput) }),
      toolResult('call-dropped-create', {
        ok: true,
        surfaceId: 'bank-branch-diagnosis',
        envelope: {
          schema: 'vizual.agent.envelope.v1',
          mimeType: 'application/vnd.vizual.agent+json',
          nativeMimeType: 'application/vnd.vizual.native+json',
          toolName: VIZUAL_AGENT_TOOL_NAME,
          surfaceId: 'bank-branch-diagnosis',
          input: badResultInput,
        },
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: true,
      renderable: true,
      surfaceId: 'bank-branch-diagnosis',
    })
    expect(presentations[0].preview?.summary.componentTypes).toEqual(['BarChart'])
  })

  it('previews createSurface root/elements plus later child component updates as one renderable presentation', () => {
    const input = [
      {
        version: 'v0.10',
        createSurface: {
          id: 'branch-feedback-form',
          root: 'form-root',
          elements: {
            'form-root': {
              type: 'FormBuilder',
              props: {
                title: '网点服务问题反馈采集表',
                submitLabel: '提交反馈',
                children: ['field-branch', 'field-type'],
              },
            },
          },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          components: {
            'field-branch': {
              type: 'TextField',
              props: { label: '网点名称', required: true },
            },
            'field-type': {
              type: 'ChoicePicker',
              props: {
                label: '问题类型',
                options: ['柜面服务', '排队等候', '系统故障'],
              },
            },
          },
        },
      },
    ]
    const messages = [
      assistantToolCall('call-form', { input }),
      toolResult('call-form', {
        ok: true,
        envelope: {
          schema: 'vizual.agent.envelope.v1',
          mimeType: 'application/vnd.vizual.agent+json',
          nativeMimeType: 'application/vnd.vizual.native+json',
          toolName: VIZUAL_AGENT_TOOL_NAME,
          surfaceId: 'branch-feedback-form',
          input,
        },
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: true,
      renderable: true,
      surfaceId: 'branch-feedback-form',
    })
    expect(presentations[0].preview?.summary.componentTypes).toEqual([
      'Column',
      'FormBuilder',
      'TextField',
      'ChoicePicker',
    ])
    expect(presentations[0].preview?.spec?.elements?.['form-root'].props?.fields).toMatchObject([
      { name: 'field-branch', type: 'text', label: '网点名称', required: true },
      { name: 'field-type', type: 'select', label: '问题类型' },
    ])
  })

  it('accepts direct root/elements FormBuilder envelopes normalized by host adapters', () => {
    const input = {
      root: 'form-root',
      elements: {
        'form-root': {
          type: 'FormBuilder',
          props: {
            title: '网点服务问题反馈采集表',
            submitLabel: '提交反馈',
            children: ['field-branch', 'field-type'],
          },
          children: ['field-branch', 'field-type'],
        },
        'field-branch': {
          type: 'TextField',
          props: { label: '网点名称', required: true },
        },
        'field-type': {
          type: 'ChoicePicker',
          props: {
            label: '问题类型',
            options: ['柜面服务', '排队等候', '系统故障'],
          },
        },
      },
    }
    const messages = [
      assistantToolCall('call-direct-form', { input }),
      toolResult('call-direct-form', {
        ok: true,
        surfaceId: 'branch-feedback-form',
        envelope: {
          schema: 'vizual.agent.envelope.v1',
          mimeType: 'application/vnd.vizual.agent+json',
          nativeMimeType: 'application/vnd.vizual.native+json',
          toolName: VIZUAL_AGENT_TOOL_NAME,
          surfaceId: 'branch-feedback-form',
          input,
        },
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: true,
      renderable: true,
      surfaceId: 'branch-feedback-form',
    })
    expect(presentations[0].preview?.spec?.elements?.['form-root'].props?.fields).toMatchObject([
      { name: 'field-branch', type: 'text', label: '网点名称', required: true },
      { name: 'field-type', type: 'select', label: '问题类型' },
    ])
  })

  it('accepts long-form line charts with a string series grouping field', () => {
    const input = {
      root: 'dashboard',
      elements: {
        dashboard: {
          type: 'Column',
          children: ['trend'],
        },
        trend: {
          type: 'LineChart',
          props: {
            data: [
              { date: '2025-01', line: '个人助手-iOS', value: 45000 },
              { date: '2025-01', line: '企业Agent-Windows', value: 18000 },
              { date: '2025-02', line: '个人助手-iOS', value: 48000 },
              { date: '2025-02', line: '企业Agent-Windows', value: 21000 },
            ],
            x: 'date',
            y: 'value',
            series: 'line',
          },
        },
      },
    }
    const result = {
      ok: true,
      envelope: {
        schema: 'vizual.agent.envelope.v1',
        mimeType: 'application/vnd.vizual.agent+json',
        nativeMimeType: 'application/vnd.vizual.native+json',
        toolName: VIZUAL_AGENT_TOOL_NAME,
        surfaceId: 'jarvis-growth',
        input,
      },
    }
    const messages = [
      assistantToolCall('call-long-form-line', { input: JSON.stringify(input) }),
      toolResult('call-long-form-line', result),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: true,
      renderable: true,
      surfaceId: 'jarvis-growth',
      outcome: 'rendered',
    })
    expect(selectRenderableVizualPresentations(presentations)).toEqual([presentations[0]])
  })

  it('accepts typed encoding/measures charts through the chat adapter preview gate', () => {
    const input = {
      root: 'dashboard',
      elements: {
        dashboard: {
          type: 'Column',
          children: ['trend', 'combo'],
        },
        trend: {
          type: 'LineChart',
          props: {
            data: [
              { month: '2025-01', client: 'iOS', users: 45000 },
              { month: '2025-01', client: 'Android', users: 52000 },
              { month: '2025-02', client: 'iOS', users: 48000 },
              { month: '2025-02', client: 'Android', users: 55000 },
            ],
            encoding: {
              x: { field: 'month', type: 'temporal' },
              y: { field: 'users', type: 'quantitative' },
              color: { field: 'client', type: 'nominal' },
            },
          },
        },
        combo: {
          type: 'ComboChart',
          props: {
            data: [
              { month: '2025-01', apiCalls: 120, compute: 450 },
              { month: '2025-02', apiCalls: 140, compute: 520 },
            ],
            encoding: { x: 'month' },
            measures: [
              { field: 'apiCalls', label: 'API调用量', mark: 'bar', axis: 'left' },
              { field: 'compute', label: '算力消耗', mark: 'line', axis: 'right' },
            ],
          },
        },
      },
    }
    const messages = [
      assistantToolCall('call-encoding', { input }),
      toolResult('call-encoding', {
        ok: true,
        envelope: {
          schema: 'vizual.agent.envelope.v1',
          mimeType: 'application/vnd.vizual.agent+json',
          nativeMimeType: 'application/vnd.vizual.native+json',
          toolName: VIZUAL_AGENT_TOOL_NAME,
          surfaceId: 'typed-encoding',
          input,
        },
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: true,
      renderable: true,
      outcome: 'rendered',
      surfaceId: 'typed-encoding',
    })
    expect(presentations[0].preview?.spec?.elements?.trend.props).toMatchObject({
      x: 'month',
      y: ['iOS', 'Android'],
    })
  })

  it('keeps failed tool attempts hidden even when their input can preview', () => {
    const input = {
      components: [
        {
          type: 'DataTable',
          title: '失败尝试里的可渲染表格',
          data: [{ branch: '东城', value: 1 }],
        },
      ],
    }
    const messages = [
      assistantToolCall('call-failed', { input }),
      toolResult('call-failed', {
        ok: false,
        issues: [{ code: 'host.repair_requested', message: 'agent should retry' }],
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toMatchObject({
      accepted: false,
      renderable: true,
    })
    expect(presentations[0].preview?.ok).toBe(true)
    expect(selectRenderableVizualPresentations(presentations)).toEqual([])
  })

  it('also previews optimistic agent envelopes before exposing them as visible', () => {
    const envelope = createVizualAgentEnvelope('<section>not a native surface</section>' as any)
    const messages = [
      assistantToolCall('call-3', {
        envelope,
      }),
    ]

    const presentations = extractVizualPresentations(messages)

    expect(presentations).toHaveLength(1)
    expect(presentations[0].accepted).toBe(false)
    expect(presentations[0].preview?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'vizual.opaque_dsl_input' }),
    ]))
  })
})
