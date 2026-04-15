import type { ParsedSchema } from '../../core/types'

export type TimelineStatus = 'completed' | 'in-progress' | 'pending'

export interface TimelineNode {
  id: string
  title: string
  status: TimelineStatus
  startDate?: string
  endDate?: string
}

export interface TimelineParsed extends ParsedSchema {
  nodes: TimelineNode[]
}

const VALID_STATUSES: TimelineStatus[] = ['completed', 'in-progress', 'pending']

function normalizeStatus(status: unknown): TimelineStatus {
  if (typeof status === 'string' && VALID_STATUSES.includes(status as TimelineStatus)) {
    return status as TimelineStatus
  }
  return 'pending'
}

export function parseTimelineSchema(input: unknown): TimelineParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, nodes: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (!Array.isArray(obj.nodes)) {
    return { valid: false, nodes: [], fallback: true, originalInput: input }
  }

  if (obj.nodes.length === 0) {
    return { valid: false, nodes: [], fallback: true, originalInput: input }
  }

  const nodes: TimelineNode[] = obj.nodes
    .filter((n: unknown) => n && typeof n === 'object')
    .map((n: Record<string, unknown>) => ({
      id: typeof n.id === 'string' ? n.id : '',
      title: typeof n.title === 'string' ? n.title : '',
      status: normalizeStatus(n.status),
      startDate: typeof n.startDate === 'string' ? n.startDate : undefined,
      endDate: typeof n.endDate === 'string' ? n.endDate : undefined,
    }))
    .filter(n => n.id && n.title)

  if (nodes.length === 0) {
    return { valid: false, nodes: [], fallback: true, originalInput: input }
  }

  // Sort by startDate if available
  nodes.sort((a, b) => {
    if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate)
    return 0
  })

  return { valid: true, nodes }
}
