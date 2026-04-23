import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
}))

import { wrapWithLayout } from '../layout-wrappers'

describe('wrapWithLayout', () => {
  it('returns content unchanged for default layout', () => {
    const content = <div data-testid="inner">Hello</div>
    const { getByTestId } = render(<>{wrapWithLayout({ type: 'text', content: '' }, 0, content, 'default')}</>)
    expect(getByTestId('inner')).toBeTruthy()
  })

  it('returns content unchanged for undefined layout', () => {
    const content = <div data-testid="inner">Hello</div>
    const { getByTestId } = render(<>{wrapWithLayout({ type: 'text', content: '' }, 0, content)}</>)
    expect(getByTestId('inner')).toBeTruthy()
  })

  it('applies hero layout with gradient background', () => {
    const content = <div>Hero content</div>
    const { container } = render(<>{wrapWithLayout({ type: 'heading', content: '' }, 0, content, 'hero')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('180px')
    expect(wrapper.style.display).toBe('flex')
  })

  it('applies card layout with border and shadow', () => {
    const content = <div>Card content</div>
    const { container } = render(<>{wrapWithLayout({ type: 'text', content: '' }, 0, content, 'card')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderRadius).toContain('var(--rk-radius-lg)')
    expect(wrapper.style.boxShadow).toContain('var(--rk-shadow)')
  })

  it('applies banner layout with left border', () => {
    const content = <div>Banner content</div>
    const { container } = render(<>{wrapWithLayout({ type: 'callout', content: '' }, 0, content, 'banner')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderLeft).toContain('var(--rk-accent)')
  })

  it('applies compact layout with small padding', () => {
    const content = <div>Compact</div>
    const { container } = render(<>{wrapWithLayout({ type: 'text', content: '' }, 0, content, 'compact')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.padding).toBe('8px 12px')
  })

  it('applies split layout as two-column grid', () => {
    const content = <div>Split</div>
    const { container } = render(<>{wrapWithLayout({ type: 'text', content: '' }, 0, content, 'split')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.display).toBe('grid')
    expect(wrapper.style.gridTemplateColumns).toBe('1fr 1fr')
  })

  it('applies grid layout with default columns', () => {
    const content = <div>Grid</div>
    const { container } = render(<>{wrapWithLayout({ type: 'text', content: '' }, 0, content, 'grid')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.gridTemplateColumns).toBe('repeat(2, 1fr)')
  })

  it('grid layout for KPI defaults to 3 columns', () => {
    const content = <div>Grid KPI</div>
    const { container } = render(<>{wrapWithLayout({ type: 'kpi', content: '' }, 0, content, 'grid')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('grid layout uses data.columns when present', () => {
    const content = <div>Grid</div>
    const { container } = render(<>{wrapWithLayout({ type: 'kpi', content: '', data: { columns: 4 } }, 0, content, 'grid')}</>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.gridTemplateColumns).toBe('repeat(4, 1fr)')
  })
})
