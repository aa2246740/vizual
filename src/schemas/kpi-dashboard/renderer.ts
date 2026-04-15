import type { ParsedSchema } from '../../core/types'
import type { KPIDashboardParsed } from './parser'

export function renderKpiDashboard(parsed: ParsedSchema): HTMLElement {
  const dashboard = parsed as KPIDashboardParsed

  if (!dashboard.valid || dashboard.metrics.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'kpi-dashboard'
  wrapper.setAttribute('data-schema', 'kpi-dashboard')

  const titleEl = document.createElement('div')
  titleEl.className = 'kpi-title'
  titleEl.textContent = dashboard.title
  wrapper.appendChild(titleEl)

  const grid = document.createElement('div')
  grid.className = 'kpi-grid'

  for (const metric of dashboard.metrics) {
    const card = document.createElement('div')
    card.className = 'kpi-card'
    card.setAttribute('data-metric', metric.name)
    card.setAttribute('data-trend', metric.trend)

    const nameEl = document.createElement('div')
    nameEl.className = 'kpi-metric-name'
    nameEl.textContent = metric.name
    card.appendChild(nameEl)

    const valueRow = document.createElement('div')
    valueRow.className = 'kpi-value-row'

    const valueEl = document.createElement('div')
    valueEl.className = 'kpi-value'
    valueEl.textContent = metric.value.toLocaleString()
    valueRow.appendChild(valueEl)

    if (metric.unit) {
      const unitEl = document.createElement('span')
      unitEl.className = 'kpi-unit'
      unitEl.textContent = metric.unit
      valueRow.appendChild(unitEl)
    }

    card.appendChild(valueRow)

    if (metric.target > 0) {
      const progressEl = document.createElement('div')
      progressEl.className = 'kpi-progress'

      const barEl = document.createElement('div')
      barEl.className = 'kpi-progress-bar'
      const pct = Math.min((metric.value / metric.target) * 100, 100)
      barEl.setAttribute('data-progress', String(Math.round(pct)))
      barEl.style.width = `${pct}%`
      // 填充颜色：根据完成度变色
      if (pct >= 100) {
        barEl.style.background = '#10B981' // 绿色：达标
      } else if (pct >= 70) {
        barEl.style.background = '#3B82F6' // 蓝色：进展良好
      } else {
        barEl.style.background = '#F59E0B' // 橙色：需关注
      }
      progressEl.appendChild(barEl)

      const targetEl = document.createElement('div')
      targetEl.className = 'kpi-target'
      targetEl.textContent = `目标: ${metric.target.toLocaleString()}${metric.unit}`
      progressEl.appendChild(targetEl)

      card.appendChild(progressEl)
    }

    const trendEl = document.createElement('div')
    trendEl.className = `kpi-trend trend-${metric.trend}`
    trendEl.setAttribute('data-trend', metric.trend)
    const trendSymbols: Record<string, string> = { up: '↑', down: '↓', flat: '→' }
    trendEl.textContent = trendSymbols[metric.trend] || '→'
    card.appendChild(trendEl)

    grid.appendChild(card)
  }

  wrapper.appendChild(grid)

  return wrapper
}
