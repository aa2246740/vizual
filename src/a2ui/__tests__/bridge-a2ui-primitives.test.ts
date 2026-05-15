import { describe, it, expect } from 'vitest'
import { A2UIBridge } from '../bridge'

describe('A2UI Bridge — A2UI primitives integration', () => {
  it('renders FreeformHtml via A2UI messages', () => {
    const bridge = new A2UIBridge()
    bridge.processMessage({ version: 'v0.10', createSurface: { surfaceId: 's1', catalogId: 'vizual' } })
    const spec = bridge.processMessage({
      version: 'v0.10',
      updateComponents: {
        surfaceId: 's1',
        components: [{
          id: 'root',
          component: 'FreeformHtml',
          html: '<div style="display:grid; grid-template-columns:1fr 1fr;"><section><h2>Card 1</h2></section><section><h2>Card 2</h2></section></div>',
        }],
      },
    })
    expect(spec).toBeTruthy()
    expect(spec!.elements!.root.type).toBe('FreeformHtml')
    expect(spec!.elements!.root.props.html).toContain('Card 1')
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
    expect(spec!.elements!.root.type).toBe('Row')
    expect(spec!.elements!.root.children).toEqual(['card1', 'card2'])
    expect(spec!.elements!.card1.type).toBe('Card')
    expect(spec!.elements!.text1.props.content).toBe('Card One')
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
    expect(spec!.elements!.root.type).toBe('Column')
    expect(spec!.elements!.chart.type).toBe('BarChart')
    expect(spec!.elements!.list.type).toBe('List')
  })

  it('renders a personal dashboard with FreeformHtml + data model binding', () => {
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
          component: 'FreeformHtml',
          html: '<div style="padding:24px; font-family:var(--rk-font-sans);"><h1 style="color:var(--rk-accent);">Good morning!</h1><p>Your daily briefing is ready.</p><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;"><section style="background:var(--rk-bg-secondary); border-radius:12px; padding:16px;"><h3>Tasks</h3><p>5 pending</p></section><section style="background:var(--rk-bg-secondary); border-radius:12px; padding:16px;"><h3>Messages</h3><p>3 unread</p></section><section style="background:var(--rk-bg-secondary); border-radius:12px; padding:16px;"><h3>Calendar</h3><p>2 events</p></section></div></div>',
        }],
      },
    })
    expect(spec).toBeTruthy()
    expect(spec!.elements!.root.type).toBe('FreeformHtml')
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
    expect(spec!.elements!.root.children).toEqual(['text1', 'text2'])
    expect(spec!.elements!.text2.props.content).toBe('World')
    // text1 still exists from first update
    expect(spec!.elements!.text1.props.content).toBe('Hello')
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
    expect(spec!.elements!.root.children).toEqual(['left', 'right'])
    expect(spec!.elements!.left.children).toEqual(['t1'])
    expect(spec!.elements!.right.children).toEqual(['t2'])
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
    expect(spec!.elements!.name.type).toBe('TextField')
    expect(spec!.elements!.email.props.type).toBe('email')
    expect(spec!.elements!.agree.type).toBe('CheckBox')
    expect(spec!.elements!.submit.type).toBe('Button')
  })

  it('supports A2UI error recovery on new components', () => {
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
})
