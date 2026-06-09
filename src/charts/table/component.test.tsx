import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
}))

import { DataTable } from './component'

describe('DataTable', () => {
  it('formats decimal ratios as business percentages when column format is percent', () => {
    render(
      <DataTable
        props={{
          type: 'table',
          data: [{ channel: '线上', share: 0.5313 }],
          columns: [
            { key: 'channel', label: '渠道' },
            { key: 'share', label: '占比', format: 'percent' },
          ],
        }}
      />
    )

    expect(screen.getByText('线上')).toBeTruthy()
    expect(screen.getByText('53.13%')).toBeTruthy()
  })

  it('keeps wide business tables readable instead of squeezing every column', () => {
    const { container } = render(
      <DataTable
        props={{
          type: 'table',
          data: [{
            store: '宁波天一店',
            revenue: 97000,
            reason: '转化、缺货、差评三项同时恶化',
          }],
          columns: [
            { key: 'store', label: '门店' },
            { key: 'revenue', label: '营收' },
            { key: 'reason', label: '风险解释' },
          ],
        }}
      />
    )

    const table = container.querySelector('table')
    const reasonCell = screen.getByText('转化、缺货、差评三项同时恶化')
    expect(table?.style.minWidth).toBe('640px')
    expect(reasonCell.style.wordBreak).toBe('keep-all')
    expect(reasonCell.style.whiteSpace).toBe('normal')
  })

  it('does not crash when a host passes a table without data', () => {
    const { container } = render(
      <DataTable
        props={{
          type: 'table',
          title: '待补充明细',
          columns: [{ key: 'name', label: '名称' }],
        } as any}
      />
    )

    expect(container.textContent).toContain('待补充明细')
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0)
  })
})
