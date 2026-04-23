import { describe, it, expect } from 'vitest'
import { buildSectionContext, buildSectionContextMap } from '../section-context'
import type { Annotation } from '../types'

describe('buildSectionContext', () => {
  it('generates summary for text section', () => {
    const ctx = buildSectionContext({ type: 'text', content: 'Hello world this is a test' }, 0)
    expect(ctx.sectionType).toBe('text')
    expect(ctx.contentSummary).toBe('Hello world this is a test')
  })

  it('generates summary for KPI section with metrics', () => {
    const ctx = buildSectionContext({
      type: 'kpi',
      content: '',
      data: { metrics: [
        { label: 'Revenue', value: '$12.3M', change: '+15%' },
        { label: 'Users', value: '45.2K', change: '+8%' },
      ] },
    }, 2)
    expect(ctx.sectionType).toBe('kpi')
    expect(ctx.contentSummary).toContain('Revenue')
    expect(ctx.contentSummary).toContain('$12.3M')
    expect(ctx.contentSummary).toContain('Users')
    expect(ctx.contentSummary).toContain('45.2K')
  })

  it('generates summary for chart section', () => {
    const ctx = buildSectionContext({
      type: 'chart',
      content: '',
      title: 'Sales Trend',
      data: { series: [{ type: 'bar', data: [100, 200, 300] }, { type: 'line', data: [50, 60] }] },
    }, 3)
    expect(ctx.contentSummary).toContain('Sales Trend')
    expect(ctx.contentSummary).toContain('2 series')
    expect(ctx.contentSummary).toContain('5 data points')
  })

  it('generates summary for table section', () => {
    const rows = Array.from({ length: 15 }, () => [])
    const ctx = buildSectionContext({
      type: 'table',
      content: '',
      data: { columns: ['Product', 'Sales', 'Growth'], rows },
    }, 4)
    expect(ctx.contentSummary).toContain('Product')
    expect(ctx.contentSummary).toContain('Sales')
    expect(ctx.contentSummary).toContain('Growth')
    expect(ctx.contentSummary).toContain('15 rows')
  })

  it('includes aiContext when present', () => {
    const ctx = buildSectionContext({
      type: 'text',
      content: 'Hello',
      aiContext: 'Greeting section for new users',
    }, 0)
    expect(ctx.aiContext).toBe('Greeting section for new users')
  })

  it('truncates long content in summary', () => {
    const longContent = 'A'.repeat(300)
    const ctx = buildSectionContext({ type: 'text', content: longContent }, 0)
    expect(ctx.contentSummary.length).toBeLessThan(longContent.length)
    expect(ctx.contentSummary).toContain('...')
  })

  it('generates summary for freeform section (truncated)', () => {
    const ctx = buildSectionContext({ type: 'freeform', content: '<div>' + 'A'.repeat(150) + '</div>' }, 5)
    expect(ctx.sectionType).toBe('freeform')
    // truncate(str, 100) produces max 103 chars (100 + '...')
    expect(ctx.contentSummary.length).toBeLessThanOrEqual(103)
  })

  it('generates summary for component section with title', () => {
    const ctx = buildSectionContext({ type: 'component', content: '', componentType: 'BarChart', title: 'Sales' }, 6)
    expect(ctx.contentSummary).toBe('Sales')
  })

  it('generates summary for component section with data array', () => {
    const ctx = buildSectionContext({
      type: 'component',
      content: '',
      componentType: 'BarChart',
      title: 'Revenue',
      data: { data: [100, 200, 300] },
    }, 6)
    expect(ctx.contentSummary).toContain('Revenue')
    expect(ctx.contentSummary).toContain('3 data points')
  })

  it('generates summary for component section with fields', () => {
    const ctx = buildSectionContext({
      type: 'component',
      content: '',
      componentType: 'FormBuilder',
      title: 'Contact Form',
      data: { fields: [{ name: 'email' }, { name: 'phone' }] },
    }, 6)
    expect(ctx.contentSummary).toContain('Contact Form')
    expect(ctx.contentSummary).toContain('2 fields')
  })

  it('generates summary for component section fallback to componentType', () => {
    const ctx = buildSectionContext({ type: 'component', content: '', componentType: 'Kanban' }, 6)
    expect(ctx.contentSummary).toBe('Kanban')
  })
})

describe('buildSectionContextMap', () => {
  it('builds context map for target-based annotations', () => {
    const sections = [
      { type: 'text', content: 'Intro' },
      { type: 'kpi', content: '', data: { metrics: [{ label: 'Rev', value: '$1M' }] } },
      { type: 'chart', content: '', title: 'Trend', data: { series: [{ data: [1, 2, 3] }] } },
    ]
    const annotations = [
      { id: '1', text: '$1M', note: '', color: '#fbbf24' as const, status: 'draft' as const, createdAt: '', updatedAt: '', target: { sectionIndex: 1, targetType: 'kpi' as const, label: 'Rev' } },
    ] as Annotation[]

    const map = buildSectionContextMap(sections, annotations)
    expect(map[1]).toBeDefined()
    expect(map[1].sectionType).toBe('kpi')
    expect(map[1].contentSummary).toContain('Rev')
  })

  it('returns empty map when no target annotations', () => {
    const sections = [{ type: 'text', content: 'Hello' }]
    const annotations = [
      { id: '1', text: 'Hello', note: '', color: '#fbbf24' as const, status: 'draft' as const, createdAt: '', updatedAt: '' },
    ] as Annotation[]

    const map = buildSectionContextMap(sections, annotations)
    expect(Object.keys(map)).toHaveLength(0)
  })
})
