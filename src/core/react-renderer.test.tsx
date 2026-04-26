import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { normalizeArtifact, type VizualSpec } from './artifact'
import {
  VizualArtifactView,
  VizualRenderer,
  applyVizualStateChanges,
  getVizualStateValue,
} from './react-renderer'

function makeControlsSpec(title: unknown = 'Controls'): VizualSpec {
  return {
    root: 'controls',
    state: {
      controls: {
        points: 4,
        mode: 'grouped',
      },
    },
    elements: {
      controls: {
        type: 'FormBuilder',
        props: {
          type: 'form_builder',
          title,
          submitLabel: 'Apply',
          value: { $bindState: '/controls' },
          fields: [
            { name: 'points', label: 'Points', type: 'slider', min: 3, max: 12 },
            { name: 'mode', label: 'Mode', type: 'select', options: ['grouped', 'stacked'] },
          ],
        },
        children: [],
      },
    },
  }
}

describe('VizualRenderer', () => {
  it('applies and extracts state changes by JSON pointer path', () => {
    const previous = {
      controls: { chartType: 'bar', points: 6 },
      other: { locked: true },
    }
    const changes = [
      { path: '/controls', value: { chartType: 'line', points: 10 } },
    ]

    expect(applyVizualStateChanges(previous, changes)).toEqual({
      controls: { chartType: 'line', points: 10 },
      other: { locked: true },
    })
    expect(getVizualStateValue(changes, '/controls', previous.controls)).toEqual({
      chartType: 'line',
      points: 10,
    })
  })

  it('wraps json-render with the required providers', async () => {
    const onStateChange = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { container } = render(
      <VizualRenderer
        spec={makeControlsSpec({
          $computed: 'panelTitle',
          args: { label: 'Live controls' },
        })}
        functions={{
          panelTitle: ({ label }) => `${label} panel`,
        }}
        onStateChange={onStateChange}
      />,
    )

    await waitFor(() => {
      expect(container.textContent).toContain('Live controls panel')
    })

    fireEvent.change(container.querySelector('input[type="range"]')!, {
      target: { value: '8' },
    })

    await waitFor(() => {
      expect(onStateChange).toHaveBeenLastCalledWith([
        { path: '/controls', value: { points: 8, mode: 'grouped' } },
      ])
    })

    expect(consoleError.mock.calls.flat().join('\n')).not.toContain('useVisibility')
    consoleError.mockRestore()
  })

  it('renders a normalized artifact directly', async () => {
    const artifact = normalizeArtifact(makeControlsSpec('Artifact controls'))
    const { container } = render(<VizualArtifactView artifact={artifact} />)

    await waitFor(() => {
      expect(container.textContent).toContain('Artifact controls')
    })
  })
})
