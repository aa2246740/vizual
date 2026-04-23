import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'

// Mock marked and dompurify
vi.mock('marked', () => ({
  marked: {
    parse: vi.fn((input: string) => `<p>${input}</p>`),
    setOptions: vi.fn(),
  },
}))

vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string) => input),
  },
}))

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
}))

import { renderMarkdown } from '../markdown-renderer'

describe('renderMarkdown', () => {
  it('renders without crashing', () => {
    const { container } = render(<>{renderMarkdown({ type: 'markdown', content: '# Hello' }, 0)}</>)
    expect(container.querySelector('[data-docview-markdown]')).toBeTruthy()
  })

  it('injects scoped style tag', () => {
    const { container } = render(<>{renderMarkdown({ type: 'markdown', content: 'test' }, 0)}</>)
    const style = container.querySelector('style')
    expect(style).toBeTruthy()
    expect(style?.textContent).toContain('[data-docview-markdown]')
  })

  it('applies theme color styles to wrapper', () => {
    const { container } = render(<>{renderMarkdown({ type: 'markdown', content: 'test' }, 0)}</>)
    const wrapper = container.querySelector('[data-docview-markdown]') as HTMLElement
    expect(wrapper.style.color).toContain('var(--rk-text-primary)')
  })
})
