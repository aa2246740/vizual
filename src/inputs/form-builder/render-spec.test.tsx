import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import '../../cdn-entry'

function makeFormSpec(title: unknown = 'Controls') {
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
      },
    },
  }
}

describe('standalone renderSpec integration', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('passes functions and onStateChange through JSONUIProvider', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const onStateChange = vi.fn()

    window.Vizual.renderSpec(makeFormSpec({
      $computed: 'panelTitle',
      args: { label: 'Live controls' },
    }), container, {
      functions: {
        panelTitle: ({ label }) => `${label} panel`,
      },
      onStateChange,
    })

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

    window.Vizual.unmountSpec(container)
  })

  it('reuses the existing React root for repeated renders into the same container', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const firstRoot = window.Vizual.renderSpec(makeFormSpec('First'), container)
    const secondRoot = window.Vizual.renderSpec(makeFormSpec('Second'), container)

    expect(secondRoot).toBe(firstRoot)
    await waitFor(() => {
      expect(container.textContent).toContain('Second')
    })
    expect(consoleError.mock.calls.flat().join('\n')).not.toContain('createRoot')

    window.Vizual.unmountSpec(container)
    consoleError.mockRestore()
  })
})
