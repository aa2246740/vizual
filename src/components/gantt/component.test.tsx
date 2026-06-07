import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GanttChart } from './component'

describe('GanttChart', () => {
  it('renders task bars as SVG primitives', () => {
    const { container } = render(
      <GanttChart
        props={{
          type: 'gantt',
          title: '项目排期',
          tasks: [
            { id: 'a', name: '需求确认', start: '2026-06-10', end: '2026-06-15', progress: 100 },
            { id: 'b', name: '系统联调', start: '2026-07-08', end: '2026-07-22', progress: 20, dependencies: ['a'] },
          ],
        }}
      />,
    )

    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(2)
    expect(container.querySelector('path')).not.toBeNull()
    expect(screen.getByText('需求确认')).toBeTruthy()
    expect(screen.getByText('系统联调')).toBeTruthy()
  })

  it('accepts agent-style data aliases and Chinese month-day dates', () => {
    const { container } = render(
      <GanttChart
        props={{
          type: 'gantt',
          title: '智能化改造',
          data: [
            { key: 'contract', title: '供应商合同', startDate: '6月16日', duration: '7天', percent: '50%' },
            { key: 'delivery', title: '设备到货', begin: '6月28日', finish: '7月6日', dependsOn: 'contract' },
          ],
        }}
      />,
    )

    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('供应商合同')).toBeTruthy()
    expect(screen.getByText('设备到货')).toBeTruthy()
  })

  it('accepts data objects with nested tasks from native-core payloads', () => {
    const { container } = render(
      <GanttChart
        props={{
          data: {
            title: '整改计划甘特图',
            tasks: [
              { name: '客户动线梳理', start: '2026-06-10', end: '2026-06-12' },
              { name: '窗口排班调整', start: '2026-06-13', end: '2026-06-20' },
            ],
          },
        }}
      />,
    )

    expect(container.textContent).not.toContain('No tasks')
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('客户动线梳理')).toBeTruthy()
    expect(screen.getByText('窗口排班调整')).toBeTruthy()
  })
})
