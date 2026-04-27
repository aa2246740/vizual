import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { AnnotationInput } from '../annotation-input'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => v,
}))

describe('AnnotationInput', () => {
  it('opens upward when there is not enough space below the target', () => {
    const { container } = render(
      <AnnotationInput
        position={{ top: 220, left: 160 }}
        selectedText="Open Items"
        containerWidth={320}
        containerHeight={320}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    const popup = container.querySelector('[data-annotation-input]') as HTMLElement
    expect(popup.style.top).toBe('32px')
  })

  it('keeps the default downward placement when there is enough space', () => {
    const { container } = render(
      <AnnotationInput
        position={{ top: 80, left: 160 }}
        selectedText="Open Items"
        containerWidth={320}
        containerHeight={320}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    const popup = container.querySelector('[data-annotation-input]') as HTMLElement
    expect(popup.style.top).toBe('80px')
  })
})
