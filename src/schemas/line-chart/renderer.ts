import type { ParsedSchema } from '../../core/types'
import type { LineChartParsed } from './parser'
import { tc, chartColors } from '../../core/theme-colors'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
)

export function renderLineChart(parsed: ParsedSchema): HTMLElement {
  const chart = parsed as LineChartParsed

  if (!chart.valid || chart.datasets.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')
    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)
    return container
  }

  const COLORS = chartColors(6)
  const bgPrimary = tc('--rk-bg-primary')
  const bgSecondary = tc('--rk-bg-secondary')
  const textSecondary = tc('--rk-text-secondary')
  const textTertiary = tc('--rk-text-tertiary')

  const container = document.createElement('div')
  container.className = 'line-chart'
  container.style.position = 'relative'
  container.style.width = '100%'
  container.style.height = '280px'
  container.style.background = bgPrimary

  const canvas = document.createElement('canvas')
  canvas.setAttribute('data-schema', 'line-chart')
  container.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    container.setAttribute('data-fallback', 'true')
    container.textContent = 'Canvas context unavailable'
    return container
  }

  const labels = chart.datasets[0].data.map(p => p.label)
  const datasets = chart.datasets.map((ds, i) => ({
    label: ds.name,
    data: ds.data.map(p => p.value),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length] + '1a',
    fill: true,
    tension: 0.3,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: COLORS[i % COLORS.length],
    pointBorderColor: bgPrimary,
    pointBorderWidth: 2,
  }))

  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textSecondary,
            font: { size: 11 },
            boxWidth: 20,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: bgSecondary,
          titleColor: tc('--rk-text-primary'),
          bodyColor: textSecondary,
          borderColor: tc('--rk-border-subtle'),
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 11 },
          callbacks: {
            title: (items) => labels[items[0].dataIndex],
            label: (item) => ` ${item.dataset.label}: ${item.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: bgSecondary },
          ticks: {
            color: textTertiary,
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: { color: bgSecondary },
          ticks: {
            color: textTertiary,
            font: { size: 10 },
            callback: (v: number | string) =>
              typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v),
          },
          beginAtZero: false,
        },
      },
    },
  })

  return container
}
