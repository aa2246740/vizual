import type { ParsedSchema } from '../../core/types'
import type { PieChartParsed } from './parser'
import { tc, chartColors } from '../../core/theme-colors'
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

export function renderPieChart(parsed: ParsedSchema): HTMLElement {
  const chart = parsed as PieChartParsed

  if (!chart.valid || chart.segments.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')
    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)
    return container
  }

  const COLORS = chartColors(8)
  const bgPrimary = tc('--rk-bg-primary')
  const bgSecondary = tc('--rk-bg-secondary')
  const textPrimary = tc('--rk-text-primary')
  const textSecondary = tc('--rk-text-secondary')

  const container = document.createElement('div')
  container.className = 'pie-chart'
  container.style.cssText = `display: flex; gap: 16px; align-items: flex-start; width: 100%; background: ${bgPrimary};`
  container.style.position = 'relative'

  const svgWrapper = document.createElement('div')
  svgWrapper.style.cssText = 'flex: 0 0 260px; position: relative; min-width: 260px;'

  const canvas = document.createElement('canvas')
  canvas.setAttribute('data-schema', 'pie-chart')
  svgWrapper.appendChild(canvas)

  const legendEl = document.createElement('div')
  legendEl.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px 0;
    scrollbar-width: thin;
    scrollbar-color: ${tc('--rk-border-subtle')} transparent;
    flex: 1;
    min-width: 0;
  `
  legendEl.setAttribute('role', 'listbox')
  legendEl.setAttribute('aria-label', 'Chart legend')

  container.appendChild(svgWrapper)
  container.appendChild(legendEl)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    container.setAttribute('data-fallback', 'true')
    container.textContent = 'Canvas context unavailable'
    return container
  }

  const labels = chart.segments.map(s => s.label)
  const data = chart.segments.map(s => s.value)
  const backgroundColor = chart.segments.map((_, i) => COLORS[i % COLORS.length])

  new Chart(ctx, {
    type: chart.donut ? 'doughnut' : 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: bgPrimary,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: chart.donut ? '55%' : 0,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: bgSecondary,
          titleColor: textPrimary,
          bodyColor: textSecondary,
          borderColor: tc('--rk-border-subtle'),
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 11 },
          callbacks: {
            label: (item) => {
              const total = (item.dataset.data as number[]).reduce((a, b) => a + b, 0)
              const pct = ((item.parsed / total) * 100).toFixed(1)
              return ` ${item.label}: ${item.parsed.toLocaleString()} (${pct}%)`
            },
          },
        },
      },
    },
  })

  // Build custom scrollable legend
  const total = data.reduce((a, b) => a + b, 0)
  chart.segments.forEach((seg, i) => {
    const pct = ((seg.value / total) * 100).toFixed(1)
    const item = document.createElement('div')
    item.setAttribute('role', 'option')
    item.setAttribute('aria-selected', 'false')
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 8px;
      border-radius: ${tc('--rk-radius-md')};
      cursor: pointer;
      min-height: 44px;
      transition: background 0.15s;
    `
    item.addEventListener('mouseenter', () => {
      item.style.background = bgSecondary
    })
    item.addEventListener('mouseleave', () => {
      item.style.background = ''
    })

    const swatch = document.createElement('span')
    swatch.style.cssText = `
      width: 14px;
      height: 14px;
      border-radius: 3px;
      background: ${COLORS[i % COLORS.length]};
      flex-shrink: 0;
    `
    const label = document.createElement('span')
    label.style.cssText = `font-size: 12px; color: ${textPrimary}; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
    label.textContent = seg.label
    const value = document.createElement('span')
    value.style.cssText = `font-size: 11px; color: ${textSecondary}; flex-shrink: 0;`
    value.textContent = `${seg.value.toLocaleString()} (${pct}%)`

    item.appendChild(swatch)
    item.appendChild(label)
    item.appendChild(value)
    legendEl.appendChild(item)
  })

  return container
}
