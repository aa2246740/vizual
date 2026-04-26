import { describe, it, expect } from 'vitest'
import { DocViewSchema } from '../schema'

describe('DocViewSchema', () => {
  it('accepts sections with aiContext field', () => {
    const spec = {
      type: 'doc_view',
      sections: [
        { id: 'intro', type: 'text', content: 'Hello', aiContext: 'Greeting section' },
      ],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sections[0].id).toBe('intro')
  })

  it('accepts sections with layout field', () => {
    const spec = {
      type: 'doc_view',
      sections: [
        { type: 'kpi', content: '', layout: 'hero', data: { metrics: [] } },
      ],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it('accepts markdown section type', () => {
    const spec = {
      type: 'doc_view',
      sections: [
        { type: 'markdown', content: '# Hello\n\nWorld' },
      ],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it('accepts freeform section type', () => {
    const spec = {
      type: 'doc_view',
      sections: [
        { type: 'freeform', content: '<div>Custom HTML</div>' },
      ],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it('accepts all layout variants', () => {
    const layouts = ['default', 'hero', 'split', 'grid', 'banner', 'card', 'compact'] as const
    for (const layout of layouts) {
      const spec = {
        type: 'doc_view',
        sections: [{ type: 'text', content: 'test', layout }],
      }
      const result = DocViewSchema.safeParse(spec)
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid layout value', () => {
    const spec = {
      type: 'doc_view',
      sections: [{ type: 'text', content: 'test', layout: 'invalid' }],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(false)
  })

  it('backward compatible: old specs without aiContext/layout still valid', () => {
    const spec = {
      type: 'doc_view',
      sections: [
        { type: 'text', content: 'Hello' },
        { type: 'heading', content: 'Title', level: 1 },
        { type: 'kpi', content: '', data: { metrics: [{ label: 'Revenue', value: '$12M' }] } },
        { type: 'chart', content: '', data: { xAxis: { type: 'category', data: ['A'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [100] }] } },
        { type: 'table', content: '', data: { columns: ['Name', 'Value'], rows: [['A', 1]] } },
        { type: 'callout', content: 'Note', variant: 'info' },
        { type: 'component', content: '', componentType: 'BarChart' },
      ],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it('rejects invalid section type', () => {
    const spec = {
      type: 'doc_view',
      sections: [{ type: 'invalid', content: 'test' }],
    }
    const result = DocViewSchema.safeParse(spec)
    expect(result.success).toBe(false)
  })
})
