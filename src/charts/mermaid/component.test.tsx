import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MermaidChart } from './component'

describe('MermaidChart', () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & { mermaid?: unknown }).mermaid
    vi.restoreAllMocks()
  })

  it('uses strict security with SVG text labels so sanitization does not strip node labels', async () => {
    const initialize = vi.fn()
    const renderMermaid = vi.fn().mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text onclick="alert(1)">用户下单</text><script>alert(1)</script><foreignObject><div>bad</div></foreignObject></svg>',
    })
    ;(globalThis as typeof globalThis & { mermaid?: unknown }).mermaid = {
      initialize,
      render: renderMermaid,
    }

    render(<MermaidChart props={{
      type: 'mermaid',
      title: '订单流程',
      code: 'graph LR\\nA[用户下单] --> B[支付]',
      definition: 'graph LR\\nA[用户下单] --> B[支付]',
    }} />)

    await waitFor(() => expect(renderMermaid).toHaveBeenCalled())

    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({
      securityLevel: 'strict',
      htmlLabels: false,
    }))
    expect(await screen.findByText('用户下单')).toBeTruthy()
    expect(document.querySelector('svg')).toBeTruthy()
    expect(document.querySelector('script')).toBeFalsy()
    expect(document.querySelector('foreignObject')).toBeFalsy()
    expect(document.querySelector('text')?.getAttribute('onclick')).toBeFalsy()
  })

  it('accepts diagram as an agent-friendly alias for code', async () => {
    const initialize = vi.fn()
    const renderMermaid = vi.fn().mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>分行行长</text></svg>',
    })
    ;(globalThis as typeof globalThis & { mermaid?: unknown }).mermaid = {
      initialize,
      render: renderMermaid,
    }

    render(<MermaidChart props={{
      type: 'mermaid',
      title: '组织协同关系',
      diagram: 'graph TD\nFH[分行行长] --> YY[运营管理部]',
    }} />)

    await waitFor(() => expect(renderMermaid).toHaveBeenCalled())

    expect(renderMermaid).toHaveBeenCalledWith(
      expect.stringMatching(/^mermaid-/),
      'graph TD\nFH[分行行长] --> YY[运营管理部]',
    )
    expect(await screen.findByText('分行行长')).toBeTruthy()
  })
})
