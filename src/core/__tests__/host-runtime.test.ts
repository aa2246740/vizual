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
    expect(result.record.meta?.rowCount).toBe(2)
    expect(await result.blob.text()).toContain('华东')
  })

  it('exports DocView table section data instead of an empty file', async () => {
    const runtime = createHostRuntime()
    const artifact = await runtime.saveArtifact({
      root: 'doc',
      elements: {
        doc: {
          type: 'DocView',
          props: {
            title: '风险报告',
            sections: [
              { id: 'summary', type: 'text', content: '摘要' },
              {
                id: 'branch-table',
                type: 'table',
                content: '',
                data: {
                  columns: ['Branch', 'Risk score', 'Open items'],
                  rows: [
                    ['Wuhan', 82, 6],
                    ['Hangzhou', 71, 5],
                  ],
                },
              },
            ],
          },
          children: [],
        },
      },
    })

    const result = await runtime.exportArtifact({
      ref: artifact.id,
      format: 'csv',
      filename: 'docview-risk',
    })

    const text = await result.blob.text()
    expect(result.record.status).toBe('success')
    expect(result.record.meta?.rowCount).toBe(2)
    expect(text).toContain('Branch,Risk score,Open items')
    expect(text).toContain('Wuhan,82,6')
  })

  it('records a data export error when no tabular rows are available', async () => {
    const runtime = createHostRuntime()
    const artifact = await runtime.saveArtifact({
      root: 'title',
      elements: {
        title: {
          type: 'DocView',
          props: {
            sections: [{ id: 'summary', type: 'text', content: '无表格数据' }],
          },
          children: [],
        },
      },
    })

    await expect(runtime.exportArtifact({
      ref: artifact.id,
      format: 'csv',
      filename: 'empty',
    })).rejects.toMatchObject({
      record: { status: 'error', format: 'csv' },
    })

    const updated = await runtime.getArtifact(artifact.id)
    expect(updated?.exports[0]?.error).toContain('No tabular data available')
  })

  it('records failed export attempts for artifact auditability', async () => {
    const runtime = createHostRuntime()
    const artifact = await runtime.saveArtifact(spec)

    await expect(runtime.exportArtifact({
      ref: artifact.id,
      format: 'pdf',
      filename: 'needs-element',
    })).rejects.toMatchObject({
      record: { status: 'error', format: 'pdf' },
    })

    const updated = await runtime.getArtifact(artifact.id)
    expect(updated?.exports[0]).toMatchObject({
      status: 'error',
      format: 'pdf',
      filename: 'needs-element',
    })
  })
})
