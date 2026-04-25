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

  it('applies revision content internally when no host section state is provided', () => {
    let controller: DocViewReviewController | null = null
    const { queryByText, getByText } = render(
      <DocView
        showPanel={false}
        sections={[
          { id: 'intro', type: 'text', content: 'Revenue is down.' },
        ]}
        controllerRef={(value) => { controller = value }}
      />,
    )

    let threadId = ''
    act(() => {
      threadId = controller!.createThread({
        body: 'Explain why revenue is down',
        anchor: {
          sectionIndex: 0,
          sectionId: 'intro',
          targetType: 'text',
          label: 'Revenue is down.',
          textRange: { start: 0, end: 16, selectedText: 'Revenue is down' },
        },
      }).id
      controller!.submitThreads([threadId])
      const proposal = controller!.createRevisionProposal({
        fromThreadIds: [threadId],
        summary: 'Add churn explanation',
        patches: [
          { op: 'updateSection', sectionId: 'intro', updates: { content: 'Revenue is down because churn rose.' } },
        ],
      })
      controller!.applyRevision(proposal.id)
    })

    expect(queryByText('Revenue is down.')).toBeNull()
    expect(getByText('Revenue is down because churn rose.')).toBeTruthy()
    expect(controller!.getThreads()[0].status).toBe('resolved')
  })

  it('does not mark a newly created text thread as orphaned before content changes', () => {
    let controller: DocViewReviewController | null = null
    render(
      <DocView
        showPanel={false}
        sections={[
          { id: 'next', type: 'markdown', content: '下一步行动：监控用户内容反馈 NPS。' },
        ]}
        controllerRef={(value) => { controller = value }}
      />,
    )

    act(() => {
      controller!.createThread({
        body: '写详细一点',
        anchor: {
          sectionIndex: 0,
          sectionId: 'next',
          targetType: 'markdown',
          label: '下一步行动',
          textRange: { start: 0, end: 5, selectedText: '下一步行动' },
        },
      })
    })

    expect(controller!.getThreads()[0].status).toBe('open')
  })

  it('allows explicitly resubmitting an orphaned thread for a new revision pass', () => {
    let controller: DocViewReviewController | null = null
    const events: DocViewReviewActionEvent[] = []
    render(
      <DocView
        showPanel={false}
        sections={[
          { id: 'next', type: 'markdown', content: '下一步行动：监控用户内容反馈 NPS。' },
        ]}
        controllerRef={(value) => { controller = value }}
        onReviewAction={(event) => events.push(event)}
      />,
    )

    let threadId = ''
    act(() => {
      threadId = controller!.createThread({
        body: '写详细一点',
        anchor: {
          sectionIndex: 0,
          sectionId: 'next',
          targetType: 'markdown',
          label: '下一步行动',
          textRange: { start: 0, end: 5, selectedText: '下一步行动' },
        },
      }).id
      controller!.updateThreadStatus(threadId, 'orphaned')
      controller!.submitThreads([threadId])
    })

    expect(controller!.getThreads()[0].status).toBe('submitted')
    expect(events.map(e => e.type)).toContain('threadsSubmitted')
  })
})
