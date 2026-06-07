import { describe, it, expect, vi } from 'vitest'
import { A2UIBridge } from '../bridge'

describe('A2UI Bridge — A2UI primitives integration', () => {
  it('renders Markdown via A2UI messages', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{
          id: 'root',
          component: 'Markdown',
          content: '## Card 1\n\n## Card 2',
        }],
      },
    })
    expect(spec).toBeTruthy()
    expect(spec!.elements!.root!.type).toBe('Markdown')
    expect(spec!.elements!.root!.props!.content).toContain('Card 1')
  })

  it('renders Row + Card + Text composition via A2UI', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Row', gap: 16, children: ['card1', 'card2'] },
          { id: 'card1', component: 'Card', padding: 16, children: ['text1'] },
          { id: 'text1', component: 'Text', content: 'Card One' },
          { id: 'card2', component: 'Card', padding: 16, children: ['text2'] },
          { id: 'text2', component: 'Text', content: 'Card Two' },
        ],
      },
    })
    expect(spec).toBeTruthy()
    expect(spec!.elements!.root!.type).toBe('Row')
    expect(spec!.elements!.root!.children).toEqual(['card1', 'card2'])
    expect(spec!.elements!.card1!.type).toBe('Card')
    expect(spec!.elements!.text1!.props!.content).toBe('Card One')
  })

  it('renders Column with mixed A2UI + Vizual components', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Column', gap: 16, children: ['title', 'chart', 'list'] },
          { id: 'title', component: 'Text', content: 'Sales Report', variant: 'heading' },
          { id: 'chart', component: 'BarChart', x: 'month', y: 'revenue', data: [{ month: 'Jan', revenue: 100 }] },
          { id: 'list', component: 'List', items: ['Q1: up 15%', 'Q2: up 22%'] },
        ],
      },
    })
    expect(spec!.elements!.root!.type).toBe('Column')
    expect(spec!.elements!.chart!.type).toBe('BarChart')
    expect(spec!.elements!.list!.type).toBe('List')
  })

  it('normalizes common agent-emitted A2UI type/props wrappers', () => {
    const bridge = new A2UIBridge()
    const spec = bridge.processMessages([
      { type: 'createSurface', version: 'v0.10', catalogId: 'vizual', payload: { id: 'agent-surface' } } as any,
      {
        type: 'updateDataModel',
        version: 'v0.10',
        payload: {
          '/rows': [{ day: 'D1', value: 10 }, { day: 'D2', value: 20 }],
          '/metrics': [{ label: '新增', value: 30 }],
          '/headline': '增长诊断路径标题',
          '/options': [{ label: '渠道', value: 'channel' }],
          '/selected': 'channel',
          '/buttonText': '生成增长诊断',
        },
      } as any,
      {
        type: 'updateComponents',
        version: 'v0.10',
        payload: {
          components: [
            { id: 'root', type: 'Column', props: { children: ['title', 'headline', 'kpi', 'table', 'picker', 'button'] } },
            { id: 'title', type: 'Text', props: { text: '增长诊断', variant: 'h2', colSpan: 12 } },
            { id: 'headline', type: 'Text', props: { path: '/headline', colSpan: 12 } },
            { id: 'kpi', type: 'KpiDashboard', props: { colSpan: 12, metrics: { path: '/metrics' } } },
            { id: 'table', type: 'DataTable', props: { colSpan: 12, columns: ['day', 'value'], data: { path: '/rows' } } },
            { id: 'picker', type: 'ChoicePicker', props: { path: '/selected', optionsPath: '/options' } },
            { id: 'button', type: 'Button', props: { textPath: '/buttonText' } },
          ],
        },
      } as any,
    ])

    expect(spec).toBeTruthy()
    expect(spec!.root).toBe('root')
    expect(spec!.state!.rows).toHaveLength(2)
    expect(spec!.elements!.root!.type).toBe('Column')
    expect(spec!.elements!.root!.children).toEqual(['title', 'headline', 'kpi', 'table', 'picker', 'button'])
    expect(spec!.elements!.title!.props).toMatchObject({ text: '增长诊断', variant: 'h2', colSpan: 12 })
    expect(spec!.elements!.headline!.props).toMatchObject({ value: '增长诊断路径标题' })
    expect(spec!.elements!.table!.props!.columns).toEqual(['day', 'value'])
    expect(spec!.elements!.picker!.props).toMatchObject({
      value: 'channel',
      options: [{ label: '渠道', value: 'channel' }],
    })
    expect(spec!.elements!.button!.props).toMatchObject({ text: '生成增长诊断' })
  })

  it('renders a personal dashboard with Markdown + data model binding', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    bridge.processMessage({
      version: 'v0.10',
      updateDataModel: {
        surfaceId: 's1',
        path: '/userName',
        value: 'Alice',
      },
    })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{
          id: 'root',
          component: 'Markdown',
          content: '# Good morning!\n\nYour daily briefing is ready.\n\n- Tasks: 5 pending\n- Messages: 3 unread\n- Calendar: 2 events',
        }],
      },
    })
    expect(spec).toBeTruthy()
    expect(spec!.elements!.root!.type).toBe('Markdown')
    expect(spec!.state!.userName).toBe('Alice')
  })

  it('handles incremental component updates', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    // First update: add root + text
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Column', gap: 8, children: ['text1'] },
          { id: 'text1', component: 'Text', content: 'Hello' },
        ],
      },
    })
    // Second update: add more children
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Column', gap: 8, children: ['text1', 'text2'] },
          { id: 'text2', component: 'Text', content: 'World' },
        ],
      },
    })
    expect(spec!.elements!.root!.children).toEqual(['text1', 'text2'])
    expect(spec!.elements!.text2!.props!.content).toBe('World')
    // text1 still exists from first update
    expect(spec!.elements!.text1!.props!.content).toBe('Hello')
  })

  it('no more resolveNamedSlots — layout components use standard children', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Row', gap: 16, children: ['left', 'right'] },
          { id: 'left', component: 'Card', children: ['t1'] },
          { id: 'right', component: 'Card', children: ['t2'] },
          { id: 't1', component: 'Text', content: 'Left panel' },
          { id: 't2', component: 'Text', content: 'Right panel' },
        ],
      },
    })
    // Standard children — no special slot mapping
    expect(spec!.elements!.root!.children).toEqual(['left', 'right'])
    expect(spec!.elements!.left!.children).toEqual(['t1'])
    expect(spec!.elements!.right!.children).toEqual(['t2'])
  })

  it('renders Button with action callback setup', () => {
    const bridge = new A2UIBridge()
    let capturedAction: any = null
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Card', padding: 16, children: ['btn'] },
          { id: 'btn', component: 'Button', label: 'Submit', action: 'doSubmit', variant: 'primary' },
        ],
      },
    })
    const action = bridge.createActionFromVizual('doSubmit', 's1', { _sourceComponentId: 'btn' })
    expect(action.name).toBe('doSubmit')
    expect(action.surfaceId).toBe('s1')
    expect(action.sourceComponentId).toBe('btn')
  })

  it('renders input components via A2UI', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Column', gap: 12, children: ['name', 'email', 'agree', 'submit'] },
          { id: 'name', component: 'TextField', label: 'Name', placeholder: 'Enter name' },
          { id: 'email', component: 'TextField', label: 'Email', type: 'email' },
          { id: 'agree', component: 'CheckBox', label: 'I agree', checked: false },
          { id: 'submit', component: 'Button', label: 'Submit', variant: 'primary' },
        ],
      },
    })
    expect(spec!.elements!.name!.type).toBe('TextField')
    expect(spec!.elements!.email!.props!.type).toBe('email')
    expect(spec!.elements!.agree!.type).toBe('CheckBox')
    expect(spec!.elements!.submit!.type).toBe('Button')
  })

  it('treats repeated createSurface for the same catalog as idempotent', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual', theme: { mode: 'light' } } })
    bridge.processMessage({
      version: 'v0.10',
      updateDataModel: { surfaceId: 's1', path: '/userName', value: 'Alice' },
    })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'root', component: 'Text', content: 'Preserved content' }],
      },
    })

    const spec = bridge.processMessage({
      version: 'v0.10',
      createSurface: { surfaceId: 's1', catalogId: 'vizual', theme: { accent: '#2563eb' } },
    })

    expect(spec!.elements!.root!.props!.content).toBe('Preserved content')
    expect(spec!.state!.userName).toBe('Alice')
    expect(spec!.state!._a2uiTheme).toEqual({ mode: 'light', accent: '#2563eb' })
  })

  it('rejects repeated createSurface for a different catalog without erasing content', () => {
    const errors: any[] = []
    const bridge = new A2UIBridge({ onError: error => errors.push(error) })
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'root', component: 'Text', content: 'Keep me' }],
      },
    })

    const spec = bridge.processMessage({
      version: 'v0.10',
      createSurface: { surfaceId: 's1', catalogId: 'other-catalog' },
    })

    expect(spec!.elements!.root!.props!.content).toBe('Keep me')
    expect(errors).toHaveLength(1)
    expect(errors[0].phase).toBe('create')
    expect(errors[0].message).toContain('already exists')
  })

  it('accepts standard v0.10 function/action messages without mutating surface state', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'root', component: 'Text', content: 'Stable state' }],
      },
    })

    expect(bridge.processMessage({
      version: 'v0.10',
      callFunction: { surfaceId: 's1', functionName: 'lookupMetric', arguments: { id: 1 } },
      functionCallId: 'fn-1',
    })).toBeNull()
    expect(bridge.processMessage({
      version: 'v0.10',
      actionResponse: { surfaceId: 's1', status: 'success', result: { ok: true } },
      actionId: 'action-1',
    })).toBeNull()

    const spec = bridge.getSpec('s1')
    expect(spec!.elements!.root!.props!.content).toBe('Stable state')
  })

  it('handles A2UI deleteSurface and updateTheme lifecycle messages', () => {
    const deleted: string[] = []
    const bridge = new A2UIBridge({ onSurfaceDelete: surfaceId => deleted.push(surfaceId) })
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual', theme: { mode: 'light' } } })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'root', component: 'Text', content: 'Themed content' }],
      },
    })
    const themed = bridge.processMessage({
      version: 'v0.10',
      updateTheme: { surfaceId: 's1', theme: { accent: '#2563eb' } },
    })

    expect(themed!.state!._a2uiTheme).toEqual({ mode: 'light', accent: '#2563eb' })
    expect(bridge.getTheme('s1')).toEqual({ mode: 'light', accent: '#2563eb' })

    const deletedSnapshot = bridge.processMessage({
      version: 'v0.10',
      deleteSurface: { surfaceId: 's1' },
    })

    expect(deletedSnapshot).toBeNull()
    expect(bridge.hasSurface('s1')).toBe(false)
    expect(bridge.getSpec('s1')).toBeNull()
    expect(deleted).toEqual(['s1'])
  })

  it('supports Vizual extension error recovery on new components', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: { surfaceId: 's1', components: [{ id: 'root', component: 'Text', content: 'Hello' }] },
    })
    // Reset via error recovery
    const resetSpec = bridge.processMessage({
      version: 'v0.10',
      errorRecovery: { surfaceId: 's1', action: 'reset' },
    })
    expect(resetSpec).toBeTruthy()
    expect(Object.keys(resetSpec!.elements!)).toHaveLength(0)
  })

  it('supports Vizual extension fallback recovery with an explicit replacement spec', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    bridge.processMessage({
      version: 'v0.10',
      updateComponents: { surfaceId: 's1', components: [{ id: 'root', component: 'Text', content: 'Broken content' }] },
    })

    const fallback = bridge.processMessage({
      version: 'v0.10',
      errorRecovery: {
        surfaceId: 's1',
        action: 'fallback',
        payload: {
          root: 'root',
          elements: {
            root: { type: 'Text', props: { content: 'Fallback content' } },
          },
        },
      },
    })

    expect(fallback!.elements!.root!.props!.content).toBe('Fallback content')
  })

  it('normalizes loose updateTheme and errorRecovery payload wrappers from agents', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ type: 'createSurface', version: 'v0.10', payload: { id: 'loose-ext', catalogId: 'vizual' } } as any)
    bridge.processMessage({
      type: 'updateComponents',
      version: 'v0.10',
      payload: {
        surfaceId: 'loose-ext',
        components: [{ id: 'root', component: 'Text', content: 'Loose extension before fallback' }],
      },
    } as any)

    const themed = bridge.processMessage({
      type: 'updateTheme',
      version: 'v0.10',
      payload: { surfaceId: 'loose-ext', theme: { mode: 'dark', accent: '#0f766e' } },
    } as any)
    expect(themed!.state!._a2uiTheme).toEqual({ mode: 'dark', accent: '#0f766e' })

    const fallback = bridge.processMessage({
      type: 'errorRecovery',
      version: 'v0.10',
      payload: {
        surfaceId: 'loose-ext',
        action: 'fallback',
        payload: {
          root: 'root',
          elements: {
            root: { type: 'Text', props: { content: 'Loose wrapper fallback' } },
          },
        },
      },
    } as any)

    expect(fallback!.elements!.root!.props!.content).toBe('Loose wrapper fallback')
  })

  it('keeps thin bridge SDK helpers backed by the native runtime state', () => {
    const onChange = vi.fn()
    const bridge = new A2UIBridge({ onChange })

    bridge.processMessages([
      { version: 'v0.10', createSurface: { surfaceId: 'sdk', catalogId: 'vizual' } },
      { version: 'v0.10', updateDataModel: { surfaceId: 'sdk', path: '/', value: { label: 'before' } } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'sdk',
          components: [{ id: 'root', component: 'Text', text: { path: '/label' } }],
        },
      },
    ])

    expect(bridge.getSurfaceIds()).toEqual(['sdk'])
    expect(bridge.hasSurface('sdk')).toBe(true)
    expect(bridge.getDataModel('sdk')).toEqual({ label: 'before' })
    expect(bridge.getSpec('sdk')!.elements!.root!.props).toMatchObject({ text: 'before' })
    expect(bridge.getArtifact('sdk')!.metadata).toMatchObject({ runtime: 'vizual-native-core' })
    expect(onChange).toHaveBeenCalledWith('sdk', expect.objectContaining({ root: 'root' }))

    const updated = bridge.updateSurfaceDataModel('sdk', '/label', 'after')
    expect(updated!.elements!.root!.props).toMatchObject({ text: 'after' })

    const actions: string[] = []
    const unsubscribe = bridge.onAction(action => actions.push(action.name))
    bridge.createActionFromVizual('first', 'sdk', {})
    unsubscribe()
    bridge.createActionFromVizual('second', 'sdk', {})
    expect(actions).toEqual(['first'])

    const reset = bridge.resetSurface('sdk')
    expect(reset).toEqual({ root: 'root', elements: {}, state: {} })
  })
})
