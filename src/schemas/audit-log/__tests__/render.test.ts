import { describe, it, expect } from 'vitest'
import { parseAuditLogSchema } from '../parser'
import { renderAuditLog } from '../renderer'

describe('Audit Log — Render Tests', () => {
  const fixture = {
    entries: [
      { timestamp: '2026-04-12T10:30:00Z', user: 'admin', action: 'user.create', resource: 'user/123', status: 'success', details: 'Created user zhangsan' },
      { timestamp: '2026-04-12T11:00:00Z', user: 'editor', action: 'file.delete', resource: 'file/456', status: 'failure', details: 'Permission denied' },
      { timestamp: '2026-04-12T11:15:00Z', user: 'viewer', action: 'report.view', resource: 'report/789', status: 'warning', details: 'Unusual access pattern' },
    ],
  }

  it('renders correct number of entries', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelectorAll('.audit-entry').length).toBe(3)
  })

  it('renders action text', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-field="action"]')?.textContent).toBe('user.create')
  })

  it('renders user text', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-field="user"]')?.textContent).toBe('admin')
  })

  it('renders timestamp', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-field="timestamp"]')?.textContent).toBe('2026-04-12T10:30:00Z')
  })

  it('renders status dots with correct classes', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('.audit-status-success')).not.toBeNull()
    expect(container.querySelector('.audit-status-failure')).not.toBeNull()
    expect(container.querySelector('.audit-status-warning')).not.toBeNull()
  })

  it('renders resource', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-field="resource"]')?.textContent).toBe('user/123')
  })

  it('renders details', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-field="details"]')?.textContent).toBe('Created user zhangsan')
  })

  it('entries have status data attribute', () => {
    const parsed = parseAuditLogSchema(fixture)
    const container = renderAuditLog(parsed)
    const entries = container.querySelectorAll('.audit-entry')
    expect(entries[0].getAttribute('data-status')).toBe('success')
    expect(entries[1].getAttribute('data-status')).toBe('failure')
  })
})

describe('Audit Log — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseAuditLogSchema(null)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty entries shows fallback', () => {
    const parsed = parseAuditLogSchema({ entries: [] })
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseAuditLogSchema({ entries: 'bad' } as any)
    expect(() => renderAuditLog(parsed)).not.toThrow()
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('entries with no valid items shows fallback', () => {
    const parsed = parseAuditLogSchema({ entries: [{ bad: 'entry' }] })
    expect(parsed.fallback).toBe(true)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('undefined input shows fallback', () => {
    const parsed = parseAuditLogSchema(undefined)
    const container = renderAuditLog(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
