import { describe, it, expect } from 'vitest'
import { parseOrgChartSchema } from '../parser'
import { renderOrgChart } from '../renderer'

describe('Org Chart — Render Tests', () => {
  const fixture = {
    root: {
      name: '张总',
      title: 'CEO',
      department: '总裁办',
      children: [
        {
          name: '李副总',
          title: 'CTO',
          department: '技术部',
          children: [
            { name: '王工', title: '高级工程师', department: '后端组', children: [] },
            { name: '赵工', title: '前端负责人', department: '前端组', children: [] },
          ],
        },
        {
          name: '陈总监',
          title: 'CFO',
          department: '财务部',
          children: [],
        },
      ],
    },
  }

  it('renders root person', () => {
    const parsed = parseOrgChartSchema(fixture)
    const container = renderOrgChart(parsed)
    expect(container.querySelector('[data-person="张总"]')).not.toBeNull()
  })

  it('renders all person nodes', () => {
    const parsed = parseOrgChartSchema(fixture)
    const container = renderOrgChart(parsed)
    expect(container.querySelectorAll('[data-person]').length).toBe(5)
  })

  it('renders person title', () => {
    const parsed = parseOrgChartSchema(fixture)
    const container = renderOrgChart(parsed)
    const ceo = container.querySelector('[data-person="张总"]')
    expect(ceo?.querySelector('.org-title')?.textContent).toBe('CEO')
  })

  it('renders person department', () => {
    const parsed = parseOrgChartSchema(fixture)
    const container = renderOrgChart(parsed)
    const ceo = container.querySelector('[data-person="张总"]')
    expect(ceo?.querySelector('.org-department')?.textContent).toBe('总裁办')
  })

  it('renders children containers', () => {
    const parsed = parseOrgChartSchema(fixture)
    const container = renderOrgChart(parsed)
    expect(container.querySelectorAll('.org-children').length).toBe(2)
  })

  it('leaf nodes have no children container', () => {
    const parsed = parseOrgChartSchema(fixture)
    const container = renderOrgChart(parsed)
    const leaf = container.querySelector('[data-person="王工"]')
    expect(leaf?.querySelector('.org-children')).toBeNull()
  })
})

describe('Org Chart — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseOrgChartSchema(null)
    const container = renderOrgChart(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('missing root shows fallback', () => {
    const parsed = parseOrgChartSchema({})
    const container = renderOrgChart(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('root without name shows fallback', () => {
    const parsed = parseOrgChartSchema({ root: { title: 'CEO' } })
    const container = renderOrgChart(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseOrgChartSchema(42 as any)
    expect(() => renderOrgChart(parsed)).not.toThrow()
    const container = renderOrgChart(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
