import type { ParsedSchema } from '../../core/types'

export type AuditStatus = 'success' | 'failure' | 'warning'

export interface AuditEntry {
  timestamp: string
  user: string
  action: string
  resource: string
  status: AuditStatus
  details: string
}

export interface AuditLogParsed extends ParsedSchema {
  entries: AuditEntry[]
}

const VALID_STATUSES: AuditStatus[] = ['success', 'failure', 'warning']

export function parseAuditLogSchema(input: unknown): AuditLogParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, entries: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (!Array.isArray(obj.entries) || obj.entries.length === 0) {
    return { valid: false, entries: [], fallback: true, originalInput: input }
  }

  const entries: AuditEntry[] = obj.entries
    .filter((e: unknown) => e && typeof e === 'object')
    .map((e: Record<string, unknown>) => ({
      // 支持 time（别名） 和 timestamp 两种字段名
      timestamp: (typeof e.timestamp === 'string' ? e.timestamp : '') || (typeof e.time === 'string' ? e.time : ''),
      user: typeof e.user === 'string' ? e.user : '',
      action: typeof e.action === 'string' ? e.action : '',
      resource: typeof e.resource === 'string' ? e.resource : '',
      status: VALID_STATUSES.includes(e.status as AuditStatus) ? (e.status as AuditStatus) : 'success',
      details: typeof e.details === 'string' ? e.details : '',
    }))
    .filter(e => e.timestamp && e.user && e.action)

  if (entries.length === 0) {
    return { valid: false, entries: [], fallback: true, originalInput: input }
  }

  return { valid: true, entries }
}
