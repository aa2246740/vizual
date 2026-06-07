import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
}))

import { KpiDashboard } from './component'

describe('KpiDashboard', () => {
  it('keeps long metric values on one line in compact cards', () => {
    render(
      <KpiDashboard
        props={{
          type: 'kpi_dashboard',
          title: '增长核心指标',
          columns: 4,
          metrics: [
            { label: '新增峰值', value: '275', trend: 'up', trendValue: 'D7' },
            { label: '活跃峰值', value: '1,690', trend: 'up', trendValue: 'D7' },
            { label: '收入峰值', value: '20,100', trend: 'up', trendValue: 'D7' },
            { label: '流失末值', value: '145', trend: 'down', trendValue: '需排查' },
          ],
        }}
      />
    )

    const value = screen.getByText('20,100') as HTMLElement
    expect(value.style.whiteSpace).toBe('nowrap')
    expect(value.style.overflow).toBe('hidden')
    expect(value.style.fontSize).toBe('var(--rk-text-xl)')
  })

  it('wraps dense comparison values instead of clipping them', () => {
    render(
      <KpiDashboard
        props={{
          type: 'kpi_dashboard',
          columns: 5,
          metrics: [
            { label: '流失率', value: '2.04% → 12.50%', trend: 'up', trendValue: '+10.46pp' },
          ],
        }}
      />
    )

    const value = screen.getByText('2.04% → 12.50%') as HTMLElement
    expect(value.style.whiteSpace).toBe('normal')
    expect(value.style.overflow).toBe('visible')
    expect(value.style.overflowWrap).toBe('anywhere')
    expect(value.style.fontSize).toBe('var(--rk-text-base)')
  })

  it('caps overly dense requested columns to keep cards readable', () => {
    const { container } = render(
      <KpiDashboard
        props={{
          type: 'kpi_dashboard',
          columns: 6,
          metrics: [
            { label: 'A', value: '1' },
            { label: 'B', value: '2' },
            { label: 'C', value: '3' },
            { label: 'D', value: '4' },
            { label: 'E', value: '5' },
          ],
        }}
      />
    )

    const grid = container.firstElementChild?.firstElementChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(100%, 150px), 1fr))')
  })

  it('wraps long trend labels instead of clipping them', () => {
    render(
      <KpiDashboard
        props={{
          type: 'kpi_dashboard',
          columns: 5,
          metrics: [
            { label: '新增用户', value: '165', trend: 'down', trendValue: '-40.0% vs D7峰值' },
          ],
        }}
      />
    )

    const trend = screen.getByText('↓ -40.0% vs D7峰值') as HTMLElement
    expect(trend.style.whiteSpace).toBe('normal')
    expect(trend.style.overflow).toBe('visible')
    expect(trend.style.fontSize).toBe('var(--rk-text-xs)')
  })
})
