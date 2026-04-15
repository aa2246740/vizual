import type { ParsedSchema } from '../../core/types'
import type { DataTableParsed } from './parser'

export function renderDataTable(parsed: ParsedSchema): HTMLElement {
  const table = parsed as DataTableParsed

  if (!table.valid || table.headers.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'data-table'
  wrapper.setAttribute('data-schema', 'data-table')

  const tableEl = document.createElement('table')
  tableEl.className = 'data-table'

  // Header
  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  for (const h of table.headers) {
    const th = document.createElement('th')
    th.textContent = h
    th.setAttribute('data-header', h)
    headerRow.appendChild(th)
  }
  thead.appendChild(headerRow)
  tableEl.appendChild(thead)

  // Body
  const tbody = document.createElement('tbody')
  for (let r = 0; r < table.rows.length; r++) {
    const tr = document.createElement('tr')
    tr.setAttribute('data-row-index', String(r))

    for (let c = 0; c < table.headers.length; c++) {
      const td = document.createElement('td')
      td.setAttribute('data-col-index', String(c))
      const cellValue = table.rows[r]?.[c]
      td.textContent = cellValue !== undefined && cellValue !== null ? String(cellValue) : ''
      tr.appendChild(td)
    }

    tbody.appendChild(tr)
  }
  tableEl.appendChild(tbody)
  wrapper.appendChild(tableEl)

  return wrapper
}
