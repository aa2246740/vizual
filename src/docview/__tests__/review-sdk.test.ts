import { describe, expect, it } from 'vitest'
import {
  applySectionPatches,
  createRevisionProposal,
  createThreadFromAnnotation,
  getSectionId,
  threadToAnnotation,
} from '../review-sdk'
import type { Annotation } from '../types'

describe('DocView review SDK helpers', () => {
  it('prefers stable section ids and falls back to generated ids', () => {
    expect(getSectionId({ id: 'exec-summary', type: 'text', content: 'A' }, 2)).toBe('exec-summary')
    expect(getSectionId({ type: 'text', content: 'A' }, 2)).toBe('section-2')
  })

  it('applies section patches by section id', () => {
    const sections = [
      { id: 'intro', type: 'text', content: 'Old intro' },
      { id: 'risk', type: 'callout', content: 'Old risk', variant: 'warning' },
    ] as const

    const next = applySectionPatches([...sections], [
      { op: 'updateSection', sectionId: 'intro', updates: { content: 'New intro' } },
      { op: 'insertSection', afterSectionId: 'intro', section: { id: 'chart', type: 'chart', content: '', data: { chartType: 'BarChart' } } },
      { op: 'deleteSection', sectionId: 'risk' },
    ])

    expect(next.map(s => s.id)).toEqual(['intro', 'chart'])
    expect(next[0].content).toBe('New intro')
  })

  it('projects review threads back to legacy annotations', () => {
    const annotation: Annotation = {
      id: 'ann-1',
      text: 'Revenue',
      note: 'Explain this',
      color: '#fbbf24',
      status: 'draft',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      anchor: {
        sectionIndex: 0,
        sectionId: 'revenue',
        targetType: 'text',
        label: 'Revenue',
        textRange: { start: 0, end: 7, selectedText: 'Revenue' },
      },
    }

    const thread = createThreadFromAnnotation(annotation)
    const projected = threadToAnnotation({ ...thread, status: 'proposed' })

    expect(thread.anchor.sectionId).toBe('revenue')
    expect(thread.comments[0].body).toBe('Explain this')
    expect(projected.status).toBe('active')
    expect(projected.text).toBe('Revenue')
  })

  it('creates proposed revision payloads for agents', () => {
    const proposal = createRevisionProposal({
      fromThreadIds: ['thread-1'],
      summary: 'Clarify revenue decline',
      patches: [{ op: 'updateSection', sectionId: 'revenue', updates: { content: 'Revenue declined because churn rose.' } }],
    })

    expect(proposal.status).toBe('proposed')
    expect(proposal.fromThreadIds).toEqual(['thread-1'])
    expect(proposal.patches[0].op).toBe('updateSection')
  })
})
