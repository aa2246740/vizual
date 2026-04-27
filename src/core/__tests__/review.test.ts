import { describe, expect, it } from 'vitest'
import { normalizeArtifact, type VizualSpec } from '../artifact'
import {
  addReviewComment,
  applyRevisionProposalToArtifact,
  createReviewThread,
  createRevisionProposal,
  updateReviewThreadStatus,
} from '../review'

const spec: VizualSpec = {
  root: 'chart',
  elements: {
    chart: {
      type: 'BarChart',
      props: {
        x: 'region',
        y: 'value',
        data: [{ region: '华东', value: 120 }],
      },
      children: [],
    },
  },
}

describe('Vizual generic review primitives', () => {
  it('creates target-aware review threads without depending on DocView', () => {
    const artifact = normalizeArtifact(spec)
    const thread = createReviewThread({
      artifactId: artifact.id,
      target: artifact.targetMap[0],
      body: '改成折线图，只看华东区',
      now: '2026-04-27T00:00:00.000Z',
    })

    expect(thread.artifactId).toBe(artifact.id)
    expect(thread.target.targetId).toBe('element:chart')
    expect(thread.comments[0]).toMatchObject({ body: '改成折线图，只看华东区', kind: 'request' })
  })

  it('tracks comments, proposals, and artifact patches as one review loop', () => {
    const artifact = normalizeArtifact(spec)
    const thread = createReviewThread({ artifactId: artifact.id, target: 'element:chart' })
    const commented = addReviewComment(thread, '换成折线图', { id: 'u1', role: 'user' })
    const submitted = updateReviewThreadStatus(commented.thread, 'submitted')
    const proposal = createRevisionProposal({
      artifactId: artifact.id,
      threadIds: [submitted.id],
      summary: '将柱状图改为折线图',
      patches: { type: 'changeChartType', targetId: 'element:chart', chartType: 'LineChart' },
    })

    const result = applyRevisionProposalToArtifact(artifact, proposal)

    expect(submitted.status).toBe('submitted')
    expect(proposal.status).toBe('proposed')
    expect(result.proposal.status).toBe('applied')
    expect(result.artifact.spec.elements?.chart?.type).toBe('LineChart')
  })
})
