import type { ParsedSchema } from '../../core/types'
import type { AuditLogParsed } from './parser'

export function renderAuditLog(parsed: ParsedSchema): HTMLElement {
  const log = parsed as AuditLogParsed

  if (!log.valid || log.entries.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'audit-log'
  wrapper.setAttribute('data-schema', 'audit-log')

  for (const entry of log.entries) {
    const rowEl = document.createElement('div')
    rowEl.className = 'audit-entry'
    rowEl.setAttribute('data-status', entry.status)

    const headerEl = document.createElement('div')
    headerEl.className = 'audit-entry-header'

    const statusDot = document.createElement('span')
    statusDot.className = `audit-status-dot audit-status-${entry.status}`
    statusDot.setAttribute('data-status', entry.status)
    headerEl.appendChild(statusDot)

    const actionEl = document.createElement('span')
    actionEl.className = 'audit-action'
    actionEl.setAttribute('data-field', 'action')
    actionEl.textContent = entry.action
    headerEl.appendChild(actionEl)

    const userEl = document.createElement('span')
    userEl.className = 'audit-user'
    userEl.setAttribute('data-field', 'user')
    userEl.textContent = entry.user
    headerEl.appendChild(userEl)

    const timeEl = document.createElement('span')
    timeEl.className = 'audit-time'
    timeEl.setAttribute('data-field', 'timestamp')
    timeEl.textContent = entry.timestamp
    headerEl.appendChild(timeEl)

    rowEl.appendChild(headerEl)

    if (entry.resource) {
      const resourceEl = document.createElement('div')
      resourceEl.className = 'audit-resource'
      resourceEl.setAttribute('data-field', 'resource')
      resourceEl.textContent = entry.resource
      rowEl.appendChild(resourceEl)
    }

    if (entry.details) {
      const detailsEl = document.createElement('div')
      detailsEl.className = 'audit-details'
      detailsEl.setAttribute('data-field', 'details')
      detailsEl.textContent = entry.details
      rowEl.appendChild(detailsEl)
    }

    wrapper.appendChild(rowEl)
  }

  return wrapper
}
