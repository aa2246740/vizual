import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'

// Mock DOMPurify — 直接透传输入，让 injectAnnotationTargets 测试真实逻辑
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string) => input),
  },
}))

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
}))

import { renderFreeform } from '../freeform-renderer'

describe('renderFreeform', () => {
  it('renders without crashing', () => {
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: '<div>Hello</div>' }, 0)}</>)
    expect(container.querySelector('[data-target-type="freeform"]')).toBeTruthy()
  })

  it('sets data-docview-target attribute on wrapper', () => {
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: 'test' }, 2)}</>)
    const el = container.querySelector('[data-docview-target="freeform-2"]')
    expect(el?.getAttribute('data-docview-target')).toBe('freeform-2')
    expect(el?.getAttribute('data-section-index')).toBe('2')
  })

  it('applies theme colors', () => {
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: 'test' }, 0)}</>)
    const el = container.firstChild as HTMLElement
    expect(el.style.color).toContain('var(--rk-text-primary)')
    expect(el.style.background).toContain('var(--rk-bg-primary)')
  })

  it('injects annotation targets on semantic elements', () => {
    const html = '<section><h2>Title</h2><p>Text</p></section><article>Body</article>'
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: html }, 3)}</>)
    // section, h2, article should get annotation attributes
    const section = container.querySelector('section')
    expect(section?.getAttribute('data-docview-target')).toBe('freeform-3-0')
    expect(section?.getAttribute('data-section-index')).toBe('3')

    const h2 = container.querySelector('h2')
    expect(h2?.getAttribute('data-docview-target')).toBe('freeform-3-1')

    const article = container.querySelector('article')
    expect(article?.getAttribute('data-docview-target')).toBe('freeform-3-2')
  })

  it('injects targets on header, footer, figure, details', () => {
    const html = '<header>H</header><footer>F</footer><figure>Fig</figure><details><summary>S</summary></details>'
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: html }, 0)}</>)
    const targets = container.querySelectorAll('[data-docview-target^="freeform-0-"]')
    expect(targets.length).toBe(4)
  })

  it('injects targets on elements with data-section or data-card attributes', () => {
    const html = '<div data-section>S1</div><div data-card>C1</div>'
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: html }, 1)}</>)
    const targets = container.querySelectorAll('[data-docview-target^="freeform-1-"]')
    expect(targets.length).toBe(2)
  })

  it('does not inject on non-semantic elements like div, span, p', () => {
    const html = '<div><span>text</span><p>para</p></div>'
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: html }, 0)}</>)
    // No semantic elements → no injected targets inside
    const innerTargets = container.querySelectorAll('[data-docview-target^="freeform-0-"]')
    expect(innerTargets.length).toBe(0)
  })

  it('preserves inline style attributes from content', () => {
    const html = '<section style="color: red; padding: 10px;">Styled</section>'
    const { container } = render(<>{renderFreeform({ type: 'freeform', content: html }, 0)}</>)
    const section = container.querySelector('section')
    // DOMPurify should pass style through since we allow it
    expect(section?.hasAttribute('style')).toBe(true)
  })
})
