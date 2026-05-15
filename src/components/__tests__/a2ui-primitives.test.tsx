import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
  chartColors: (n: number) => Array.from({ length: n }, (_, i) => `resolved---rk-chart-${i + 1}`),
}))

import { FreeformHtml } from '../freeform-html/component'
import { Row } from '../a2ui-row/component'
import { Column } from '../a2ui-column/component'
import { Card } from '../a2ui-card/component'
import { Text } from '../a2ui-text/component'
import { Image } from '../a2ui-image/component'
import { Icon } from '../a2ui-icon/component'
import { List } from '../a2ui-list/component'
import { Divider } from '../a2ui-divider/component'
import { Button } from '../a2ui-button/component'
import { CheckBox } from '../a2ui-checkbox/component'
import { TextField } from '../a2ui-textfield/component'
import { ChoicePicker } from '../a2ui-choicepicker/component'
import { Slider } from '../a2ui-slider/component'
import { DateTimeInput } from '../a2ui-datetime/component'
import { Tabs } from '../a2ui-tabs/component'
import { Modal } from '../a2ui-modal/component'
import { Video } from '../a2ui-video/component'
import { AudioPlayer } from '../a2ui-audio/component'

describe('FreeformHtml', () => {
  it('renders arbitrary HTML', () => {
    const { container } = render(<FreeformHtml props={{ html: '<h1>Hello</h1><p>World</p>' }} />)
    expect(container.querySelector('h1')?.textContent).toBe('Hello')
    expect(container.querySelector('p')?.textContent).toBe('World')
  })

  it('strips script tags for security', () => {
    const { container } = render(<FreeformHtml props={{ html: '<script>alert("xss")</script><p>safe</p>' }} />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('p')?.textContent).toBe('safe')
  })

  it('strips onclick handlers', () => {
    const { container } = render(<FreeformHtml props={{ html: '<div onclick="alert(1)">click</div>' }} />)
    const div = container.querySelector('div')
    expect(div?.getAttribute('onclick')).toBeNull()
  })

  it('allows style attributes', () => {
    const { container } = render(<FreeformHtml props={{ html: '<div style="color:red">styled</div>' }} />)
    const div = container.querySelector('div')
    expect(div?.getAttribute('style')).toBeTruthy()
  })

  it('renders complex layouts', () => {
    const html = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <section><h2>Card 1</h2></section>
        <section><h2>Card 2</h2></section>
      </div>`
    const { container } = render(<FreeformHtml props={{ html }} />)
    expect(container.querySelectorAll('section')).toHaveLength(2)
  })
})

describe('A2UI Layout primitives', () => {
  it('Row renders children horizontally', () => {
    const { container } = render(
      <Row props={{ gap: 12 }}>
        <span>A</span>
        <span>B</span>
      </Row>
    )
    const row = container.firstChild as HTMLElement
    expect(row.style.display).toBe('flex')
    expect(row.style.flexDirection).toBe('row')
    expect(row.style.gap).toBe('12px')
  })

  it('Column renders children vertically', () => {
    const { container } = render(
      <Column props={{ gap: 8 }}>
        <span>A</span>
        <span>B</span>
      </Column>
    )
    const col = container.firstChild as HTMLElement
    expect(col.style.display).toBe('flex')
    expect(col.style.flexDirection).toBe('column')
  })

  it('Card wraps children with background', () => {
    const { container } = render(
      <Card props={{ padding: 24, radius: 16, shadow: 2 }}>
        <span>inside card</span>
      </Card>
    )
    const card = container.firstChild as HTMLElement
    expect(card.style.padding).toBe('24px')
    expect(card.style.borderRadius).toBe('16px')
    expect(card.style.boxShadow).toBeTruthy()
  })
})

describe('A2UI Display primitives', () => {
  it('Text renders content', () => {
    render(<Text props={{ content: 'Hello World' }} />)
    expect(screen.getByText('Hello World')).toBeTruthy()
  })

  it('Text heading variant uses h2 tag', () => {
    const { container } = render(<Text props={{ content: 'Title', variant: 'heading' }} />)
    expect(container.querySelector('h2')?.textContent).toBe('Title')
  })

  it('Image renders with src and alt', () => {
    const { container } = render(<Image props={{ src: 'https://example.com/img.png', alt: 'test image' }} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://example.com/img.png')
    expect(img.getAttribute('alt')).toBe('test image')
  })

  it('Icon renders emoji', () => {
    const { container } = render(<Icon props={{ name: '🏠', size: 32 }} />)
    expect(container.textContent).toBe('🏠')
  })

  it('List renders items', () => {
    const { container } = render(<List props={{ items: ['Apple', 'Banana', 'Cherry'] }} />)
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toBe('Apple')
  })

  it('Divider renders horizontal line', () => {
    const { container } = render(<Divider props={{ direction: 'horizontal', spacing: 16 }} />)
    const div = container.firstChild as HTMLElement
    expect(div.style.borderBottom).toBeTruthy()
  })
})

describe('A2UI Input primitives', () => {
  it('Button renders label', () => {
    render(<Button props={{ label: 'Click me', variant: 'primary' }} />)
    expect(screen.getByText('Click me')).toBeTruthy()
  })

  it('CheckBox renders with label', () => {
    const { container } = render(<CheckBox props={{ label: 'Accept terms', checked: true }} />)
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input.checked).toBe(true)
    expect(screen.getByText('Accept terms')).toBeTruthy()
  })

  it('TextField renders with value', () => {
    const { container } = render(<TextField props={{ value: 'hello', placeholder: 'type here' }} />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('hello')
  })

  it('ChoicePicker renders radio options', () => {
    const { container } = render(
      <ChoicePicker props={{ options: ['A', 'B', 'C'], value: 'B', mode: 'radio' }} />
    )
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(3)
  })

  it('Slider renders range input', () => {
    const { container } = render(<Slider props={{ min: 0, max: 100, value: 75 }} />)
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input.value).toBe('75')
  })

  it('DateTimeInput renders date input', () => {
    const { container } = render(<DateTimeInput props={{ value: '2026-05-15', mode: 'date' }} />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('date')
  })
})

describe('A2UI Complex components', () => {
  it('Tabs renders tab headers', () => {
    render(
      <Tabs props={{ tabs: [{ label: 'Tab 1', key: 't1' }, { label: 'Tab 2', key: 't2' }], activeTab: 't1' }}>
        <span>content</span>
      </Tabs>
    )
    expect(screen.getByText('Tab 1')).toBeTruthy()
    expect(screen.getByText('Tab 2')).toBeTruthy()
  })

  it('Modal renders when open', () => {
    const { container } = render(
      <Modal props={{ title: 'My Modal', open: true }}>
        <span>Modal content</span>
      </Modal>
    )
    expect(screen.getByText('My Modal')).toBeTruthy()
    expect(screen.getByText('Modal content')).toBeTruthy()
  })

  it('Modal hides when closed', () => {
    const { container } = render(
      <Modal props={{ open: false }}>
        <span>Hidden content</span>
      </Modal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('Video renders with src', () => {
    const { container } = render(<Video props={{ src: 'https://example.com/video.mp4' }} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toBe('https://example.com/video.mp4')
  })

  it('AudioPlayer renders with title', () => {
    const { container } = render(<AudioPlayer props={{ src: 'https://example.com/audio.mp3', title: 'My Song' }} />)
    expect(screen.getByText('My Song')).toBeTruthy()
    expect(container.querySelector('audio')).toBeTruthy()
  })
})
