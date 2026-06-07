import { describe, expect, it, vi } from 'vitest'
import { VizualNativeCore } from './core'
import { VizualNativeStreamReader, createVizualNativeStreamReader } from './stream'

describe('VizualNativeStreamReader', () => {
  it('consumes JSONL A2UI surface updates incrementally', () => {
    const snapshots: string[] = []
    const core = new VizualNativeCore({
      onSurfaceChange(snapshot) {
        snapshots.push(`${snapshot.surfaceId}:${Object.keys(snapshot.spec.elements ?? {}).length}`)
      },
    })
    const reader = new VizualNativeStreamReader(core, { format: 'jsonl' })

    reader.write('{"version":"v0.10","createSurface":{"surfaceId":"stream-demo","catalogId":"vizual"}}\n')
    reader.write('{"version":"v0.10","updateDataModel":{"surfaceId":"stream-demo","path":"/","value":{"rows":[{"label":"A","value":10}]}}}\n')
    reader.write('{"version":"v0.10","updateComponents":{"surfaceId":"stream-demo","components":[{"id":"root","component":"Column","children":["chart"]},{"id":"chart","component":"BarChart","type":"bar","data":{"path":"/rows"},"x":"label","y":"value"}]}}\n')
    reader.write('{"version":"v0.10","appendDataModel":{"surfaceId":"stream-demo","path":"/rows","value":{"label":"B","value":20}}}\n')

    expect(core.getSurfaceIds()).toEqual(['stream-demo'])
    expect(core.getDataModel('stream-demo')?.rows).toEqual([
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ])
    expect(core.getSpec('stream-demo')?.elements?.chart?.props?.data).toEqual([
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ])
    expect(snapshots.length).toBeGreaterThanOrEqual(4)
  })

  it('consumes SSE AG-UI text and A2UI activity updates', () => {
    const onMessage = vi.fn()
    const core = new VizualNativeCore({ onMessage })
    const reader = new VizualNativeStreamReader(core, { format: 'sse' })

    reader.write('data: {"type":"TEXT_MESSAGE_START","messageId":"m1","role":"assistant"}\n\n')
    reader.write('data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m1","delta":"正在搭建"}\n\n')
    reader.write('data: {"type":"TEXT_MESSAGE_CHUNK","messageId":"m1","delta":"实时看板"}\n\n')
    reader.write('data: {"type":"TEXT_MESSAGE_END","messageId":"m1"}\n\n')
    reader.write(`event: a2ui\ndata: {"version":"v0.10","createSurface":{"surfaceId":"sse-demo","catalogId":"vizual"}}\n\n`)
    reader.write(`event: a2ui\ndata: {"version":"v0.10","updateComponents":{"surfaceId":"sse-demo","components":[{"id":"root","component":"Text","content":"流式组件已渲染"}]}}\n\n`)

    expect(core.getMessages()).toContainEqual(expect.objectContaining({
      id: 'm1',
      status: 'complete',
      content: '正在搭建实时看板',
    }))
    expect(core.getSpec('sse-demo')?.elements?.root?.props?.content).toBe('流式组件已渲染')
    expect(onMessage).toHaveBeenCalled()
  })

  it('waits for complete JSON lines before dispatching', () => {
    const core = new VizualNativeCore()
    const reader = new VizualNativeStreamReader(core, { format: 'jsonl' })

    reader.write('{"version":"v0.10","createSurface":{"surfaceId":"partial"')
    expect(core.getSurfaceIds()).toEqual([])
    reader.write(',"catalogId":"vizual"}}\n')

    expect(core.getSurfaceIds()).toEqual(['partial'])
  })

  it('flushes a final JSONL record on end and supports Uint8Array chunks', () => {
    const core = new VizualNativeCore()
    const reader = createVizualNativeStreamReader(core, { format: 'jsonl' })

    reader.write(new TextEncoder().encode('{"version":"v0.10","createSurface":{"surfaceId":"bytes","catalogId":"vizual"}}\n'))
    reader.write('{"version":"v0.10","updateComponents":{"surfaceId":"bytes","components":[{"id":"root","component":"Text","content":"final without newline"}]}}')
    expect(core.getSpec('bytes')?.elements?.root).toBeUndefined()

    const snapshots = reader.end()

    expect(snapshots).toHaveLength(1)
    expect(core.getSpec('bytes')?.elements?.root?.props?.content).toBe('final without newline')
  })

  it('flushes a final incomplete SSE block on end', () => {
    const core = new VizualNativeCore()
    const reader = createVizualNativeStreamReader(core, { format: 'sse' })

    reader.write('data: {"version":"v0.10","createSurface":{"surfaceId":"sse-final","catalogId":"vizual"}}')
    expect(core.getSurfaceIds()).toEqual([])

    const snapshots = reader.end()

    expect(snapshots).toHaveLength(1)
    expect(core.getSurfaceIds()).toEqual(['sse-final'])
  })

  it('drops incomplete buffered data on reset instead of dispatching stale chunks later', () => {
    const core = new VizualNativeCore()
    const reader = new VizualNativeStreamReader(core, { format: 'jsonl' })

    reader.write('{"version":"v0.10","createSurface":{"surfaceId":"stale"')
    reader.reset()
    reader.write('{"version":"v0.10","createSurface":{"surfaceId":"fresh","catalogId":"vizual"}}\n')

    expect(core.getSurfaceIds()).toEqual(['fresh'])
  })

  it('absorbs empty chunks, blank JSONL lines, SSE comments, and unfinished JSON without rendering prematurely', () => {
    const core = new VizualNativeCore()
    const jsonl = new VizualNativeStreamReader(core, { format: 'jsonl' })
    const sse = new VizualNativeStreamReader(core, { format: 'sse' })

    expect(jsonl.write('')).toEqual([])
    expect(jsonl.write('\n')).toEqual([])
    expect(jsonl.write('{"version":"v0.10"')).toEqual([])
    expect(sse.write(': keepalive\n\n')).toEqual([])
    expect(sse.write('event: noop\n\n')).toEqual([])

    expect(core.getSurfaceIds()).toEqual([])
    expect(core.getMessages()).toEqual([])
  })

  it('defaults auto format to JSONL when chunks are not SSE-shaped', () => {
    const core = new VizualNativeCore()
    const reader = new VizualNativeStreamReader(core)

    reader.write('{"version":"v0.10","createSurface":{"surfaceId":"auto-jsonl","catalogId":"vizual"}}\n')

    expect(core.getSurfaceIds()).toEqual(['auto-jsonl'])
  })

  it('normalizes OpenAI chat and Responses text deltas into AG-UI message chunks', () => {
    const core = new VizualNativeCore()
    const reader = new VizualNativeStreamReader(core, {
      format: 'sse',
      defaultMessageId: 'llm-stream',
    })

    reader.write('data: {"choices":[{"delta":{"content":"销量增长，"}}]}\n\n')
    reader.write('data: {"type":"response.output_text.delta","delta":"但利润下降"}\n\n')
    reader.write('data: {"type":"response.output_text.done"}\n\n')
    reader.write('data: [DONE]\n\n')

    expect(core.getMessages()).toContainEqual(expect.objectContaining({
      id: 'llm-stream',
      role: 'assistant',
      content: '销量增长，但利润下降',
      status: 'complete',
    }))
  })

  it('auto-detects SSE wrappers and completes Anthropic-style message_stop streams', () => {
    const core = new VizualNativeCore()
    const reader = new VizualNativeStreamReader(core, {
      defaultMessageId: 'auto-stream',
    })

    reader.write('event: message\ndata: {"data":"自动识别"}\n\n')
    reader.write('data: {"type":"message_stop"}\n\n')

    expect(core.getMessages()).toContainEqual(expect.objectContaining({
      id: 'auto-stream',
      role: 'assistant',
      content: '自动识别',
      status: 'complete',
    }))
  })

  it('emits record, input, and snapshot callbacks in dispatch order', () => {
    const core = new VizualNativeCore()
    const events: string[] = []
    const reader = new VizualNativeStreamReader(core, {
      format: 'jsonl',
      onRecord: record => events.push(`record:${record.format}`),
      onInput: input => events.push(`input:${typeof input === 'object' && input && 'version' in input ? 'a2ui' : 'other'}`),
      onSnapshot: snapshot => events.push(`snapshot:${snapshot.surfaceId}`),
    })

    reader.write('{"version":"v0.10","createSurface":{"surfaceId":"callbacks","catalogId":"vizual"}}\n')

    expect(events).toEqual(['record:jsonl', 'input:a2ui', 'snapshot:callbacks'])
  })
})
