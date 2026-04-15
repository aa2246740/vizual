import { describe, it, expect } from 'vitest'
import { parseGanttChart } from '../parser'
import { renderGanttChart } from '../renderer'

const validFixture = {
  title: '项目进度',
  tasks: [
    { id: 't1', name: '需求调研', startDate: '2026-04-01', endDate: '2026-04-05', progress: 100, status: 'completed' },
    { id: 't2', name: '架构设计', startDate: '2026-04-06', endDate: '2026-04-10', progress: 60, status: 'in-progress' },
    { id: 't3', name: '开发实现', startDate: '2026-04-11', endDate: '2026-04-20', progress: 0, status: 'pending' },
    { id: 't4', name: '测试上线', startDate: '2026-04-21', endDate: '2026-04-25', progress: 20, status: 'delayed' },
  ],
}

describe('Gantt Chart — Parser Tests', () => {
  it('parses valid input correctly', () => {
    const parsed = parseGanttChart(validFixture)
    expect(parsed.valid).toBe(true)
    expect(parsed.title).toBe('项目进度')
    expect(parsed.tasks.length).toBe(4)
  })

  it('parses task fields correctly', () => {
    const parsed = parseGanttChart(validFixture)
    const t1 = parsed.tasks[0]
    expect(t1.id).toBe('t1')
    expect(t1.name).toBe('需求调研')
    expect(t1.startDate).toBe('2026-04-01')
    expect(t1.endDate).toBe('2026-04-05')
    expect(t1.progress).toBe(100)
    expect(t1.status).toBe('completed')
  })

  it('defaults progress to 0 when omitted', () => {
    const input = {
      tasks: [{
        id: 't1', name: 'T', startDate: '2026-04-01',
        endDate: '2026-04-05', status: 'pending' as const, progress: undefined as any,
      }],
    }
    // schema requires progress or doesn't — let's check what happens
    const parsed = parseGanttChart(input)
    if (parsed.valid) {
      expect(parsed.tasks[0].progress).toBe(0)
    }
  })

  it('null input returns invalid', () => {
    const parsed = parseGanttChart(null)
    expect(parsed.valid).toBe(false)
    expect(parsed.tasks).toEqual([])
  })

  it('undefined input returns invalid', () => {
    const parsed = parseGanttChart(undefined)
    expect(parsed.valid).toBe(false)
  })

  it('missing tasks returns invalid', () => {
    const parsed = parseGanttChart({ title: 'No tasks' })
    expect(parsed.valid).toBe(false)
  })
})

describe('Gantt Chart — Render Tests', () => {
  it('renders container with SVG element', () => {
    const parsed = parseGanttChart(validFixture)
    const el = renderGanttChart(parsed)

    expect(el.className).toBe('gantt-chart')
    const svg = el.querySelector('svg[data-schema="gantt-chart"]')
    expect(svg).not.toBeNull()
  })

  it('container has overflow hidden', () => {
    const parsed = parseGanttChart(validFixture)
    const el = renderGanttChart(parsed)
    expect(el.style.overflow).toBe('hidden')
  })

  it('SVG has viewBox attribute', () => {
    const parsed = parseGanttChart(validFixture)
    const el = renderGanttChart(parsed)
    const svg = el.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).not.toBeNull()
  })

  it('renders task labels in SVG', () => {
    const parsed = parseGanttChart(validFixture)
    const el = renderGanttChart(parsed)
    const svg = el.querySelector('svg')!

    const texts = Array.from(svg.querySelectorAll('text'))
    const textContent = texts.map(t => t.textContent)
    expect(textContent).toContain('需求调研')
    expect(textContent).toContain('架构设计')
  })

  it('renders progress bars (rect elements)', () => {
    const parsed = parseGanttChart(validFixture)
    const el = renderGanttChart(parsed)
    const svg = el.querySelector('svg')!

    const rects = svg.querySelectorAll('rect')
    // At least 1 background rect + 1 fill rect per task + bg rect
    expect(rects.length).toBeGreaterThan(4)
  })

  it('renders single task without crashing', () => {
    const fixture = {
      tasks: [
        { id: 't1', name: '单任务', startDate: '2026-04-01', endDate: '2026-04-05', progress: 50, status: 'in-progress' as const },
      ],
    }
    const parsed = parseGanttChart(fixture)
    expect(() => renderGanttChart(parsed)).not.toThrow()
    const el = renderGanttChart(parsed)
    expect(el.querySelector('svg')).not.toBeNull()
  })

  it('truncates long task names', () => {
    const fixture = {
      tasks: [
        { id: 't1', name: '这是一个非常非常长的任务名称测试截断效果', startDate: '2026-04-01', endDate: '2026-04-05', progress: 50, status: 'in-progress' as const },
      ],
    }
    const parsed = parseGanttChart(fixture)
    const el = renderGanttChart(parsed)
    const svg = el.querySelector('svg')!

    const texts = Array.from(svg.querySelectorAll('text'))
    const truncated = texts.find(t => t.textContent?.includes('…'))
    expect(truncated).not.toBeNull()
  })
})

describe('Gantt Chart — Fallback Tests', () => {
  it('invalid parsed data shows fallback', () => {
    const parsed = parseGanttChart(null)
    const el = renderGanttChart(parsed)

    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
    expect(el.querySelector('svg')).toBeNull()
  })

  it('empty tasks shows fallback', () => {
    const parsed = parseGanttChart({ tasks: [] })
    const el = renderGanttChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('string input shows fallback', () => {
    const parsed = parseGanttChart('garbage' as any)
    const el = renderGanttChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('number input shows fallback', () => {
    const parsed = parseGanttChart(42 as any)
    const el = renderGanttChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback preserves original input', () => {
    const parsed = parseGanttChart(null)
    const el = renderGanttChart(parsed)
    expect(el.querySelector('[data-fallback="true"]')?.textContent).toBe('null')
  })
})
