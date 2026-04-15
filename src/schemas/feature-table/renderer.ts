import type { ParsedSchema } from '../../core/types'
import type { FeatureTableParsed } from './parser'

export function renderFeatureTable(parsed: ParsedSchema): HTMLElement {
  const table = parsed as FeatureTableParsed

  if (!table.valid || table.features.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'feature-table'
  wrapper.setAttribute('data-schema', 'feature-table')

  const tableEl = document.createElement('table')
  tableEl.className = 'feature-table-table'

  // Header
  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  for (const h of ['功能', '优先级', '状态', '描述', '负责人']) {
    const th = document.createElement('th')
    th.textContent = h
    headerRow.appendChild(th)
  }
  thead.appendChild(headerRow)
  tableEl.appendChild(thead)

  // Body
  const tbody = document.createElement('tbody')
  for (const feature of table.features) {
    const tr = document.createElement('tr')
    tr.setAttribute('data-feature-id', feature.id || '')
    tr.setAttribute('data-priority', feature.priority)
    tr.setAttribute('data-status', feature.status)

    const nameCell = document.createElement('td')
    nameCell.setAttribute('data-field', 'name')
    nameCell.className = 'feature-name'
    nameCell.textContent = feature.name
    tr.appendChild(nameCell)

    const priorityCell = document.createElement('td')
    const priorityBadge = document.createElement('span')
    priorityBadge.className = `priority-badge priority-${feature.priority}`
    priorityBadge.setAttribute('data-priority', feature.priority)
    priorityBadge.textContent = feature.priority === 'high' ? '高' : feature.priority === 'medium' ? '中' : '低'
    priorityCell.appendChild(priorityBadge)
    tr.appendChild(priorityCell)

    const statusCell = document.createElement('td')
    const statusBadge = document.createElement('span')
    statusBadge.className = `status-badge status-${feature.status}`
    statusBadge.setAttribute('data-status', feature.status)
    const statusMap: Record<string, string> = { planned: '计划中', 'in-progress': '进行中', completed: '已完成', cancelled: '已取消' }
    statusBadge.textContent = statusMap[feature.status] || feature.status
    statusCell.appendChild(statusBadge)
    tr.appendChild(statusCell)

    const descCell = document.createElement('td')
    descCell.setAttribute('data-field', 'description')
    descCell.className = 'feature-description'
    descCell.textContent = feature.description
    tr.appendChild(descCell)

    const assigneeCell = document.createElement('td')
    assigneeCell.setAttribute('data-field', 'assignee')
    assigneeCell.className = 'feature-assignee'
    assigneeCell.textContent = feature.assignee
    tr.appendChild(assigneeCell)

    tbody.appendChild(tr)
  }
  tableEl.appendChild(tbody)
  wrapper.appendChild(tableEl)

  return wrapper
}
