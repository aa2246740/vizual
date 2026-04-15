import type { ParsedSchema } from '../../core/types'
import type { FunnelChartParsed } from './parser'
import { tc, chartColors } from '../../core/theme-colors'
import {
  FunnelController,
  TrapezoidElement,
} from 'chartjs-chart-funnel'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import {
  Chart,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(FunnelController, TrapezoidElement, Tooltip, Legend, ChartDataLabels)

export function renderFunnelChart(parsed: ParsedSchema): HTMLElement {
  const chart = parsed as FunnelChartParsed

  if (!chart.valid || chart.steps.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')
    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)
    return container
  }

  const bgPrimary = tc('--rk-bg-primary')
  const bgSecondary = tc('--rk-bg-secondary')
  const textPrimary = tc('--rk-text-primary')
  const textSecondary = tc('--rk-text-secondary')
  const COLORS = chartColors(8)

  const container = document.createElement('div')
  container.className = 'funnel-chart'
  container.style.position = 'relative'
  container.style.width = '100%'
  container.style.height = '400px'
  container.style.background = bgPrimary

  const canvas = document.createElement('canvas')
  canvas.setAttribute('data-schema', 'funnel-chart')
  container.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    container.setAttribute('data-fallback', 'true')
    container.textContent = 'Canvas context unavailable'
    return container
  }

  // 漏斗图按值从大到小排列
  const sorted = [...chart.steps].sort((a, b) => b.value - a.value)
  const labels = sorted.map(s => s.label)
  const values = sorted.map(s => s.value)
  const colors = sorted.map((_, i) => COLORS[i % COLORS.length] + 'cc')
  const borderColors = sorted.map((_, i) => COLORS[i % COLORS.length])

  // 计算转化率
  const maxValue = values[0]
  const conversionRates = values.map((v, i) => {
    if (i === 0) return 100
    return maxValue > 0 ? ((v / maxValue) * 100).toFixed(1) : '0'
  })

  new Chart(ctx, {
    type: 'funnel',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
      }],
    },
    plugins: [ChartDataLabels],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      sort: 'desc',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: bgSecondary,
          titleColor: textPrimary,
          bodyColor: textSecondary,
          borderColor: tc('--rk-border-subtle'),
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          titleFont: { size: 12, weight: '600' as const },
          bodyFont: { size: 11 },
          callbacks: {
            label: (item) => {
              const val = item.parsed.y ?? item.parsed
              const pct = maxValue > 0 ? ((Number(val) / maxValue) * 100).toFixed(1) : '0'
              return ` ${Number(val).toLocaleString()} (${pct}%)`
            },
          },
        },
        datalabels: {
          color: textPrimary,
          font: { size: 11, weight: '600' as const },
          anchor: 'end' as const,
          align: 'end' as const,
          offset: 8,
          formatter: (value: number, context: { dataIndex: number }) => {
            const label = labels[context.dataIndex]
            const pct = conversionRates[context.dataIndex]
            return `${label}\n${value.toLocaleString()} (${pct}%)`
          },
        },
      },
    },
  })

  return container
}
