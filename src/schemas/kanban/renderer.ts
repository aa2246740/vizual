import type { ParsedSchema } from '../../core/types'
import type { KanbanParsed } from './parser'

export function renderKanban(parsed: ParsedSchema): HTMLElement {
  const board = parsed as KanbanParsed

  if (!board.valid || board.columns.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'kanban-board'
  wrapper.setAttribute('data-schema', 'kanban')

  for (const column of board.columns) {
    const colEl = document.createElement('div')
    colEl.setAttribute('data-column', column.id)
    colEl.className = 'kanban-column'

    const titleEl = document.createElement('div')
    titleEl.setAttribute('data-column-title', '')
    titleEl.className = 'kanban-column-title'
    titleEl.textContent = column.title
    colEl.appendChild(titleEl)

    for (const card of column.cards) {
      const cardEl = document.createElement('div')
      cardEl.setAttribute('data-card-id', card.id)
      cardEl.setAttribute('draggable', 'true')
      cardEl.className = 'kanban-card'

      // Drag event
      cardEl.addEventListener('dragstart', (e: DragEvent) => {
        e.dataTransfer?.setData('cardId', card.id)
      })

      const contentEl = document.createElement('div')
      contentEl.setAttribute('data-card-content', '')
      contentEl.className = 'kanban-card-content'
      contentEl.textContent = card.content
      cardEl.appendChild(contentEl)

      if (card.labels.length > 0) {
        const labelsEl = document.createElement('div')
        labelsEl.className = 'kanban-card-labels'
        for (const label of card.labels) {
          const labelEl = document.createElement('span')
          labelEl.setAttribute('data-label', label)
          labelEl.className = 'kanban-label'
          labelEl.textContent = label
          labelsEl.appendChild(labelEl)
        }
        cardEl.appendChild(labelsEl)
      }

      colEl.appendChild(cardEl)
    }

    wrapper.appendChild(colEl)
  }

  return wrapper
}
