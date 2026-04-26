import { describe, expect, it } from 'vitest'
import { createAgentBridge, type InteractiveSnapshot } from '../agent-bridge'
import { normalizeArtifact, type VizualSpec } from '../artifact'

const spec: VizualSpec = {
  root: 'chart',
  elements: {
    chart: {
      type: 'BarChart',
      props: {
        type: 'bar',
        x: 'region',
        y: 'value',
        data: [
          { region: '华东', value: 120 },
          { region: '华北', value: 90 },
        ],
      },
      children: [],
    },
  },
}

describe('VizualAgentBridge', () => {
  it('stores artifacts by artifact id and message id', () => {
    const bridge = createAgentBridge({ now: () => '2026-04-26T00:00:00.000Z' })
    const artifact = normalizeArtifact(spec, { source: { messageId: 'msg-1' } })

    const saved = bridge.rememberArtifact('msg-1', artifact)

    expect(saved?.id).toBe(artifact.id)
    expect(bridge.getArtifact(artifact.id)?.id).toBe(artifact.id)
    expect(bridge.getArtifact('msg-1')?.id).toBe(artifact.id)
    expect(bridge.getLastArtifact()?.id).toBe(artifact.id)
    expect(bridge.getMessageIdForArtifactRef(artifact.id)).toBe('msg-1')
    expect(bridge.snapshot().messageArtifacts).toEqual({ 'msg-1': artifact.id })
    expect(bridge.snapshot().artifactHistory[0]).toMatchObject({
      kind: 'stored',
      artifactId: artifact.id,
      messageId: 'msg-1',
    })
  })

  it('updates artifacts with typed patches without guessing JSON paths', () => {
    const bridge = createAgentBridge()
    const artifact = normalizeArtifact(spec, { source: { messageId: 'msg-1' } })
    bridge.rememberArtifact('msg-1', artifact)

    const updated = bridge.updateArtifact(artifact.id, {
      type: 'changeChartType',
      targetId: 'element:chart',
      chartType: 'LineChart',
    })

    expect(updated?.spec.elements.chart.type).toBe('LineChart')
    expect(bridge.getArtifact('msg-1')?.spec.elements.chart.type).toBe('LineChart')
    expect(bridge.getMessageIdForArtifactRef(updated?.id)).toBe('msg-1')
  })

  it('records render history with pending-message context', () => {
    const bridge = createAgentBridge({
      now: () => '2026-04-26T00:00:00.000Z',
      getPendingMessage: () => ({ rawText: '画一个图' }),
    })

    bridge.recordRender('static', 'msg-1', { status: 'success', artifactId: 'artifact-1' })

    expect(bridge.snapshot().lastVizualRender).toMatchObject({
      kind: 'static',
      id: 'msg-1',
      status: 'success',
      artifactId: 'artifact-1',
      pendingMessage: { rawText: '画一个图' },
    })
  })

  it('resolves isolated interactive sessions by message id and artifact id', () => {
    const bridge = createAgentBridge()
    const artifactA = normalizeArtifact(spec, { source: { messageId: 'msg-a' } })
    const artifactB = normalizeArtifact(spec, { source: { messageId: 'msg-b' } })
    bridge.rememberArtifact('msg-a', artifactA)
    bridge.rememberArtifact('msg-b', artifactB)

    const snapshotA: InteractiveSnapshot = {
      id: 'msg-a',
      state: { controls: { brandColor: '#111111' } },
      artifact: artifactA,
      renderCount: 1,
      pending: false,
      lastPreviewSpec: spec,
      lastPreviewSummary: { elementCount: 1 },
      status: 'success',
      error: null,
    }
    const snapshotB: InteractiveSnapshot = {
      ...snapshotA,
      id: 'msg-b',
      state: { controls: { brandColor: '#ff6b35' } },
      artifact: artifactB,
    }

    bridge.registerInteractiveSession('msg-a', { getSnapshot: () => snapshotA })
    bridge.registerInteractiveSession('msg-b', { getSnapshot: () => snapshotB })
    bridge.recordRender('interactive', 'msg-a')
    bridge.recordRender('interactive', 'msg-b')

    expect(bridge.getInteractiveSnapshot('msg-a')?.state).toEqual(snapshotA.state)
    expect(bridge.getInteractiveSnapshot(artifactB.id)?.state).toEqual(snapshotB.state)
    expect(bridge.getInteractiveSnapshot('last')?.id).toBe('msg-b')
  })
})
