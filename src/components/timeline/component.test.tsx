import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Timeline } from './component'

describe('Timeline', () => {
  it('renders all events', () => {
    const events = [
      { date: '2024-01', title: 'Event A', description: 'Desc A' },
      { date: '2024-02', title: 'Event B' },
      { date: '2024-03', title: 'Event C', description: 'Desc C' },
    ]
    const { container } = render(<Timeline props={{ type: 'timeline', events }} />)

    // Should render 3 event items
    const eventDivs = container.querySelectorAll('[style*="position: relative"]')
    // container itself + 3 event divs (at least)
    expect(eventDivs.length).toBeGreaterThanOrEqual(3)
  })

  it('shows dates and titles', () => {
    const events = [
      { date: '2024-01', title: 'Launch' },
      { date: '2024-06', title: 'Scale' },
    ]
    const { container } = render(<Timeline props={{ type: 'timeline', events }} />)

    expect(container.textContent).toContain('2024-01')
    expect(container.textContent).toContain('Launch')
    expect(container.textContent).toContain('2024-06')
    expect(container.textContent).toContain('Scale')
  })

  it('renders optional title', () => {
    const { container, rerender } = render(
      <Timeline props={{ type: 'timeline', events: [{ date: '2024-01', title: 'Test' }] }} />
    )
    expect(container.querySelector('h3')).toBeNull()

    rerender(
      <Timeline props={{ type: 'timeline', title: 'My Timeline', events: [{ date: '2024-01', title: 'Test' }] }} />
    )
    expect(container.querySelector('h3')?.textContent).toBe('My Timeline')
  })
})
