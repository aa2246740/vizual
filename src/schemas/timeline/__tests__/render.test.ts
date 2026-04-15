import { describe, it, expect } from 'vitest'
import { parseTimelineSchema } from '../parser'
import { renderTimeline } from '../renderer'

const fourNodesFixture = {
  input: {
    nodes: [
      { id: 'n1', title: 'Phase 1: Planning', status: 'completed', startDate: '2024-01-01', endDate: '2024-01-15' },
      { id: 'n2', title: 'Phase 2: Design', status: 'completed', startDate: '2024-01-16', endDate: '2024-02-01' },
      { id: 'n3', title: 'Phase 3: Development', status: 'in-progress', startDate: '2024-02-02', endDate: '2024-04-01' },
      { id: 'n4', title: 'Phase 4: Launch', status: 'pending', startDate: '2024-04-02', endDate: '2024-04-15' },
    ],
  },
}

describe('Timeline — Render Tests', () => {
  it('renders correct number of nodes', () => {
    const parsed = parseTimelineSchema(fourNodesFixture.input)
    const container = renderTimeline(parsed)

    expect(container.querySelectorAll('[data-node]').length).toBe(4)
  })

  it('nodes are sorted by startDate', () => {
    const input = {
      nodes: [
        { id: 'n3', title: 'Third', status: 'pending' as const, startDate: '2024-03-01' },
        { id: 'n1', title: 'First', status: 'completed' as const, startDate: '2024-01-01' },
        { id: 'n2', title: 'Second', status: 'in-progress' as const, startDate: '2024-02-01' },
      ],
    }
    const parsed = parseTimelineSchema(input)
    const container = renderTimeline(parsed)

    const nodeIds = Array.from(container.querySelectorAll('[data-node]'))
      .map(el => el.getAttribute('data-node-id'))

    expect(nodeIds).toEqual(['n1', 'n2', 'n3'])
  })

  it('date range is displayed in node content', () => {
    const parsed = parseTimelineSchema(fourNodesFixture.input)
    const container = renderTimeline(parsed)

    const node1 = container.querySelector('[data-node-id="n1"]')
    expect(node1?.textContent).toContain('2024-01-01')
    expect(node1?.textContent).toContain('2024-01-15')
  })

  it('only startDate displayed when no endDate', () => {
    const input = {
      nodes: [
        { id: 'n1', title: 'Milestone', status: 'completed' as const, startDate: '2024-01-01' },
      ],
    }
    const parsed = parseTimelineSchema(input)
    const container = renderTimeline(parsed)

    const node = container.querySelector('[data-node-id="n1"]')
    expect(node?.textContent).toContain('2024-01-01')
    expect(node?.textContent).not.toContain('→')
  })
})

describe('Timeline — Status Color Tests', () => {
  const statusClassMap: Record<string, string> = {
    'completed': 'status-completed',
    'in-progress': 'status-in-progress',
    'pending': 'status-pending',
  }

  for (const [status, cls] of Object.entries(statusClassMap)) {
    it(`status=${status} has correct CSS class`, () => {
      const input = {
        nodes: [
          { id: `n-${status}`, title: `Node ${status}`, status },
        ],
      }
      const parsed = parseTimelineSchema(input)
      const container = renderTimeline(parsed)

      const node = container.querySelector(`[data-node-id="n-${status}"]`)
      expect(node?.classList.contains(cls)).toBe(true)
    })
  }

  it('data-status attribute matches status', () => {
    const input = {
      nodes: [
        { id: 'n1', title: 'Test', status: 'in-progress' },
      ],
    }
    const parsed = parseTimelineSchema(input)
    const container = renderTimeline(parsed)

    const node = container.querySelector('[data-node-id="n1"]')
    expect(node?.getAttribute('data-status')).toBe('in-progress')
  })
})

describe('Timeline — Fallback Tests', () => {
  it('empty nodes array shows fallback', () => {
    const parsed = parseTimelineSchema({ nodes: [] })
    const container = renderTimeline(parsed)

    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('invalid status value treated as pending', () => {
    const parsed = parseTimelineSchema({
      nodes: [{ id: 'n1', title: 'Test', status: 'invalid-status' as any }],
    })
    const container = renderTimeline(parsed)

    const node = container.querySelector('[data-node-id="n1"]')
    expect(node?.classList.contains('status-pending')).toBe(true)
  })

  it('null input shows fallback', () => {
    const parsed = parseTimelineSchema(null)
    const container = renderTimeline(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('missing nodes key shows fallback', () => {
    const parsed = parseTimelineSchema({})
    const container = renderTimeline(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('nodes with missing id are filtered out', () => {
    const parsed = parseTimelineSchema({
      nodes: [{ title: 'No ID', status: 'pending' }],
    })
    expect(parsed.fallback).toBe(true)
  })

  it('undefined input shows fallback', () => {
    const parsed = parseTimelineSchema(undefined)
    expect(parsed.fallback).toBe(true)
  })
})

describe('Timeline — Parser Tests', () => {
  it('parses valid input correctly', () => {
    const parsed = parseTimelineSchema({
      nodes: [
        { id: 'n1', title: 'Phase 1', status: 'completed', startDate: '2024-01-01', endDate: '2024-01-15' },
      ],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.nodes.length).toBe(1)
    expect(parsed.nodes[0].status).toBe('completed')
  })

  it('sorts nodes by startDate', () => {
    const parsed = parseTimelineSchema({
      nodes: [
        { id: 'n3', title: 'C', status: 'pending', startDate: '2024-03-01' },
        { id: 'n1', title: 'A', status: 'completed', startDate: '2024-01-01' },
        { id: 'n2', title: 'B', status: 'in-progress', startDate: '2024-02-01' },
      ],
    })
    expect(parsed.nodes.map(n => n.id)).toEqual(['n1', 'n2', 'n3'])
  })
})
