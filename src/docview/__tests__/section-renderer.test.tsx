import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => v === '--rk-text-xs' ? '12' : `resolved-${v}`,
}))

vi.mock('../../registry', () => {
  const ChartStub = ({ props }: { props: Record<string, unknown> }) => {
    const dataCount = Array.isArray(props.data) ? props.data.length : 'none'
    const y = Array.isArray(props.y) ? props.y.join(',') : String(props.y ?? '')
    return `${String(props.title)}|${String(props.type)}|${dataCount}|${y}`
  }

  return {
    registry: {
      BarChart: ChartStub,
      FunnelChart: ChartStub,
      SankeyChart: ChartStub,
      RadarChart: ChartStub,
      MermaidDiagram: ChartStub,
    },
  }
})

import { SectionRenderer } from '../section-renderer'

describe('SectionRenderer chart sections', () => {
  it('adds section metadata to text-like sections for annotation context', () => {
    const { container } = render(<SectionRenderer sections={[
      { type: 'heading', content: 'Overview', level: 2 },
      { type: 'text', content: 'Plain text section' },
      { type: 'markdown', content: '**Markdown** section' },
    ]} />)

    expect(screen.getByText('Overview').getAttribute('data-section-index')).toBe('0')
    expect(screen.getByText('Plain text section').getAttribute('data-section-index')).toBe('1')
    expect(screen.getByText('Plain text section').getAttribute('data-target-type')).toBe('text')
    expect(container.querySelector('[data-docview-target="markdown-2"]')?.getAttribute('data-target-type')).toBe('markdown')
  })

  it('renders chartType sections with the matching Vizual chart component', () => {
    render(<SectionRenderer sections={[{
      type: 'chart',
      content: '',
      title: 'Pipeline',
      data: {
        chartType: 'FunnelChart',
        x: 'stage',
        y: 'value',
        data: [
          { stage: 'Lead', value: 120 },
          { stage: 'Closed', value: 30 },
        ],
      },
    }]} />)

    expect(screen.getByText('Pipeline|funnel|2|value')).toBeTruthy()
  })

  it('renders legacy component-shaped chart data', () => {
    render(<SectionRenderer sections={[{
      type: 'chart',
      content: '',
      title: 'Revenue',
      data: {
        type: 'BarChart',
        props: {
          x: 'quarter',
          y: 'amount',
          data: [
            { quarter: 'Q1', amount: 10 },
          ],
        },
      },
    }]} />)

    expect(screen.getByText('Revenue|bar|1|amount')).toBeTruthy()
  })
})
