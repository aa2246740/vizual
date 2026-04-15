import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarChart } from './component'

describe('BarChart', () => {
  it('renders a container div with correct dimensions', () => {
    const { container } = render(
      <BarChart
        type="bar"
        x="name"
        y="value"
        data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}
      />
    )
    const div = container.firstChild as HTMLDivElement
    expect(div).toBeTruthy()
    expect(div.style.width).toBe('100%')
    expect(div.style.height).toBe('300px')
  })

  it('renders taller when title is provided', () => {
    const { container } = render(
      <BarChart
        type="bar"
        title="Sales Report"
        x="name"
        y="value"
        data={[{ name: 'A', value: 10 }]}
      />
    )
    const div = container.firstChild as HTMLDivElement
    expect(div.style.height).toBe('320px')
  })
})
