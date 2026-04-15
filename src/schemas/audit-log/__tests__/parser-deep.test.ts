import { describe, it, expect } from 'vitest'
import { parseAuditLogSchema } from '../parser'

describe('Audit Log — Parser Deep Tests', () => {
  it('supports "time" as alias for "timestamp"', () => {
    const parsed = parseAuditLogSchema({
      entries: [
        { time: '2026-04-12 10:00:00', user: 'admin', action: 'login' },
      ],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.entries[0].timestamp).toBe('2026-04-12 10:00:00')
  })

  it('prefers "timestamp" over "time" when both present', () => {
    const parsed = parseAuditLogSchema({
      entries: [
        { timestamp: '2026-04-12 10:00:00', time: '2026-04-12 09:00:00', user: 'admin', action: 'login' },
      ],
    })
    expect(parsed.entries[0].timestamp).toBe('2026-04-12 10:00:00')
  })

  it('defaults invalid status to "success"', () => {
    const parsed = parseAuditLogSchema({
      entries: [
        { timestamp: '2026-04-12 10:00:00', user: 'admin', action: 'login', status: 'unknown' },
      ],
    })
    expect(parsed.entries[0].status).toBe('success')
  })

  it('accepts all valid statuses', () => {
    for (const status of ['success', 'failure', 'warning']) {
      const parsed = parseAuditLogSchema({
        entries: [
          { timestamp: '2026-04-12 10:00:00', user: 'admin', action: 'login', status },
        ],
      })
      expect(parsed.valid).toBe(true)
      expect(parsed.entries[0].status).toBe(status)
    }
  })

  it('filters entries missing timestamp, user, or action', () => {
    const parsed = parseAuditLogSchema({
      entries: [
        { user: 'admin', action: 'login' },  // missing timestamp
        { timestamp: '2026-04-12', action: 'login' },  // missing user
        { timestamp: '2026-04-12', user: 'admin' },  // missing action
      ],
    })
    expect(parsed.valid).toBe(false)
    expect(parsed.fallback).toBe(true)
  })

  it('defaults missing optional fields to empty string', () => {
    const parsed = parseAuditLogSchema({
      entries: [
        { timestamp: '2026-04-12 10:00:00', user: 'admin', action: 'login' },
      ],
    })
    expect(parsed.entries[0].resource).toBe('')
    expect(parsed.entries[0].details).toBe('')
  })
})
