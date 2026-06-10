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
        input: {
          title: { text: '团队能力 vs 行业标准' },
          tooltip: {},
          xAxis: { type: 'category', data: ['算法创新', '硬件品控'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [94, 70] }],
        },
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
