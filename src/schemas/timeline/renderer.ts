import type { ParsedSchema } from '../../core/types'
import type { TimelineParsed } from './parser'

export function renderTimeline(parsed: ParsedSchema): HTMLElement {
  const timeline = parsed as TimelineParsed

  if (!timeline.valid || timeline.nodes.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'timeline'
  wrapper.setAttribute('data-schema', 'timeline')

  for (const node of timeline.nodes) {
    const nodeEl = document.createElement('div')
    nodeEl.setAttribute('data-node', '')
    nodeEl.setAttribute('data-node-id', node.id)
    nodeEl.setAttribute('data-status', node.status)
    nodeEl.className = `timeline-node status-${node.status}`

    const titleEl = document.createElement('div')
    titleEl.className = 'timeline-node-title'
    titleEl.textContent = node.title
    nodeEl.appendChild(titleEl)

    if (node.startDate || node.endDate) {
      const dateEl = document.createElement('div')
      dateEl.className = 'timeline-node-date'
      const parts: string[] = []
      if (node.startDate) parts.push(node.startDate)
      if (node.endDate) parts.push(node.endDate)
      dateEl.textContent = parts.join(' → ')
      nodeEl.appendChild(dateEl)
    }

    wrapper.appendChild(nodeEl)
  }

  return wrapper
}
