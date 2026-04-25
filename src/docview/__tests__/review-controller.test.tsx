import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { act, render } from '@testing-library/react'
import { DocView } from '../container'
import type { DocViewReviewActionEvent, DocViewReviewController } from '../types'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => v === '--rk-text-xs' ? '12' : `resolved-${v}`,
}))

describe('DocView Review SDK controller', () => {
  it('lets hosts create threads, submit them, and apply revision proposals', () => {
    let controller: DocViewReviewController | null = null
    const events: DocViewReviewActionEvent[] = []
    const nextSections: unknown[] = []

    render(
      <DocView
        sections={[
          { id: 'intro', type: 'text', content: 'Revenue is down.' },
        ]}
        controllerRef={(value) => { controller = value }}
        onReviewAction={(event) => events.push(event)}
        onSectionsChange={(sections) => nextSections.push(sections)}
      />,
    )

    expect(controller).toBeTruthy()

    let threadId = ''
    act(() => {
      const thread = controller!.createThread({
        body: 'Explain why revenue is down',
        anchor: {
          sectionIndex: 0,
          sectionId: 'intro',
          targetType: 'text',
          label: 'Revenue is down.',
          textRange: { start: 0, end: 16, selectedText: 'Revenue is down' },
        },
      })
      threadId = thread.id
    })

    expect(controller!.getThreads()).toHaveLength(1)
    expect(events.map(e => e.type)).toContain('threadCreated')

    act(() => {
      controller!.submitThreads([threadId])
    })

    expect(controller!.getThreads()[0].status).toBe('submitted')
    expect(events.map(e => e.type)).toContain('threadsSubmitted')

    let proposalId = ''
    act(() => {
      const proposal = controller!.createRevisionProposal({
        fromThreadIds: [threadId],
        summary: 'Add churn explanation',
        patches: [
          { op: 'updateSection', sectionId: 'intro', updates: { content: 'Revenue is down because churn rose.' } },
        ],
      })
      proposalId = proposal.id
    })

    expect(controller!.getThreads()[0].status).toBe('proposed')
    expect(controller!.getRevisionProposals()[0].status).toBe('proposed')

    act(() => {
      controller!.applyRevision(proposalId)
    })

    expect(controller!.getThreads()[0].status).toBe('resolved')
    expect(controller!.getRevisionProposals()[0].status).toBe('applied')
    expect(nextSections).toHaveLength(1)
    expect((nextSections[0] as Array<{ content: string }>)[0].content).toBe('Revenue is down because churn rose.')
    expect(events.map(e => e.type)).toContain('revisionApplied')
  })
})
