import { describe, expect, it, vi } from 'vitest'
import { VizualFusionRuntime, a2uiMessagesToVizualSnapshot } from './runtime'

describe('VizualFusionRuntime', () => {
  it('ingests A2UI messages and emits Vizual spec plus artifact snapshot', () => {
    const onSurfaceChange = vi.fn()
    const runtime = new VizualFusionRuntime({ onSurfaceChange })

    const snapshot = runtime.processA2UIMessages([
      { version: 'v0.10', createSurface: { surfaceId: 'sales', catalogId: 'vizual', theme: { mode: 'dark' } } },
      { version: 'v0.10', updateDataModel: { surfaceId: 'sales', path: '/', value: { rows: [{ m: 'Jan', v: 12 }] } } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'sales',
          components: [
            { id: 'root', component: 'Column', children: ['title', 'chart'] },
            { id: 'title', component: 'Text', text: '销售趋势' },
            { id: 'chart', component: 'BarChart', x: 'm', y: 'v', data: { path: '/rows' } },
          ],
        },
      },
    ])

    expect(snapshot).toBeTruthy()
    expect(snapshot!.spec.elements!.root.type).toBe('Column')
    expect(snapshot!.spec.elements!.title.props).toMatchObject({ text: '销售趋势' })
    expect(snapshot!.spec.elements!.chart.props!.data).toEqual([{ m: 'Jan', v: 12 }])
    expect(snapshot!.artifact.metadata).toMatchObject({ runtime: 'vizual-native-core', catalogId: 'vizual' })
    expect(snapshot!.artifact.targetMap.some(target => target.elementId === 'chart')).toBe(true)
    expect(onSurfaceChange).toHaveBeenCalled()
  })

  it('ingests AG-UI activity snapshots carrying a2ui_operations', () => {
    const runtime = new VizualFusionRuntime()
    const snapshot = runtime.processAGUIEvent({
      type: 'ACTIVITY_SNAPSHOT',
      messageId: 'activity-1',
      activityType: 'a2ui-surface',
      replace: true,
      content: {
        a2ui_operations: [
          { version: 'v0.10', createSurface: { surfaceId: 'agui', catalogId: 'vizual' } },
          { version: 'v0.10', updateDataModel: { surfaceId: 'agui', path: '/headline', value: 'AG-UI 已接入' } },
          {
            version: 'v0.10',
            updateComponents: {
              surfaceId: 'agui',
              components: [
                { id: 'root', component: 'Card', child: 'title' },
                { id: 'title', component: 'Text', path: '/headline' },
              ],
            },
          },
        ],
      },
    })

    expect(snapshot!.surfaceId).toBe('agui')
    expect(runtime.getEventLog()).toHaveLength(1)
    expect(snapshot!.spec.elements!.title.props).toMatchObject({ value: 'AG-UI 已接入' })
  })

  it('unwraps agent payload.data for typed updateDataModel messages', () => {
    const runtime = new VizualFusionRuntime()
    const snapshot = runtime.processA2UIMessages([
      { type: 'createSurface', version: 'v0.10', payload: { id: 'payload-data', catalogId: 'vizual' } } as any,
      {
        type: 'updateDataModel',
        version: 'v0.10',
        payload: {
          data: {
            rows: [{ day: 'D1', value: 10 }],
            title: 'payload data title',
          },
        },
      } as any,
      {
        type: 'updateComponents',
        version: 'v0.10',
        payload: {
          surfaceId: 'payload-data',
          components: [
            { id: 'root', component: 'Column', children: ['title', 'table'] },
            { id: 'title', component: 'Text', path: '/title' },
            { id: 'table', component: 'DataTable', columns: ['day', 'value'], data: { path: '/rows' } },
          ],
        },
      } as any,
    ])

    expect(snapshot!.dataModel).toMatchObject({
      rows: [{ day: 'D1', value: 10 }],
      title: 'payload data title',
    })
    expect(snapshot!.spec.elements!.title.props).toMatchObject({ value: 'payload data title' })
    expect(snapshot!.spec.elements!.table.props!.data).toEqual([{ day: 'D1', value: 10 }])
  })

  it('routes loose typed A2UI messages through process() before generic AG-UI handling', () => {
    const runtime = new VizualFusionRuntime()
    runtime.process({ type: 'createSurface', version: 'v0.10', payload: { id: 'loose', catalogId: 'vizual' } } as any)
    const snapshot = runtime.process({
      type: 'updateComponents',
      version: 'v0.10',
      payload: {
        surfaceId: 'loose',
        components: [{ id: 'root', component: 'Text', content: 'loose A2UI rendered' }],
      },
    } as any)

    expect(snapshot!.surfaceId).toBe('loose')
    expect(snapshot!.spec.elements!.root.props).toMatchObject({ content: 'loose A2UI rendered' })
  })

  it('resolves data model paths through arrays', () => {
    const runtime = new VizualFusionRuntime()
    const snapshot = runtime.processA2UIMessages([
      { version: 'v0.10', createSurface: { surfaceId: 'array-path', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'array-path',
          path: '/',
          value: { sections: [{ rows: [{ channel: '自然搜索', value: 1 }] }] },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'array-path',
          components: [
            { id: 'root', component: 'DataTable', columns: ['channel', 'value'], data: { path: '/sections/0/rows' } },
          ],
        },
      },
    ])

    expect(snapshot!.spec.elements!.root.props!.data).toEqual([{ channel: '自然搜索', value: 1 }])
  })

  it('updates nested data model paths through existing arrays', () => {
    const runtime = new VizualFusionRuntime()
    const snapshot = runtime.processA2UIMessages([
      { version: 'v0.10', createSurface: { surfaceId: 'array-write', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'array-write',
          path: '/',
          value: { report: { sections: [{ title: 'A' }, { title: 'B', rows: [] }] } },
        },
      },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'array-write',
          path: '/report/sections/1/rows',
          value: [{ channel: '付费广告', value: 42 }],
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'array-write',
          components: [
            { id: 'root', component: 'DataTable', columns: ['channel', 'value'], data: { path: '/report/sections/1/rows' } },
          ],
        },
      },
    ])

    expect(Array.isArray((snapshot!.dataModel.report as any).sections)).toBe(true)
    expect(snapshot!.spec.elements!.root.props!.data).toEqual([{ channel: '付费广告', value: 42 }])
  })

  it('applies AG-UI activity deltas without replacing the surface with hidden defaults', () => {
    const runtime = new VizualFusionRuntime()
    runtime.processAGUIEvent({
      type: 'ACTIVITY_SNAPSHOT',
      messageId: 'activity-1',
      activityType: 'a2ui-surface',
      content: {
        a2ui_operations: [
          { version: 'v0.10', createSurface: { surfaceId: 'delta', catalogId: 'vizual' } },
          {
            version: 'v0.10',
            updateComponents: {
              surfaceId: 'delta',
              components: [
                { id: 'root', component: 'Column', children: ['title'] },
                { id: 'title', component: 'Text', content: 'v1' },
              ],
            },
          },
        ],
      },
    })

    const snapshot = runtime.processAGUIEvent({
      type: 'ACTIVITY_DELTA',
      messageId: 'activity-1',
      activityType: 'a2ui-surface',
      patch: [
        {
          op: 'add',
          path: '/a2ui_operations/-',
          value: {
            version: 'v0.10',
            updateComponents: {
              surfaceId: 'delta',
              components: [
                { id: 'root', component: 'Column', children: ['title', 'subtitle'] },
                { id: 'subtitle', component: 'Text', content: 'v2' },
              ],
            },
          },
        },
      ],
    })

    expect(snapshot!.spec.elements!.root.children).toEqual(['title', 'subtitle'])
    expect(snapshot!.spec.elements!.subtitle.props).toMatchObject({ content: 'v2' })
    expect(runtime.getArtifact('delta')!.metadata).toMatchObject({ runtime: 'vizual-native-core' })
  })

  it('ingests AG-UI tool call results carrying JSON encoded A2UI operations', () => {
    const runtime = new VizualFusionRuntime()
    const snapshot = runtime.processAGUIEvent({
      type: 'TOOL_CALL_RESULT',
      toolCallId: 'tool-1',
      content: JSON.stringify({
        a2ui_operations: [
          { version: 'v0.10', createSurface: { surfaceId: 'tool', catalogId: 'vizual' } },
          { version: 'v0.10', updateComponents: { surfaceId: 'tool', components: [{ id: 'root', component: 'Text', content: 'tool result rendered' }] } },
        ],
      }),
    })

    expect(snapshot!.surfaceId).toBe('tool')
    expect(snapshot!.spec.elements!.root.props).toMatchObject({ content: 'tool result rendered' })
  })

  it('routes Vizual actions as A2UI user actions', () => {
    const actions: unknown[] = []
    const runtime = new VizualFusionRuntime({ onAction: action => actions.push(action) })
    runtime.processA2UIMessages([
      { version: 'v0.10', createSurface: { surfaceId: 'form', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'form',
          components: [
            { id: 'root', component: 'Button', text: '提交', action: { event: { name: 'submit' } } },
          ],
        },
      },
    ])

    const action = runtime.createActionFromVizual('submit', 'form', { _sourceComponentId: 'root', value: 1 })
    expect(action).toMatchObject({ name: 'submit', surfaceId: 'form', sourceComponentId: 'root' })
    expect(actions).toHaveLength(1)
  })

  it('records visual QA findings as first-class runtime evidence', () => {
    const runtime = new VizualFusionRuntime()
    const finding = runtime.reportQualityFinding({
      surfaceId: 'qa',
      severity: 'error',
      code: 'blank-render',
      message: 'Rendered surface has no visible content.',
      evidence: { visibleTextLength: 0 },
    })

    expect(finding.id).toBeTruthy()
    expect(runtime.getQualityFindings()[0]).toMatchObject({
      surfaceId: 'qa',
      severity: 'error',
      code: 'blank-render',
    })
  })

  it('keeps a compatibility helper for one-shot A2UI conversion', () => {
    const snapshot = a2uiMessagesToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'helper', catalogId: 'vizual' } },
      { version: 'v0.10', updateComponents: { surfaceId: 'helper', components: [{ id: 'root', component: 'Text', content: 'ok' }] } },
    ])

    expect(snapshot!.spec.elements!.root.props).toMatchObject({ content: 'ok' })
  })
})
