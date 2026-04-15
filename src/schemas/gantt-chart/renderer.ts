import type { ParsedSchema } from '../../core/types'
import type { GanttChartParsed } from './parser'
import { tc } from '../../core/theme-colors'
import { enablePanZoom } from '../../core/pan-zoom'

interface GanttTask {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number   // 0-100
  status: 'completed' | 'in-progress' | 'pending' | 'delayed'
  assignee?: string
}

const STATUS_COLORS: Record<string, string> = {
  'completed': '#10b981',
  'in-progress': '#3b82f6',
  'pending': '#475569',
  'delayed': '#ef4444'
}

function dateToX(date: string, minDate: number, maxDate: number, chartWidth: number, padding: number): number {
  const t = (new Date(date).getTime() - minDate) / (maxDate - minDate)
  return padding + t * (chartWidth - padding * 2)
}

function taskHeight(): number { return 32 }
function rowGap(): number { return 8 }
function headerHeight(): number { return 40 }
function labelWidth(): number { return 160 }

export function renderGanttChart(parsed: ParsedSchema): HTMLElement {
  const gantt = parsed as GanttChartParsed

  if (!gantt.valid || gantt.tasks.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')
    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)
    return container
  }

  const tasks: GanttTask[] = gantt.tasks
  const padding = { left: 16, right: 16, top: 16, bottom: 16 }
  const ROW_H = taskHeight()
  const GAP = rowGap()
  const LABEL_W = labelWidth()
  const HEADER_H = headerHeight()

  // Theme colors
  const bgPrimary = tc('--rk-bg-primary')
  const bgSecondary = tc('--rk-bg-secondary')
  const textPrimary = tc('--rk-text-primary')
  const textTertiary = tc('--rk-text-tertiary')
  const warning = tc('--rk-warning')

  // Date range
  const dates = tasks.flatMap(t => [new Date(t.startDate).getTime(), new Date(t.endDate).getTime()])
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  const dayRange = (maxDate - minDate) / 86400000
  const CHART_W = Math.max(600, dayRange * 20)
  const CHART_H = HEADER_H + tasks.length * (ROW_H + GAP) + GAP + 40

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('data-schema', 'gantt-chart')
  svg.setAttribute('viewBox', `0 0 ${LABEL_W + CHART_W} ${CHART_H}`)
  svg.style.width = '100%'
  svg.style.height = 'auto'
  svg.style.overflow = 'visible'

  // Background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('width', '100%')
  bg.setAttribute('height', '100%')
  bg.setAttribute('fill', bgPrimary)
  svg.appendChild(bg)

  // Today line
  const today = new Date().getTime()
  if (today >= minDate && today <= maxDate) {
    const todayX = dateToX(new Date(today).toISOString().slice(0, 10), minDate, maxDate, CHART_W, padding.left)
    const todayLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    todayLine.setAttribute('x1', String(todayX + LABEL_W))
    todayLine.setAttribute('x2', String(todayX + LABEL_W))
    todayLine.setAttribute('y1', String(padding.top))
    todayLine.setAttribute('y2', String(CHART_H - padding.bottom))
    todayLine.setAttribute('stroke', warning)
    todayLine.setAttribute('stroke-width', '1.5')
    todayLine.setAttribute('stroke-dasharray', '4,3')
    svg.appendChild(todayLine)
    const todayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    todayLabel.setAttribute('x', String(todayX + LABEL_W + 4))
    todayLabel.setAttribute('y', String(padding.top - 3))
    todayLabel.setAttribute('fill', warning)
    todayLabel.setAttribute('font-size', '10')
    todayLabel.textContent = '今天'
    svg.appendChild(todayLabel)
  }

  // Week grid lines
  const startWeek = new Date(minDate)
  startWeek.setDate(startWeek.getDate() - startWeek.getDay())
  for (let d = startWeek.getTime(); d <= maxDate; d += 7 * 86400000) {
    const x = dateToX(new Date(d).toISOString().slice(0, 10), minDate, maxDate, CHART_W, padding.left)
    if (x < padding.left) continue
    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    gridLine.setAttribute('x1', String(x + LABEL_W))
    gridLine.setAttribute('x2', String(x + LABEL_W))
    gridLine.setAttribute('y1', String(HEADER_H + padding.top))
    gridLine.setAttribute('y2', String(CHART_H - padding.bottom))
    gridLine.setAttribute('stroke', bgSecondary)
    gridLine.setAttribute('stroke-width', '1')
    svg.appendChild(gridLine)
  }

  // Draw each task
  tasks.forEach((task, i) => {
    const y = HEADER_H + padding.top + i * (ROW_H + GAP)
    const x1 = dateToX(task.startDate, minDate, maxDate, CHART_W, padding.left)
    const x2 = dateToX(task.endDate, minDate, maxDate, CHART_W, padding.left)
    const barW = Math.max(x2 - x1, 4)
    const color = STATUS_COLORS[task.status] || STATUS_COLORS['pending']
    const gx = x1 + LABEL_W
    const gy = y + (ROW_H - 20) / 2

    // Bar background
    const barBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    barBg.setAttribute('x', String(gx))
    barBg.setAttribute('y', String(gy))
    barBg.setAttribute('width', String(barW))
    barBg.setAttribute('height', '20')
    barBg.setAttribute('rx', '4')
    barBg.setAttribute('fill', bgSecondary)
    svg.appendChild(barBg)

    // Progress fill
    const progressW = barW * (task.progress / 100)
    const barFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    barFill.setAttribute('x', String(gx))
    barFill.setAttribute('y', String(gy))
    barFill.setAttribute('width', String(progressW))
    barFill.setAttribute('height', '20')
    barFill.setAttribute('rx', '4')
    barFill.setAttribute('fill', color)
    barFill.setAttribute('opacity', '0.85')
    svg.appendChild(barFill)

    // Progress text
    if (barW > 40) {
      const pctText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      pctText.setAttribute('x', String(gx + barW / 2))
      pctText.setAttribute('y', String(gy + 13))
      pctText.setAttribute('text-anchor', 'middle')
      pctText.setAttribute('fill', '#fff')
      pctText.setAttribute('font-size', '10')
      pctText.setAttribute('font-weight', '600')
      pctText.textContent = `${task.progress}%`
      svg.appendChild(pctText)
    }

    // Task label (left side)
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', String(LABEL_W - padding.right))
    label.setAttribute('y', String(y + ROW_H / 2 + 1))
    label.setAttribute('text-anchor', 'end')
    label.setAttribute('dy', '0.35em')
    label.setAttribute('fill', textPrimary)
    label.setAttribute('font-size', '12')
    const displayName = task.name.length > 14 ? task.name.slice(0, 14) + '…' : task.name
    label.textContent = displayName
    svg.appendChild(label)

    // Status dot
    const dotX = LABEL_W - padding.right - (task.name.length > 14 ? 18 : 0)
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    dot.setAttribute('cx', String(dotX))
    dot.setAttribute('cy', String(y + ROW_H / 2))
    dot.setAttribute('r', '4')
    dot.setAttribute('fill', color)
    svg.appendChild(dot)
  })

  // Date axis labels（修复过滤条件，x是chart区域坐标，不应与LABEL_W比较）
  for (let d = minDate; d <= maxDate; d += 14 * 86400000) {
    const x = dateToX(new Date(d).toISOString().slice(0, 10), minDate, maxDate, CHART_W, padding.left)
    if (x < padding.left) continue
    const dt = new Date(d)
    const axisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    axisLabel.setAttribute('x', String(x + LABEL_W))
    axisLabel.setAttribute('y', String(HEADER_H + padding.top - 6))
    axisLabel.setAttribute('fill', textTertiary)
    axisLabel.setAttribute('font-size', '11')
    axisLabel.textContent = `${dt.getMonth() + 1}/${dt.getDate()}`
    svg.appendChild(axisLabel)
  }

  const container = document.createElement('div')
  container.className = 'gantt-chart'
  container.style.position = 'relative'
  container.style.overflow = 'hidden'
  container.style.maxWidth = '100%'
  svg.style.transformOrigin = '0 0'
  svg.style.cursor = 'grab'
  container.appendChild(svg)
  enablePanZoom(container, svg)
  return container
}
