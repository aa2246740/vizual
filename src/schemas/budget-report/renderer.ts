import type { ParsedSchema } from '../../core/types'
import type { BudgetReportParsed } from './parser'
import { tc } from '../../core/theme-colors'

export function renderBudgetReport(parsed: ParsedSchema): HTMLElement {
  const report = parsed as BudgetReportParsed

  if (!report.valid || report.items.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const textPrimary = tc('--rk-text-primary')
  const textSecondary = tc('--rk-text-secondary')
  const textTertiary = tc('--rk-text-tertiary')
  const bgSecondary = tc('--rk-bg-secondary')
  const borderSubtle = tc('--rk-border-subtle')
  const success = tc('--rk-success') || '#10b981'
  const danger = tc('--rk-danger') || '#ef4444'

  const wrapper = document.createElement('div')
  wrapper.className = 'budget-report'
  wrapper.setAttribute('data-schema', 'budget-report')

  // 注入样式
  const style = document.createElement('style')
  style.textContent = `
    .budget-report { padding: 16px; }
    .budget-header { margin-bottom: 12px; }
    .budget-title { font-size: 16px; font-weight: 600; color: ${textPrimary}; }
    .budget-period { font-size: 12px; color: ${textTertiary}; margin-top: 4px; }
    .budget-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .budget-table th { text-align: left; padding: 8px 12px; color: ${textTertiary}; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid ${borderSubtle}; }
    .budget-table td { padding: 10px 12px; border-bottom: 1px solid ${borderSubtle}; color: ${textSecondary}; }
    .budget-table tfoot td { border-top: 2px solid ${borderSubtle}; border-bottom: none; font-weight: 600; color: ${textPrimary}; }
    .budget-amount { text-align: right; font-variant-numeric: tabular-nums; }
    .budget-variance { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
    .variance-positive { color: ${success}; }
    .variance-negative { color: ${danger}; }
    .budget-total-label { font-weight: 600; }
  `
  wrapper.appendChild(style)

  const headerEl = document.createElement('div')
  headerEl.className = 'budget-header'

  const titleEl = document.createElement('div')
  titleEl.className = 'budget-title'
  titleEl.textContent = report.title
  headerEl.appendChild(titleEl)

  if (report.period) {
    const periodEl = document.createElement('div')
    periodEl.className = 'budget-period'
    periodEl.textContent = report.period
    headerEl.appendChild(periodEl)
  }

  wrapper.appendChild(headerEl)

  const tableEl = document.createElement('table')
  tableEl.className = 'budget-table'

  // Header
  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  for (const h of ['类目', '预算', '实际', '差异']) {
    const th = document.createElement('th')
    th.textContent = h
    headerRow.appendChild(th)
  }
  thead.appendChild(headerRow)
  tableEl.appendChild(thead)

  // Body
  const tbody = document.createElement('tbody')
  let totalBudget = 0
  let totalActual = 0

  for (const item of report.items) {
    const tr = document.createElement('tr')
    tr.setAttribute('data-category', item.category)
    tr.setAttribute('data-variance-sign', item.variance >= 0 ? 'positive' : 'negative')

    const catCell = document.createElement('td')
    catCell.setAttribute('data-field', 'category')
    catCell.textContent = item.category
    tr.appendChild(catCell)

    const budgetCell = document.createElement('td')
    budgetCell.setAttribute('data-field', 'budget')
    budgetCell.className = 'budget-amount'
    budgetCell.textContent = `${report.currency}${item.budget.toLocaleString()}`
    tr.appendChild(budgetCell)

    const actualCell = document.createElement('td')
    actualCell.setAttribute('data-field', 'actual')
    actualCell.className = 'budget-amount'
    actualCell.textContent = `${report.currency}${item.actual.toLocaleString()}`
    tr.appendChild(actualCell)

    const varianceCell = document.createElement('td')
    varianceCell.setAttribute('data-field', 'variance')
    varianceCell.className = `budget-variance ${item.variance >= 0 ? 'variance-positive' : 'variance-negative'}`
    const pct = item.budget > 0 ? ((item.variance / item.budget) * 100).toFixed(1) : '0'
    varianceCell.textContent = `${item.variance >= 0 ? '+' : ''}${report.currency}${item.variance.toLocaleString()} (${pct}%)`
    tr.appendChild(varianceCell)

    tbody.appendChild(tr)
    totalBudget += item.budget
    totalActual += item.actual
  }
  tableEl.appendChild(tbody)

  // Footer totals
  const tfoot = document.createElement('tfoot')
  const totalRow = document.createElement('tr')
  totalRow.className = 'budget-total-row'

  const totalLabelCell = document.createElement('td')
  totalLabelCell.className = 'budget-total-label'
  totalLabelCell.textContent = '合计'
  totalRow.appendChild(totalLabelCell)

  const totalBudgetCell = document.createElement('td')
  totalBudgetCell.className = 'budget-amount budget-total-value'
  totalBudgetCell.textContent = `${report.currency}${totalBudget.toLocaleString()}`
  totalRow.appendChild(totalBudgetCell)

  const totalActualCell = document.createElement('td')
  totalActualCell.className = 'budget-amount budget-total-value'
  totalActualCell.textContent = `${report.currency}${totalActual.toLocaleString()}`
  totalRow.appendChild(totalActualCell)

  const totalVar = totalBudget - totalActual
  const totalVarCell = document.createElement('td')
  totalVarCell.className = `budget-variance budget-total-value ${totalVar >= 0 ? 'variance-positive' : 'variance-negative'}`
  totalVarCell.textContent = `${totalVar >= 0 ? '+' : ''}${report.currency}${totalVar.toLocaleString()}`
  totalRow.appendChild(totalVarCell)

  tfoot.appendChild(totalRow)
  tableEl.appendChild(tfoot)

  wrapper.appendChild(tableEl)

  return wrapper
}
