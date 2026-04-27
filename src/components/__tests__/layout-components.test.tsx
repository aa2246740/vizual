import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
}))

import { GridLayout } from '../grid-layout/component'
import { SplitLayout } from '../split-layout/component'
import { HeroLayout } from '../hero-layout/component'

describe('GridLayout', () => {
  it('renders children in grid container', () => {
    const { container } = render(
      <GridLayout props={{ columns: 3, gap: 12 }}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </GridLayout>
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.display).toBe('grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(grid.style.gap).toBe('12px')
    expect(grid.style.minWidth).toBe('0px')
    expect((grid.firstChild as HTMLElement).style.minWidth).toBe('0px')
  })

  it('uses columnWidths when provided', () => {
    const { container } = render(
      <GridLayout props={{ columnWidths: ['1fr', '2fr'] }}>
        <div>A</div>
        <div>B</div>
      </GridLayout>
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('1fr 2fr')
  })
})

describe('SplitLayout', () => {
  it('renders horizontal split with default ratio', () => {
    const { container } = render(
      <SplitLayout props={{ direction: 'horizontal', ratio: 60 }}>
        <div>Left</div>
        <div>Right</div>
      </SplitLayout>
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.display).toBe('grid')
    expect(grid.style.gridTemplateColumns).toBe('60% 40%')
  })

  it('renders vertical split', () => {
    const { container } = render(
      <SplitLayout props={{ direction: 'vertical', ratio: 30 }}>
        <div>Top</div>
        <div>Bottom</div>
      </SplitLayout>
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.style.gridTemplateRows).toBe('30% 70%')
  })
})

describe('HeroLayout', () => {
  it('renders with gradient background by default', () => {
    const { container } = render(
      <HeroLayout props={{ height: 300, background: 'gradient', align: 'center' }}>
        <div>Hero content</div>
      </HeroLayout>
    )
    const hero = container.firstChild as HTMLElement
    expect(hero.style.minHeight).toBe('300px')
    expect(hero.style.display).toBe('flex')
    expect(hero.style.alignItems).toBe('center')
  })

  it('renders with solid background', () => {
    const { container } = render(
      <HeroLayout props={{ background: 'solid' }}>
        <div>Content</div>
      </HeroLayout>
    )
    const hero = container.firstChild as HTMLElement
    expect(hero.style.background).toContain('var(--rk-bg-secondary)')
  })

  it('renders with transparent background', () => {
    const { container } = render(
      <HeroLayout props={{ background: 'transparent' }}>
        <div>Content</div>
      </HeroLayout>
    )
    const hero = container.firstChild as HTMLElement
    expect(hero.style.background).toBe('transparent')
  })
})
