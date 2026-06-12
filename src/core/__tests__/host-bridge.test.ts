import { describe, it, expect } from 'vitest'
import {
  createVizualHostBridge,
  wrapActionHandlersWithOnAction,
  collectDeclaredVizualActions,
  summarizeVizualInteractivity,
  type VizualAction,
} from '../host-bridge'
import { previewVizualNativeInput } from '../../native-core/preview'

const formSpec = {
  root: 'r',
  elements: { r: { type: 'FormBuilder', props: {
    fields: [{ name: 'name', label: 'Name', type: 'text' }],
  } } },
}

describe('createVizualHostBridge — agent roundtrip', () => {
  it('forwards a roundtrip action to the agent with a built message', () => {
    const sent: Array<{ message: string; action: VizualAction }> = []
    const bridge = createVizualHostBridge({
      surfaceId: 'surface-1',
      sendToAgent: (message, action) => { sent.push({ message, action }) },
    })
    bridge.onAction({ type: 'submitForm', params: { formId: 'r', data: { name: 'Ada' } } })
    expect(sent).toHaveLength(1)
    expect(sent[0].action.type).toBe('submitForm')
    expect(sent[0].message).toContain('The user triggered an action')
    expect(sent[0].message).toContain('surface-1')
    expect(sent[0].message).toContain('"name": "Ada"')
  })

  it('does not forward pure local value edits', () => {
    const sent: VizualAction[] = []
    const bridge = createVizualHostBridge({ sendToAgent: (_m, a) => { sent.push(a) } })
    bridge.onAction({ type: 'setValue', params: { value: 5 } })
    bridge.onAction({ type: 'switchTab', params: { index: 1 } })
    expect(sent).toHaveLength(0)
  })

  it('respects localActions overrides', () => {
    const sent: VizualAction[] = []
    const bridge = createVizualHostBridge({
      sendToAgent: (_m, a) => { sent.push(a) },
      localActions: ['applyFilter'],
    })
    bridge.onAction({ type: 'applyFilter', params: { filters: {} } })
    bridge.onAction({ type: 'submitForm', params: { data: {} } })
    expect(sent.map(a => a.type)).toEqual(['submitForm'])
  })
})

describe('wrapActionHandlersWithOnAction', () => {
  it('runs the original handler then emits a normalized action', async () => {
    const order: string[] = []
    const handlers = { submitForm: async () => { order.push('handler') } }
    const seen: VizualAction[] = []
    const wrapped = wrapActionHandlersWithOnAction(handlers, {
      onAction: a => { order.push('onAction'); seen.push(a) },
      surfaceId: 's1',
      getState: () => ({ a: 1 }),
      now: () => 'T',
    })
    await wrapped.submitForm({ formId: 'r', data: { x: 1 } }, undefined, undefined)
    expect(order).toEqual(['handler', 'onAction'])
    expect(seen[0]).toMatchObject({ type: 'submitForm', surfaceId: 's1', params: { formId: 'r' }, state: { a: 1 }, timestamp: 'T' })
  })
})

describe('custom action dispatch — declared actions without a local handler', () => {
  const customActionSpec = {
    root: 'r',
    elements: {
      r: { type: 'Column', children: ['hydrated', 'raw'] },
      // Hydrated shape: withDefaultElementProps already folded props.action into on.
      hydrated: {
        type: 'Button',
        props: { label: 'Run', action: 'runScenario' },
        on: { runScenario: { action: 'runScenario', params: { scenario: 'best-case' } } },
      },
      // Pre-hydration shape: only props.action declares the intent.
      raw: { type: 'Button', props: { label: 'Compare', action: 'compareScenarios' } },
    },
  }

  it('collectDeclaredVizualActions sees both on-bindings and raw props.action', () => {
    const actions = collectDeclaredVizualActions(customActionSpec as never)
    expect(actions).toContain('runScenario')
    expect(actions).toContain('compareScenarios')
  })

  it('a declared custom action with no local handler still reaches onAction', async () => {
    const seen: VizualAction[] = []
    const wrapped = wrapActionHandlersWithOnAction({}, {
      onAction: a => { seen.push(a) },
      surfaceId: 's1',
      spec: customActionSpec as never,
      now: () => 'T',
    })
    expect(wrapped.runScenario).toBeTypeOf('function')
    await wrapped.runScenario({ scenario: 'best-case' })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ type: 'runScenario', surfaceId: 's1', params: { scenario: 'best-case' }, timestamp: 'T' })
  })

  it('a declared custom action round-trips through the host bridge to sendToAgent', async () => {
    const sent: Array<{ message: string; action: VizualAction }> = []
    const bridge = createVizualHostBridge({
      surfaceId: 's1',
      sendToAgent: (message, action) => { sent.push({ message, action }) },
    })
    const wrapped = wrapActionHandlersWithOnAction({}, {
      onAction: bridge.onAction,
      surfaceId: 's1',
      spec: customActionSpec as never,
    })
    await wrapped.runScenario({ scenario: 'best-case' })
    expect(sent).toHaveLength(1)
    expect(sent[0].action.type).toBe('runScenario')
    expect(sent[0].message).toContain('runScenario')
  })

  it('a registered local handler is never replaced by the fallback', async () => {
    const order: string[] = []
    const wrapped = wrapActionHandlersWithOnAction(
      { runScenario: () => { order.push('handler') } },
      { onAction: () => { order.push('onAction') }, spec: customActionSpec as never },
    )
    await wrapped.runScenario({})
    expect(order).toEqual(['handler', 'onAction'])
  })

  it('every action the interactivity summary reports is actually dispatchable', () => {
    const summary = summarizeVizualInteractivity(customActionSpec as never)
    const wrapped = wrapActionHandlersWithOnAction({}, {
      onAction: () => undefined,
      spec: customActionSpec as never,
    })
    expect(summary.agentRoundtrip).toBe(true)
    for (const action of summary.actions) {
      expect(wrapped[action], `summary reports "${action}" but no handler can dispatch it`).toBeTypeOf('function')
    }
  })
})

describe('summarizeVizualInteractivity — Interactive + Roundtrip tiers', () => {
  it('reports a FormBuilder surface as interactive with a roundtrip action after normalization', () => {
    const preview = previewVizualNativeInput(formSpec as never, { requireRenderable: true })
    const summary = summarizeVizualInteractivity(preview.spec)
    expect(summary.interactive).toBe(true)
    expect(summary.agentRoundtrip).toBe(true)
    expect(summary.actions).toContain('submitForm')
    expect(summary.deadControls).toEqual([])
  })

  it('reports a chart-only surface as a non-control (no input controls), drill-down capable', () => {
    const preview = previewVizualNativeInput({
      root: 'r', elements: { r: { type: 'BarChart', props: { x: 'n', y: 'v', data: [{ n: 'A', v: 1 }] } } },
    } as never, { requireRenderable: true })
    const summary = summarizeVizualInteractivity(preview.spec)
    // Charts are not input controls...
    expect(summary.interactive).toBe(false)
    expect(summary.deadControls).toEqual([])
    // ...but the auto-wire makes a point click a drill-down roundtrip.
    expect(summary.actions).toContain('drillDown')
  })

  it('reports a static text surface as fully non-interactive', () => {
    const preview = previewVizualNativeInput({
      root: 'r', elements: { r: { type: 'Markdown', props: { content: '# Hi' } } },
    } as never, { requireRenderable: true })
    const summary = summarizeVizualInteractivity(preview.spec)
    expect(summary.interactive).toBe(false)
    expect(summary.agentRoundtrip).toBe(false)
    expect(summary.actions).toEqual([])
  })
})
