import type { ParsedSchema } from '../../core/types'

export interface KanbanCard {
  id: string
  content: string
  labels: string[]
  done: boolean
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}

export interface KanbanParsed extends ParsedSchema {
  columns: KanbanColumn[]
}

function isValidCard(card: unknown): card is KanbanCard {
  if (!card || typeof card !== 'object') return false
  const c = card as Record<string, unknown>
  return typeof c.id === 'string' && typeof c.content === 'string'
}

function isValidColumn(col: unknown): col is KanbanColumn {
  if (!col || typeof col !== 'object') return false
  const c = col as Record<string, unknown>
  if (typeof c.id !== 'string' || typeof c.title !== 'string') return false
  if (!Array.isArray(c.cards)) return false
  return c.cards.every(isValidCard)
}

export function parseKanbanSchema(input: unknown): KanbanParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, columns: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (!Array.isArray(obj.columns) || obj.columns.length === 0) {
    return { valid: false, columns: [], fallback: true, originalInput: input }
  }

  const columns: KanbanColumn[] = []
  for (const col of obj.columns) {
    if (isValidColumn(col)) {
      columns.push({
        id: col.id,
        title: col.title,
        cards: col.cards.map(card => ({
          id: card.id,
          content: card.content,
          labels: Array.isArray(card.labels) ? card.labels.filter((l: unknown) => typeof l === 'string') : [],
          done: typeof card.done === 'boolean' ? card.done : false,
        })),
      })
    }
  }

  if (columns.length === 0) {
    return { valid: false, columns: [], fallback: true, originalInput: input }
  }

  return { valid: true, columns }
}
