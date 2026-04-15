import type { ParsedSchema } from '../../core/types'
import type { BarChartParsed } from './parser'
import { tc, chartColors } from '../../core/theme-colors'
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend)

export function renderBarChart(parsed: ParsedSchema): HTMLElement {
  const chart = parsed as BarChartParsed

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
  const horizontal = chart.horizontal ?? false

  const container = document.createElement('div')
  container.className = 'bar-chart'
  container.style.position = 'relative'
  container.style.width = '100%'
  container.style.height = horizontal
    ? `${Math.max(300, chart.datasets[0].values.length * 40 + 80)}px`
    : '300px'
  container.style.background = bgPrimary

  const canvas = document.createElement('canvas')
  canvas.setAttribute('data-schema', 'bar-chart')
  container.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    container.setAttribute('data-fallback', 'true')
    container.textContent = 'Canvas context unavailable'
    return container
  }

  const labels = chart.datasets[0].labels

  const datasets = chart.datasets.map((ds, i) => ({
    label: ds.name,
    data: ds.values,
    backgroundColor: COLORS[i % COLORS.length] + 'cc',
    borderColor: COLORS[i % COLORS.length],
    borderWidth: 1,
    borderRadius: 4,
    borderSkipped: false,
  }))

  // 显式X轴标签回调（避免某些打包环境下CategoryScale不自动映射labels的问题）
  const categoryTickCallback = (value: string | number) => {
    const idx = typeof value === 'number' ? value : parseInt(value, 10)
    return labels?.[idx] ?? String(value)
  }

  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textSecondary,
            font: { size: 11 },
            boxWidth: 12,
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
            label: (item) => ` ${item.dataset.label}: ${item.parsed[horizontal ? 'x' : 'y'].toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          type: 'category',
          grid: { color: bgSecondary },
          ticks: {
            color: textTertiary,
            font: { size: 11 },
            maxRotation: horizontal ? 0 : 45,
            autoSkip: false,
            callback: horizontal
              ? (v: number | string) =>
                  typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              : categoryTickCallback,
          },
          stacked: false,
        },
        y: {
          grid: { color: bgSecondary },
          ticks: {
            color: textTertiary,
            font: { size: 11 },
            callback: !horizontal
              ? (v: number | string) =>
                  typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              : categoryTickCallback,
          },
          stacked: false,
          beginAtZero: true,
        },
      },
    },
  })

  return container
}
