import { describe, it, expect } from 'vitest'
import { previewVizualNativeInput } from '../preview'
import { normalizeVizualNativeInput } from '../normalize'
import { withDefaultElementProps } from '../../core/spec-validation'

describe('review hardening — thousands-separated numbers', () => {
  it('coerces "1,234" style cells to real numbers on the chart data path', () => {
    const spec = withDefaultElementProps({
      root: 'r',
      elements: { r: { type: 'BarChart', props: { x: 'name', y: 'value', data: [
        { name: 'A', value: '1,234' }, { name: 'B', value: '5,678' },
      ] } } },
    })
    const data = spec.elements!.r.props!.data as Array<Record<string, unknown>>
    expect(data[0].value).toBe(1234)
    expect(data[1].value).toBe(5678)
  })

  it('leaves genuine category strings and percentages untouched', () => {
    const spec = withDefaultElementProps({
      root: 'r',
      elements: { r: { type: 'BarChart', props: { x: 'name', y: 'value', data: [
        { name: '北京', value: '2.1%' }, { name: '2024', value: 100 },
      ] } } },
    })
    const data = spec.elements!.r.props!.data as Array<Record<string, unknown>>
    expect(data[0].name).toBe('北京')
    expect(data[0].value).toBe('2.1%')
    expect(data[1].name).toBe('2024')
  })
})

describe('review hardening — ok:true must mean renderable', () => {
  const cases: Array<{ name: string; input: unknown }> = [
    { name: 'empty-data bar chart', input: { root: 'r', elements: { r: { type: 'BarChart', props: { x: 'name', y: 'value', data: [] } } } } },
    { name: 'non-array data chart', input: { root: 'r', elements: { r: { type: 'LineChart', props: { x: 'name', y: 'value', data: 'oops' } } } } },
    { name: 'empty KpiDashboard', input: { root: 'r', elements: { r: { type: 'KpiDashboard', props: { type: 'kpi_dashboard', metrics: [] } } } } },
    { name: 'empty DataTable', input: { root: 'r', elements: { r: { type: 'DataTable', props: { type: 'table', columns: [], data: [] } } } } },
    { name: 'empty Timeline', input: { root: 'r', elements: { r: { type: 'Timeline', props: { events: [] } } } } },
    { name: 'empty OrgChart', input: { root: 'r', elements: { r: { type: 'OrgChart', props: { nodes: [] } } } } },
    { name: 'empty FormBuilder', input: { root: 'r', elements: { r: { type: 'FormBuilder', props: { fields: [] } } } } },
    { name: 'root container with no content leaf', input: { root: 'r', elements: { r: { type: 'Column', props: {}, children: [] } } } },
  ]
  for (const c of cases) {
    it(`rejects ${c.name} as not renderable (ok:false)`, () => {
      const result = previewVizualNativeInput(c.input as never, { requireRenderable: true })
      expect(result.ok).toBe(false)
      expect(result.issues.some(i => i.code === 'vizual.empty_content')).toBe(true)
    })
    it(`treats ${c.name} as a warning (not error) while streaming`, () => {
      const result = previewVizualNativeInput(c.input as never, { requireRenderable: false })
      expect(result.issues.some(i => i.code === 'vizual.empty_content' && i.severity === 'error')).toBe(false)
    })
  }

  it('still accepts a real chart with data', () => {
    const result = previewVizualNativeInput({
      root: 'r', elements: { r: { type: 'BarChart', props: { x: 'name', y: 'value', data: [{ name: 'A', value: 5 }] } } },
    } as never, { requireRenderable: true })
    expect(result.ok).toBe(true)
  })

  it('still accepts a text/markdown leaf surface', () => {
    const result = previewVizualNativeInput({
      root: 'r', elements: { r: { type: 'Markdown', props: { content: '# Hello' } } },
    } as never, { requireRenderable: true })
    expect(result.ok).toBe(true)
  })
})

describe('review hardening — nested data on the A2UI/AG-UI component path', () => {
  it('lifts data.metrics into props.metrics for a KpiDashboard component', () => {
    const result = normalizeVizualNativeInput([
      { version: 'v0.10', createSurface: { surfaceId: 's', catalogId: 'vizual' } },
      { version: 'v0.10', updateComponents: { surfaceId: 's', components: [
        { id: 'root', component: 'KpiDashboard', data: { metrics: [{ label: 'Rev', value: 100 }] } },
      ] } },
    ] as never)
    const root = result.snapshot?.spec.elements?.root
    expect(root?.props?.metrics).toEqual([{ label: 'Rev', value: 100 }])
  })

  it('lifts data.rows/columns for a DataTable component', () => {
    const result = normalizeVizualNativeInput([
      { version: 'v0.10', createSurface: { surfaceId: 's', catalogId: 'vizual' } },
      { version: 'v0.10', updateComponents: { surfaceId: 's', components: [
        { id: 'root', component: 'DataTable', data: { columns: [{ key: 'a', label: 'A' }], rows: [{ a: 1 }, { a: 2 }] } },
      ] } },
    ] as never)
    const root = result.snapshot?.spec.elements?.root
    expect(Array.isArray(root?.props?.rows)).toBe(true)
    expect((root?.props?.rows as unknown[]).length).toBe(2)
  })
})
