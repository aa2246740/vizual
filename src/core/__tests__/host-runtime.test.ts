import { describe, expect, it } from 'vitest'
import { createHostRuntime, createMemoryArtifactStore } from '../host-runtime'

describe('VizualHostRuntime', () => {
  const spec = {
    root: 'chart',
    elements: {
      chart: {
        type: 'BarChart',
        props: {
          type: 'bar',
          x: 'day',
          y: 'revenue',
          data: [
            { day: 'D1', region: '华东', revenue: 120 },
            { day: 'D2', region: '华北', revenue: 88 },
          ],
        },
        children: [],
      },
    },
  }

  it('saves, lists, and updates artifacts through a store', async () => {
    const events: string[] = []
    const runtime = createHostRuntime({
      store: createMemoryArtifactStore(),
      onEvent: event => events.push(event.type),
    })

    const artifact = await runtime.renderMessageArtifact({
      messageId: 'msg-1',
      conversationId: 'conv-1',
      prompt: 'show revenue',
      spec,
    })
    const updated = await runtime.updateArtifact(artifact.id, {
      type: 'changeChartType',
      targetId: 'element:chart',
      chartType: 'LineChart',
    })
    const listed = await runtime.listArtifacts({ conversationId: 'conv-1' })

    expect(artifact.source?.messageId).toBe('msg-1')
    expect(updated.spec.elements?.chart?.type).toBe('LineChart')
    expect(updated.versions).toHaveLength(1)
    expect(listed).toHaveLength(1)
    expect(events).toEqual(['artifactSaved', 'artifactUpdated'])
  })

  it('exports tabular artifact data as CSV and records metadata', async () => {
    const runtime = createHostRuntime()
    const artifact = await runtime.saveArtifact(spec)
    const result = await runtime.exportArtifact({
      ref: artifact.id,
      format: 'csv',
      filename: 'revenue',
    })

    expect(result.record.format).toBe('csv')
    expect(result.record.status).toBe('success')
    expect(result.artifact.exports).toHaveLength(1)
    expect(await result.blob.text()).toContain('华东')
  })
})
