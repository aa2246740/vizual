import type { ParsedSchema } from '../../core/types'
import type { JsonViewerParsed } from './parser'

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function renderValue(
  key: string,
  value: unknown,
  depth: number,
  maxDepth: number,
  collapsed: boolean
): HTMLElement | null {
  if (depth > maxDepth) {
    const trunc = document.createElement('span')
    trunc.setAttribute('data-truncated', 'true')
    trunc.className = 'json-truncated'
    trunc.textContent = '...'
    return trunc
  }

  const row = document.createElement('div')
  row.setAttribute('data-depth', String(depth))
  row.className = 'json-row'

  const keySpan = document.createElement('span')
  keySpan.setAttribute('data-key', key)
  keySpan.className = 'json-key'
  keySpan.textContent = `"${key}": `
  row.appendChild(keySpan)

  if (isObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      const empty = document.createElement('span')
      empty.setAttribute('data-empty', 'true')
      empty.className = 'json-empty'
      empty.textContent = '{}'
      row.appendChild(empty)
      return row
    }

    const container = document.createElement('div')
    container.setAttribute('data-depth', String(depth))
    container.setAttribute('aria-expanded', String(!collapsed))
    container.className = 'json-object'

    for (const [k, v] of entries) {
      const child = renderValue(k, v, depth + 1, maxDepth, collapsed)
      if (child) container.appendChild(child)
    }

    if (depth >= maxDepth) {
      const trunc = document.createElement('span')
      trunc.setAttribute('data-truncated', 'true')
      trunc.className = 'json-truncated'
      trunc.textContent = '...'
      container.appendChild(trunc)
    }

    row.appendChild(container)
  } else if (Array.isArray(value)) {
    const container = document.createElement('div')
    container.setAttribute('data-depth', String(depth))
    container.setAttribute('aria-expanded', String(!collapsed))
    container.className = 'json-array'

    value.forEach((item, idx) => {
      const child = renderValue(String(idx), item, depth + 1, maxDepth, collapsed)
      if (child) container.appendChild(child)
    })

    if (depth >= maxDepth) {
      const trunc = document.createElement('span')
      trunc.setAttribute('data-truncated', 'true')
      trunc.className = 'json-truncated'
      trunc.textContent = '...'
      container.appendChild(trunc)
    }

    row.appendChild(container)
  } else {
    const valSpan = document.createElement('span')
    valSpan.className = 'json-value'

    if (typeof value === 'string') {
      valSpan.setAttribute('data-token', 'string')
      valSpan.textContent = `"${value}"`
    } else if (typeof value === 'number') {
      valSpan.setAttribute('data-token', 'number')
      valSpan.textContent = String(value)
    } else if (typeof value === 'boolean') {
      valSpan.setAttribute('data-token', 'boolean')
      valSpan.textContent = String(value)
    } else if (value === null) {
      valSpan.setAttribute('data-token', 'null')
      valSpan.textContent = 'null'
    }

    row.appendChild(valSpan)
  }

  return row
}

export function renderJsonViewer(parsed: ParsedSchema): HTMLElement {
  const viewer = parsed as JsonViewerParsed

  if (!viewer.valid || !viewer.data) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = JSON.stringify(parsed.originalInput ?? parsed.data)
    container.appendChild(inner)

    return container
  }

  const container = document.createElement('div')
  container.className = `json-viewer theme-${viewer.config.syntaxTheme}`
  container.setAttribute('data-schema', 'json-viewer')

  const data = viewer.data as Record<string, unknown>
  const entries = Object.entries(data)

  if (entries.length === 0) {
    const empty = document.createElement('div')
    empty.setAttribute('data-empty', 'true')
    empty.className = 'json-empty-root'
    empty.textContent = '{}'
    container.appendChild(empty)
    return container
  }

  for (const [key, value] of entries) {
    const row = renderValue(key, value, 1, viewer.config.maxDepth, viewer.config.collapsedByDefault)
    if (row) container.appendChild(row)
  }

  return container
}
