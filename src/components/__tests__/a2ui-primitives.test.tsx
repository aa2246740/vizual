import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('../../core/theme-colors', () => ({
  tcss: (v: string) => `var(${v})`,
  tc: (v: string) => `resolved-${v}`,
  chartColors: (n: number) => Array.from({ length: n }, (_, i) => `resolved---rk-chart-${i + 1}`),
}))

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
import { Video } from '../a2ui-video/component'
import { AudioPlayer } from '../a2ui-audio/component'

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

  it('Row maps semantic start alignment to valid flex CSS', () => {
    const { container } = render(
      <Row props={{ align: 'start' }}>
        <span>A</span>
      </Row>
    )
    const row = container.firstChild as HTMLElement
    expect(row.style.alignItems).toBe('flex-start')
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

  it('Column maps semantic end alignment to valid flex CSS', () => {
    const { container } = render(
      <Column props={{ align: 'end' }}>
        <span>A</span>
      </Column>
    )
    const col = container.firstChild as HTMLElement
    expect(col.style.alignItems).toBe('flex-end')
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

  it('Card renders agent metric props when used as a KPI card', () => {
    render(
      <Card props={{ title: '本月营收', value: 1280000, unit: '元', deltaLabel: '较上月', delta: 8.47, extra: '同比 +30.61%' }} />
    )
    expect(screen.getByText('本月营收')).toBeTruthy()
    expect(screen.getByText('1280000')).toBeTruthy()
    expect(screen.getByText('元')).toBeTruthy()
    expect(screen.getByText('较上月 8.47')).toBeTruthy()
    expect(screen.getByText('同比 +30.61%')).toBeTruthy()
  })
})

describe('A2UI Display primitives', () => {
  it('Text renders content', () => {
    render(<Text props={{ content: 'Hello World' }} />)
    expect(screen.getByText('Hello World')).toBeTruthy()
  })

  it('Text renders escaped newlines as real line breaks', () => {
    const { container } = render(<Text props={{ content: 'Line 1\\nLine 2' }} />)
    const text = container.querySelector('p')
    expect(text?.textContent).toBe('Line 1\nLine 2')
    expect(text?.style.whiteSpace).toBe('pre-wrap')
  })

  it('Text heading variant uses h2 tag', () => {
    const { container } = render(<Text props={{ content: 'Title', variant: 'heading' }} />)
    expect(container.querySelector('h2')?.textContent).toBe('Title')
  })

  it('Text allows long unbroken content to wrap inside the container', () => {
    const { container } = render(<Text props={{ content: 'LONGWORD'.repeat(80) }} />)
    const text = container.firstChild as HTMLElement
    expect(text.style.overflowWrap).toBe('anywhere')
    expect(text.style.wordBreak).toBe('break-word')
    expect(text.style.minWidth).toBe('0px')
  })

  it('Image renders with src and alt', () => {
    const { container } = render(<Image props={{ src: 'https://example.com/img.png', alt: 'test image' }} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://example.com/img.png')
    expect(img.getAttribute('alt')).toBe('test image')
    expect(img.style.width).toBe('fit-content')
    expect(img.style.maxWidth).toBe('100%')
  })

  it('Image respects explicit width when the agent asks for a full-width visual', () => {
    const { container } = render(<Image props={{ src: 'https://example.com/img.png', width: '100%' }} />)
    const img = container.querySelector('img')!
    expect(img.style.width).toBe('100%')
  })

  it('Image accepts official A2UI url and description aliases', () => {
    const { container } = render(<Image props={{ url: 'https://example.com/img.png', description: 'alias image' }} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://example.com/img.png')
    expect(img.getAttribute('alt')).toBe('alias image')
  })

  it('Icon renders emoji', () => {
    const { container } = render(<Icon props={{ name: '🏠', size: 32 }} />)
    expect(container.textContent).toBe('🏠')
  })

  it('Icon renders common named icons as compact glyphs', () => {
    const { container } = render(<Icon props={{ name: 'check', size: 24 }} />)
    const icon = container.querySelector('span')!
    expect(icon.textContent).toBe('\u2713')
    expect(icon.getAttribute('aria-label')).toBe('check')
    expect(icon.style.width).toBe('24px')
  })

  it('Icon does not clip unknown text names', () => {
    const { container } = render(<Icon props={{ name: 'custom-icon', size: 24 }} />)
    const icon = container.querySelector('span')!
    expect(icon.textContent).toBe('custom-icon')
    expect(icon.style.width).toBe('auto')
    expect(icon.style.whiteSpace).toBe('nowrap')
  })

  it('List renders items', () => {
    const { container } = render(<List props={{ items: ['Apple', 'Banana', 'Cherry'] }} />)
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toBe('Apple')
  })

  it('List still renders items when json-render passes an empty children array', () => {
    const { container } = render(<List props={{ items: ['Apple', 'Banana'] }}>{[]}</List>)
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(container.textContent).toContain('Apple')
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

  it('Slider accepts official A2UI v0.10 steps divisions', () => {
    const { container } = render(<Slider props={{ min: 0, max: 100, value: 50, steps: 4 }} />)
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input.step).toBe('25')
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

  it('Video renders with src', () => {
    const { container } = render(<Video props={{ src: 'https://example.com/video.mp4' }} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toBe('https://example.com/video.mp4')
  })

  it('Video accepts official A2UI v0.10 url and posterUrl fields', () => {
    const { container } = render(<Video props={{ url: 'https://example.com/video.mp4', posterUrl: 'https://example.com/poster.jpg' }} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toBe('https://example.com/video.mp4')
    expect(video.getAttribute('poster')).toBe('https://example.com/poster.jpg')
  })

  it('AudioPlayer renders with title', () => {
    const { container } = render(<AudioPlayer props={{ src: 'https://example.com/audio.mp3', title: 'My Song' }} />)
    expect(screen.getByText('My Song')).toBeTruthy()
    expect(container.querySelector('audio')).toBeTruthy()
  })
})
