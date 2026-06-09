import { describe, expect, it, vi } from 'vitest'
import { collectVizualRenderEvidence } from '../render-evidence'
import type { VizualSpec } from '../artifact'

const chartSpec: VizualSpec = {
  root: 'chart',
  elements: {
    chart: {
      type: 'LineChart',
      props: {
        x: 'month',
        y: 'profit',
        data: [{ month: 'Jan', profit: 10 }],
      },
      children: [],
    },
  },
}

function mockBox(element: Element, width = 320, height = 240) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => undefined,
  } as DOMRect)
}

function makeCanvas(
  pixel: (x: number, y: number) => [number, number, number, number],
  pixelWidth = 12,
  pixelHeight = 12,
) {
  const canvas = document.createElement('canvas')
  canvas.width = pixelWidth
  canvas.height = pixelHeight
  mockBox(canvas, 120, 80)
  vi.spyOn(canvas, 'getContext').mockReturnValue({
    getImageData: (x: number, y: number) => ({ data: pixel(x, y) }),
  } as unknown as CanvasRenderingContext2D)
  return canvas
}

describe('collectVizualRenderEvidence', () => {
  it('does not treat a uniform blank chart canvas as chartPainted', () => {
    const host = document.createElement('div')
    mockBox(host)
    const chart = document.createElement('div')
    chart.setAttribute('data-vizual-chart', 'line')
    chart.setAttribute('data-vizual-chart-status', 'finished')
    mockBox(chart)
    chart.appendChild(makeCanvas(() => [255, 255, 255, 255]))
    host.appendChild(chart)

    const receipt = collectVizualRenderEvidence(host, chartSpec)

    expect(receipt.mounted).toBe(true)
    expect(receipt.painted).toBe(false)
    expect(receipt.chartPainted).toBe(false)
    expect(receipt.errors).toContain('expected-chart-not-painted')
    expect(receipt.evidence.metrics.nonEmptyCanvasCount).toBe(0)
  })

  it('treats a non-empty visible chart canvas as painted', () => {
    const host = document.createElement('div')
    mockBox(host)
    const chart = document.createElement('div')
    chart.setAttribute('data-vizual-chart', 'line')
    chart.setAttribute('data-vizual-chart-status', 'finished')
    mockBox(chart)
    chart.appendChild(makeCanvas((x, y) => (x === 0 && y === 0 ? [255, 255, 255, 255] : [30, 90, 200, 255])))
    host.appendChild(chart)

    const receipt = collectVizualRenderEvidence(host, chartSpec)

    expect(receipt.painted).toBe(true)
    expect(receipt.chartPainted).toBe(true)
    expect(receipt.errors).not.toContain('expected-chart-not-painted')
    expect(receipt.evidence.metrics.nonEmptyCanvasCount).toBe(1)
  })

  it('samples enough canvas points to catch sparse chart marks', () => {
    const host = document.createElement('div')
    mockBox(host)
    const chart = document.createElement('div')
    chart.setAttribute('data-vizual-chart', 'bar')
    chart.setAttribute('data-vizual-chart-status', 'finished')
    mockBox(chart)
    chart.appendChild(makeCanvas((x, y) => (
      x >= 33 && x <= 38 && y >= 40 && y <= 90
        ? [30, 90, 200, 255]
        : [255, 255, 255, 255]
    ), 100, 100))
    host.appendChild(chart)

    const receipt = collectVizualRenderEvidence(host, chartSpec)

    expect(receipt.painted).toBe(true)
    expect(receipt.errors).not.toContain('expected-chart-not-painted')
    expect(receipt.evidence.canvases[0]).toMatchObject({
      nonEmpty: true,
      sampleCount: 441,
    })
  })
})
