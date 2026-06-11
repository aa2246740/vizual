import { describe, expect, it, vi } from 'vitest'
import { buildBarFallback } from '../charts/bar-chart/component'
import { withDefaultElementProps } from '../core/spec-validation'
import { VizualNativeCore, nativeInputsToVizualSnapshot } from './core'
import { normalizeVizualNativeInput } from './normalize'
import { previewVizualNativeInput } from './preview'
import { validateVizualNativeInput } from './validate'
import type { VizualNativeOperation } from './types'

describe('VizualNativeCore', () => {
  it('processes A2UI and AG-UI inputs through the same native operation log', () => {
    const core = new VizualNativeCore()

    core.dispatch([
      { version: 'v0.10', createSurface: { surfaceId: 'native', catalogId: 'vizual' } },
      { version: 'v0.10', updateDataModel: { surfaceId: 'native', path: '/title', value: '统一核心' } },
    ] as any)
    const snapshot = core.dispatch({
      type: 'ACTIVITY_SNAPSHOT',
      messageId: 'activity-1',
      activityType: 'a2ui-surface',
      content: {
        a2ui_operations: [
          {
            version: 'v0.10',
            updateComponents: {
              surfaceId: 'native',
              components: [
                { id: 'root', component: 'Card', child: 'title' },
                { id: 'title', component: 'Text', path: '/title' },
              ],
            },
          },
        ],
      },
    })

    expect(snapshot!.artifact.metadata).toMatchObject({ runtime: 'vizual-native-core' })
    expect(snapshot!.spec.elements!.title.props).toMatchObject({ value: '统一核心' })
    expect(core.getNativeOperationLog().map(operation => operation.type)).toEqual([
      'surface.create',
      'surface.updateData',
      'surface.updateComponents',
    ] as any)
  })

  it('keeps public SDK entrypoints, getters, callbacks, and unsubscribe wired to the native reducer', () => {
    const onSurfaceChange = vi.fn()
    const onSpecChange = vi.fn()
    const onArtifactChange = vi.fn()
    const core = new VizualNativeCore({ onSurfaceChange, onSpecChange, onArtifactChange })

    const direct = core.dispatchAll([
      { type: 'surface.create', surfaceId: 'api', catalogId: 'vizual' },
      { type: 'surface.updateData', surfaceId: 'api', path: '/', value: { label: 'ready' } },
      {
        type: 'surface.updateComponents',
        surfaceId: 'api',
        components: [{ id: 'root', component: 'Text', text: { path: '/label' } }],
      },
    ] satisfies VizualNativeOperation[])

    expect(direct!.surfaceId).toBe('api')
    expect(core.hasSurface('api')).toBe(true)
    expect(core.getSpec('api')?.elements?.root?.props?.text).toBe('ready')
    expect(withDefaultElementProps(core.getSpec('api')!).elements!.root.props!.content).toBe('ready')
    expect(core.getDataModel('api')).toEqual({ label: 'ready' })
    expect(core.getArtifact('api')?.metadata).toMatchObject({ runtime: 'vizual-native-core' })
    expect(onSurfaceChange).toHaveBeenCalledWith(expect.objectContaining({ surfaceId: 'api' }))
    expect(onSpecChange).toHaveBeenCalledWith('api', expect.objectContaining({ root: 'root' }))
    expect(onArtifactChange).toHaveBeenCalledWith('api', expect.objectContaining({ id: 'vizual-surface-api' }))

    const updated = core.updateSurfaceDataModel('api', '/label', 'updated')
    expect(updated!.dataModel).toEqual({ label: 'updated' })
    expect(core.getSpec('api')?.elements?.root?.props?.text).toBe('updated')

    const reset = core.resetSurface('api')
    expect(reset!.spec).toEqual({ root: 'root', elements: {}, state: {} })

    const a2ui = new VizualNativeCore()
    a2ui.processA2UIMessage({ version: 'v0.10', createSurface: { surfaceId: 'single', catalogId: 'vizual' } })
    const a2uiSnapshot = a2ui.processA2UIMessages([
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'single',
          components: [{ id: 'root', component: 'Text', text: 'single message path' }],
        },
      },
    ])
    expect(a2uiSnapshot!.spec.elements!.root.props).toEqual({ text: 'single message path' })
    expect(withDefaultElementProps(a2uiSnapshot!.spec).elements!.root.props!.content).toBe('single message path')

    const agui = new VizualNativeCore()
    const toolArgs = JSON.stringify({
      surfaceId: 'tool-surface',
      data: { title: 'tool args' },
      components: [
        { id: 'root', component: 'Text', text: { path: '/title' } },
      ],
    })
    const aguiSnapshot = agui.processAGUIEvents([
      { type: 'TOOL_CALL_START', toolCallId: 'tool-1', toolCallName: 'render_ui' },
      { type: 'TOOL_CALL_ARGS', toolCallId: 'tool-1', delta: toolArgs },
      { type: 'TOOL_CALL_END', toolCallId: 'tool-1' },
    ])
    expect(aguiSnapshot!.surfaceId).toBe('tool-surface')
    expect(agui.getFunctionCalls()).toEqual([
      expect.objectContaining({ id: 'tool-1', functionName: 'render_ui', status: 'pending' }),
    ])

    const specSnapshot = agui.processVizualSpec('spec-api', {
      root: 'root',
      state: { value: 7 },
      elements: {
        root: { type: 'Text', props: { value: { path: '/value' } } },
      },
    }, 'vizual')
    expect(specSnapshot.dataModel).toEqual({ value: 7 })
    expect(agui.getSpec('spec-api')?.root).toBe('root')

    const actions: string[] = []
    const unsubscribe = agui.onAction(action => actions.push(action.name))
    agui.createActionFromVizual('first', 'spec-api', {})
    unsubscribe()
    agui.createActionFromVizual('second', 'spec-api', {})
    expect(actions).toEqual(['first'])

    const processed = agui.process({
      type: 'surface.updateData',
      surfaceId: 'spec-api',
      path: '/value',
      value: 9,
    } satisfies VizualNativeOperation)
    expect(processed!.dataModel).toEqual({ value: 9 })
  })

  it('natively appends data model strings, arrays, and objects', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'append', catalogId: 'vizual' } },
      { version: 'v0.10', updateDataModel: { surfaceId: 'append', path: '/', value: { text: 'A', rows: [{ id: 1 }], meta: { a: 1 }, status: 'draft' } } },
      { version: 'v0.10', appendDataModel: { surfaceId: 'append', path: '/', value: { extra: true } } },
      { version: 'v0.10', appendDataModel: { surfaceId: 'append', path: '/text', value: 'B' } },
      { version: 'v0.10', appendDataModel: { surfaceId: 'append', path: '/rows', value: [{ id: 2 }] } },
      { version: 'v0.10', appendDataModel: { surfaceId: 'append', path: '/meta', value: { b: 2 } } },
      { version: 'v0.10', appendDataModel: { surfaceId: 'append', path: '/status', value: { label: 'ready' } } },
    ])

    expect(snapshot!.dataModel).toEqual({
      text: 'AB',
      rows: [{ id: 1 }, { id: 2 }],
      meta: { a: 1, b: 2 },
      extra: true,
      status: { label: 'ready' },
    })
  })

  it('normalizes nested state paths and dynamic typed values from concise agent hints', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'dynamic-values', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'dynamic-values',
          path: '/',
          value: {
            '/matrix/0/name': '官网',
            title: '经营复盘',
          },
        },
      },
      { version: 'v0.10', updateDataModel: { surfaceId: 'dynamic-values', path: '/form/0/owner', value: '增长组' } },
      { version: 'v0.10', appendDataModel: { surfaceId: 'dynamic-values', path: '/newObject', value: { created: true } } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'dynamic-values',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['title', 'missing', 'literalNumber', 'literalInt', 'literalBoolean', 'literalBool', 'valueString', 'valueInt', 'valueDouble', 'valueBool', 'callObject'],
            },
            { id: 'title', component: 'Text', text: '{path:/title}：{path:/matrix/0/name} / {path:/form/0/owner}' },
            { id: 'missing', component: 'Text', text: '缺失值：{path:/does/not/exist}' },
            { id: 'literalNumber', component: 'Text', content: { literalNumber: '7.5' } },
            { id: 'literalInt', component: 'Text', content: { literalInt: '8' } },
            { id: 'literalBoolean', component: 'Text', content: { literalBoolean: 1 } },
            { id: 'literalBool', component: 'Text', content: { literalBool: 0 } },
            { id: 'valueString', component: 'Text', content: { valueString: 'typed string' } },
            { id: 'valueInt', component: 'Text', content: { valueInt: '3' } },
            { id: 'valueDouble', component: 'Text', content: { valueDouble: '4.5' } },
            { id: 'valueBool', component: 'Text', content: { valueBool: 1 } },
            { id: 'callObject', component: 'Button', text: '执行', actionParams: { call: 'keep-as-function-reference' }, action: 'run' },
          ],
        },
      },
    ])

    expect(snapshot!.dataModel).toEqual({
      matrix: [{ name: '官网' }],
      title: '经营复盘',
      form: [{ owner: '增长组' }],
      newObject: { created: true },
    })
    expect(snapshot!.spec.elements!.title.props!.text).toBe('经营复盘：官网 / 增长组')
    expect(snapshot!.spec.elements!.missing.props!.text).toBe('缺失值：')
    expect(snapshot!.spec.elements!.literalNumber.props!.content).toBe(7.5)
    expect(snapshot!.spec.elements!.literalInt.props!.content).toBe(8)
    expect(snapshot!.spec.elements!.literalBoolean.props!.content).toBe(true)
    expect(snapshot!.spec.elements!.literalBool.props!.content).toBe(false)
    expect(snapshot!.spec.elements!.valueString.props!.content).toBe('typed string')
    expect(snapshot!.spec.elements!.valueInt.props!.content).toBe(3)
    expect(snapshot!.spec.elements!.valueDouble.props!.content).toBe(4.5)
    expect(snapshot!.spec.elements!.valueBool.props!.content).toBe(true)
    expect(snapshot!.spec.elements!.callObject.props!.actionParams).toEqual({ call: 'keep-as-function-reference' })
  })

  it('normalizes legacy typed A2UI data model values before resolving visible content', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { beginRendering: { surfaceId: 'legacy-typed', catalogId: 'vizual' } },
      {
        dataModelUpdate: {
          surfaceId: 'legacy-typed',
          contents: [
            { key: 'title', valueString: '售后诊断' },
            { key: 'count', valueInt: '3' },
            { key: 'ratio', valueDouble: '1.5' },
            { key: 'enabled', valueBoolean: 1 },
            { key: 'flag', valueBool: 0 },
            { key: 'list', valueList: [{ valueString: 'A' }, { valueInt: 2 }] },
            { key: 'map', valueMap: [{ key: 'nested', valueNumber: '9' }, { key: '', valueString: 'ignored' }] },
            { key: 'raw', custom: true },
          ],
        },
      },
      {
        surfaceUpdate: {
          surfaceId: 'legacy-typed',
          catalogId: 'vizual',
          components: [
            { id: 'root', component: 'Text', text: '{path:/title}|{path:/count}|{path:/ratio}|{path:/enabled}|{path:/flag}|{path:/list}|{path:/map/nested}' },
          ],
        },
      },
    ])

    expect(snapshot!.dataModel).toEqual({
      title: '售后诊断',
      count: 3,
      ratio: 1.5,
      enabled: true,
      flag: false,
      list: ['A', 2],
      map: { nested: 9 },
      raw: { key: 'raw', custom: true },
    })
    expect(snapshot!.spec.elements!.root.props!.text).toBe('售后诊断|3|1.5|true|false|["A",2]|9')
  })

  it('accepts loose appendDataModel and deleteSurface messages through the same reducer', () => {
    const core = new VizualNativeCore()

    const appended = core.dispatch([
      { type: 'createSurface', surfaceId: 'loose-data', catalogId: 'vizual' },
      { type: 'updateDataModel', surfaceId: 'loose-data', value: { rows: [{ id: 1 }] } },
      { type: 'appendDataModel', surfaceId: 'loose-data', path: '/rows', value: { id: 2 } },
    ] as any)

    expect(appended!.dataModel).toEqual({ rows: [{ id: 1 }, { id: 2 }] })
    expect(core.getNativeOperationLog().map(operation => operation.type)).toEqual([
      'surface.create',
      'surface.updateData',
      'surface.appendData',
    ])

    expect(core.dispatch({ type: 'deleteSurface', surfaceId: 'loose-data' } as any)).toBeNull()
    expect(core.hasSurface('loose-data')).toBe(false)
  })

  it('deletes object fields and array items when updateData omits value', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'surface.create', surfaceId: 'delete-data', catalogId: 'vizual' },
      {
        type: 'surface.updateData',
        surfaceId: 'delete-data',
        path: '/',
        value: {
          rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
          meta: { keep: true, remove: true },
        },
      },
      { type: 'surface.updateData', surfaceId: 'delete-data', path: '/rows/1' },
      { type: 'surface.updateData', surfaceId: 'delete-data', path: '/meta/remove' },
      { type: 'surface.updateData', surfaceId: 'delete-data', path: '/does/not/exist' },
    ] satisfies VizualNativeOperation[])

    expect(snapshot!.dataModel).toEqual({
      rows: [{ id: 1 }, { id: 3 }],
      meta: { keep: true },
    })
  })

  it('resolves inline path templates and Markdown narrative from real agent output', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'risk', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'risk',
          path: '/',
          value: {
            report: {
              risk: {
                level: '中',
                score: 62,
                summary: '成本增速接近营收增速，需关注利润弹性。',
                items: ['成本环比上升7.8%', '经销渠道占比偏低'],
              },
            },
          },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'risk',
          components: [
            { id: 'root', component: 'Column', children: ['riskText', 'riskNarrative'] },
            { id: 'riskText', component: 'Text', text: '风险等级：{path:/report/risk/level}（评分 {path:/report/risk/score}）' },
            { id: 'riskNarrative', component: 'Markdown', content: '### 判断依据\n\n{path:/report/risk/summary}' },
          ],
        },
      },
    ])

    const normalized = withDefaultElementProps(snapshot!.spec)

    expect(normalized.elements!.riskText.props).toMatchObject({ content: '风险等级：中（评分 62）' })
    expect(normalized.elements!.riskNarrative.props!.content).toBe('### 判断依据\n\n成本增速接近营收增速，需关注利润弹性。')
  })

  it('tracks function call lifecycle without requiring a bridge adapter', () => {
    const onFunctionCall = vi.fn()
    const core = new VizualNativeCore({ onFunctionCall })
    core.dispatch([
      { type: 'function.call', id: 'fn-1', surfaceId: 'missing', functionName: 'loadReport', arguments: { month: '2026-04' } },
      { type: 'function.result', id: 'fn-1', surfaceId: 'missing', status: 'success', result: { ok: true } },
    ] satisfies VizualNativeOperation[])

    expect(onFunctionCall).toHaveBeenCalledWith(expect.objectContaining({ id: 'fn-1', status: 'pending' }))
    expect(core.getFunctionCalls()).toEqual([
      expect.objectContaining({
        id: 'fn-1',
        functionName: 'loadReport',
        status: 'success',
        result: { ok: true },
      }),
    ])
  })

  it('normalizes loose A2UI function and action response payload wrappers', () => {
    const core = new VizualNativeCore()

    core.dispatch({ type: 'createSurface', version: 'v0.10', payload: { id: 'loose-fn', catalogId: 'vizual' } } as any)
    core.dispatch({
      type: 'callFunction',
      version: 'v0.10',
      functionCallId: 'loose-call',
      payload: {
        surfaceId: 'loose-fn',
        functionName: 'lookupMetric',
        arguments: { metric: 'profit' },
      },
    } as any)
    core.dispatch({
      type: 'actionResponse',
      version: 'v0.10',
      payload: {
        surfaceId: 'loose-fn',
        actionId: 'loose-call',
        status: 'error',
        error: 'metric unavailable',
      },
    } as any)

    expect(core.getFunctionCalls()).toEqual([
      expect.objectContaining({
        id: 'loose-call',
        surfaceId: 'loose-fn',
        functionName: 'lookupMetric',
        arguments: { metric: 'profit' },
        status: 'error',
        error: 'metric unavailable',
      }),
    ])
  })

  it('merges duplicate createSurface theme for the same catalog and rejects catalog replacement', () => {
    const onError = vi.fn()
    const core = new VizualNativeCore({ onError })

    const first = core.dispatch({ type: 'surface.create', surfaceId: 'dup-create', catalogId: 'vizual', theme: { mode: 'light' } })
    const merged = core.dispatch({ type: 'surface.create', surfaceId: 'dup-create', catalogId: 'vizual', theme: { accent: '#1677ff' } })
    const rejected = core.dispatch({ type: 'surface.create', surfaceId: 'dup-create', catalogId: 'other-catalog' })

    expect(first!.catalogId).toBe('vizual')
    expect(merged!.theme).toEqual({ mode: 'light', accent: '#1677ff' })
    expect(rejected!.catalogId).toBe('vizual')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      surfaceId: 'dup-create',
      phase: 'create',
      recoverable: true,
    }))
  })

  it('covers native lifecycle operations without hiding errors or breaking action output', () => {
    const onError = vi.fn()
    const onQualityFinding = vi.fn()
    const onSurfaceDelete = vi.fn()
    const onAction = vi.fn()
    const core = new VizualNativeCore({ onError, onQualityFinding, onSurfaceDelete, onAction })

    const themed = core.dispatch([
      { type: 'surface.create', surfaceId: 'life', catalogId: 'vizual' },
      { type: 'surface.updateData', surfaceId: 'life', path: '/', value: { title: '生命周期' } },
      {
        type: 'surface.updateComponents',
        surfaceId: 'life',
        components: [{ id: 'root', component: 'Text', text: { path: '/title' } }],
      },
      { type: 'theme.update', surfaceId: 'life', theme: { mode: 'dark', accent: '#123456' } },
    ] satisfies VizualNativeOperation[])

    expect(themed!.theme).toEqual({ mode: 'dark', accent: '#123456' })
    expect(themed!.spec.state!._a2uiTheme).toEqual({ mode: 'dark', accent: '#123456' })
    expect(core.getTheme('life')).toEqual({ mode: 'dark', accent: '#123456' })

    core.dispatch({
      type: 'error.report',
      error: { surfaceId: 'life', phase: 'render', message: 'renderer failed', recoverable: true, timestamp: 1 },
    } satisfies VizualNativeOperation)
    expect(core.getError('life')).toMatchObject({ message: 'renderer failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ surfaceId: 'life', message: 'renderer failed' }))

    const retried = core.dispatch({ type: 'surface.recovery', surfaceId: 'life', action: 'retry' } satisfies VizualNativeOperation)
    expect(retried!.error).toBeUndefined()
    expect(core.getError('life')).toBeUndefined()

    core.dispatch({
      type: 'error.report',
      error: { surfaceId: 'life', phase: 'render', message: 'second render failed', recoverable: true, timestamp: 2 },
    } satisfies VizualNativeOperation)
    const fallbackSpec = {
      root: 'root',
      elements: {
        root: { type: 'Text', props: { content: 'Agent supplied fallback' } },
      },
    }
    const fallback = core.dispatch({
      type: 'surface.recovery',
      surfaceId: 'life',
      action: 'fallback',
      payload: fallbackSpec,
    } satisfies VizualNativeOperation)
    expect(fallback!.spec).toEqual(fallbackSpec)
    expect(fallback!.error).toBeUndefined()
    expect(core.getQualityFindings()).toEqual([
      expect.objectContaining({
        surfaceId: 'life',
        severity: 'warning',
        code: 'explicit-agent-fallback',
      }),
    ])
    expect(onQualityFinding).toHaveBeenCalledWith(expect.objectContaining({ code: 'explicit-agent-fallback' }))

    const ignoredFallback = core.dispatch({
      type: 'surface.recovery',
      surfaceId: 'life',
      action: 'fallback',
      payload: { message: 'no replacement spec supplied' },
    } satisfies VizualNativeOperation)
    expect(ignoredFallback!.spec).toEqual(fallbackSpec)
    expect(core.getQualityFindings()).toHaveLength(1)

    const receivedActions: unknown[] = []
    core.onAction(() => {
      throw new Error('subscriber failure')
    })
    core.onAction(action => receivedActions.push(action))
    const action = core.createActionFromVizual('drillDown', 'life', {
      _sourceComponentId: 'chart',
      row: { id: 1 },
    })
    expect(action).toMatchObject({
      name: 'drillDown',
      surfaceId: 'life',
      sourceComponentId: 'chart',
      context: { _sourceComponentId: 'chart', row: { id: 1 } },
    })
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'drillDown' }))
    expect(receivedActions).toHaveLength(1)

    const reset = core.dispatch({ type: 'surface.reset', surfaceId: 'life' } satisfies VizualNativeOperation)
    expect(reset!.dataModel).toEqual({})
    expect(reset!.spec).toEqual({ root: 'root', elements: {}, state: {} })

    core.dispatch({ type: 'surface.delete', surfaceId: 'life' } satisfies VizualNativeOperation)
    expect(core.hasSurface('life')).toBe(false)
    expect(core.getArtifact('life')).toBeNull()
    expect(onSurfaceDelete).toHaveBeenCalledWith('life')
  })

  it('ingests native Vizual specs as first-class artifacts', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      root: 'root',
      state: { value: 42 },
      elements: {
        root: { type: 'Text', props: { value: { path: '/value' } } },
      },
    }, 'spec-surface')

    expect(snapshot!.surfaceId).toBe('spec-surface')
    expect(snapshot!.artifact.metadata).toMatchObject({ runtime: 'vizual-native-core', catalogId: 'vizual' })
    expect(core.getSurfaceIds()).toEqual(['spec-surface'])
  })

  it('normalizes agent ui component wrappers with interactive controls', () => {
    const preview = previewVizualNativeInput({
      type: 'ui',
      surfaceId: 'support-triage',
      components: [
        {
          type: 'Column',
          gap: '20px',
          children: [
            {
              type: 'Markdown',
              content: '## 净水器售后交互排查面板\n\n请选择您遇到的问题类型。',
            },
            {
              type: 'Row',
              gap: '12px',
              children: [
                {
                  type: 'Button',
                  label: '出水很慢',
                  action: 'selectIssue',
                  params: { issue: 'slow_flow' },
                },
                {
                  type: 'Button',
                  label: '机器漏水',
                  action: 'selectIssue',
                  params: { issue: 'leaking' },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(preview.ok).toBe(true)
    expect(preview.surfaceId).toBe('support-triage')
    expect(new Set(preview.summary.componentTypes)).toEqual(new Set(['Column', 'Markdown', 'Row', 'Button']))
    const normalized = withDefaultElementProps(preview.spec!)
    const buttons = Object.values(normalized.elements!)
      .filter(element => element.type === 'Button')
      .map(element => element.props)
    expect(buttons).toEqual([
      expect.objectContaining({
        label: '出水很慢',
        action: 'selectIssue',
        actionParams: { issue: 'slow_flow' },
      }),
      expect.objectContaining({
        label: '机器漏水',
        action: 'selectIssue',
        actionParams: { issue: 'leaking' },
      }),
    ])
  })

  it('repairs trailing bracket loss in agent ui wrapper strings', () => {
    const malformed = JSON.stringify({
      type: 'ui',
      surfaceId: 'support-triage',
      components: [
        {
          type: 'Column',
          children: [
            { type: 'Markdown', content: '## 净水器售后交互排查面板' },
            {
              type: 'Row',
              children: [
                {
                  type: 'Button',
                  label: '无法制水',
                  action: 'selectIssue',
                  params: { issue: 'no_production' },
                },
              ],
            },
          ],
        },
      ],
    }).slice(0, -2)

    const preview = previewVizualNativeInput(malformed)

    expect(preview.ok).toBe(true)
    const normalized = withDefaultElementProps(preview.spec!)
    const button = Object.values(normalized.elements!).find(element => element.type === 'Button')
    expect(button?.props).toMatchObject({
      label: '无法制水',
      action: 'selectIssue',
      actionParams: { issue: 'no_production' },
    })
  })

  it('unwraps present_vizual_ui tool payloads before chart normalization', () => {
    const preview = previewVizualNativeInput({
      type: 'tool',
      tool: 'present_vizual_ui',
      input: {
        components: [
          {
            type: 'BarChart',
            title: '各区域响应超时情况（实际-目标）',
            xLabel: '区域',
            yLabel: '超时分钟数',
            data: {
              labels: ['Downtown', 'Westside', 'Northside', 'Eastside'],
              datasets: [
                { label: '平均超时(分钟)', data: [0.3, 10, -1, 4] },
              ],
            },
          },
          {
            type: 'DataTable',
            columns: [{ key: 'region', label: '区域' }],
            rows: [{ region: 'Westside' }],
          },
        ],
      },
    } as any)

    expect(preview.ok).toBe(true)
    const chart = Object.values(preview.spec!.elements!).find(element => element.type === 'BarChart')
    expect(chart?.props).toMatchObject({
      x: 'label',
      y: ['平均超时(分钟)'],
      data: [
        { label: 'Downtown', '平均超时(分钟)': 0.3 },
        { label: 'Westside', '平均超时(分钟)': 10 },
        { label: 'Northside', '平均超时(分钟)': -1 },
        { label: 'Eastside', '平均超时(分钟)': 4 },
      ],
    })
    const option = buildBarFallback(chart!.props as any)
    expect(option.series).toEqual([
      expect.objectContaining({ name: '平均超时(分钟)', data: [0.3, 10, -1, 4] }),
    ])
  })

  it('renders AG-UI tool args with nested components even when the agent omits surfaceId', () => {
    const core = new VizualNativeCore()
    const snapshot = core.processAGUIEvents([
      { type: 'TOOL_CALL_START', toolCallId: 'tool-1', toolCallName: 'present_vizual_ui' },
      {
        type: 'TOOL_CALL_ARGS',
        toolCallId: 'tool-1',
        delta: JSON.stringify({
          input: {
            components: [
              {
                type: 'BarChart',
                data: {
                  labels: ['A', 'B'],
                  datasets: [{ label: '办理量', data: [12, 18] }],
                },
              },
            ],
          },
        }),
      },
      { type: 'TOOL_CALL_END', toolCallId: 'tool-1' },
    ] as any)

    expect(snapshot!.surfaceId).toBe('surface-1')
    const normalized = withDefaultElementProps(snapshot!.spec)
    const chart = Object.values(normalized.elements!).find(element => element.type === 'BarChart')
    expect(chart?.props).toMatchObject({
      data: [
        { label: 'A', '办理量': 12 },
        { label: 'B', '办理量': 18 },
      ],
      x: 'label',
      y: ['办理量'],
    })
  })

  it.each([
    ['BoxplotChart', { title: '箱线图裸组件', data: [{ branch: '东城', min: 60, q1: 70, median: 82, q3: 90, max: 96 }], x: 'branch', y: 'median' }],
    ['FunnelChart', { title: '漏斗图裸组件', data: [{ stage: '线索', value: 100 }, { stage: '进件', value: 62 }], x: 'stage', y: 'value' }],
    ['SankeyChart', { title: '桑基图裸组件', data: [{ source: '柜面', target: '存款', value: 42 }] }],
    ['DumbbellChart', { title: '哑铃图裸组件', data: [{ branch: '东城', low: 66, high: 88 }], x: 'branch', y: ['low', 'high'] }],
    ['XmrChart', { title: 'XMR 裸组件 Chart.js 形态', data: { labels: ['东城', '西城'], datasets: [{ label: '等待分钟', data: [6, 18] }] } }],
  ])('accepts %s as a bare native component without an id', (componentType, props) => {
    const preview = previewVizualNativeInput({
      components: [
        {
          type: componentType,
          ...props,
        },
      ],
    } as any)

    expect(preview.ok).toBe(true)
    expect(preview.summary.componentTypes).toContain(componentType)
    const chart = Object.values(preview.spec!.elements!).find(element => element.type === componentType)
    expect(chart).toBeDefined()
  })

  it('rejects unsupported opaque direct-spec components instead of previewing an empty surface', () => {
    const preview = previewVizualNativeInput({
      root: 'actions',
      elements: {
        actions: {
          type: 'ActionPanel',
          props: {
            title: '行动建议',
            items: [
              { label: '优化低价渠道', priority: 'high' },
            ],
          },
        },
      },
    })

    expect(preview.ok).toBe(false)
    expect(preview.summary.componentTypes).toEqual(['ActionPanel'])
    expect(preview.issues.map(issue => issue.code)).toContain('vizual.unsupported_component')
  })

  it('remaps nested direct-spec children instead of leaking nested ids', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      root: 'root',
      elements: {
        root: {
          type: 'Card',
          props: {
            root: 'inner-root',
            elements: {
              'inner-root': { type: 'Column', children: ['inner-text'], props: { children: ['inner-text'] } },
              'inner-text': { type: 'Text', props: { content: 'nested text' } },
            },
          },
        },
      },
    }, 'nested-direct')

    const rootChildren = snapshot!.spec.elements!.root.children as string[]
    expect(rootChildren).toHaveLength(1)
    const nestedRoot = snapshot!.spec.elements![rootChildren[0]]
    expect(nestedRoot.children).toEqual([expect.stringMatching(/^root-inner-text/)])
    expect(nestedRoot.props).not.toHaveProperty('children')
  })

  it('validates renderability boundaries before handing specs to a renderer', () => {
    const noSurface = validateVizualNativeInput({ type: 'unknown-intent', text: 'plain answer only' } as any)
    expect(noSurface.ok).toBe(false)
    expect(noSurface.issues.map(issue => issue.code)).toContain('vizual.no_renderable_surface')

    const missingRootId = validateVizualNativeInput({
      type: 'artifact.ingest',
      surfaceId: 'missing-root-id',
      spec: {
        elements: {
          actual: { type: 'Text', props: { content: 'visible text' } },
        },
      },
    } satisfies VizualNativeOperation)
    expect(missingRootId.ok).toBe(false)
    expect(missingRootId.issues.map(issue => issue.code)).toContain('vizual.spec_missing_root')

    const emptyElements = validateVizualNativeInput({
      root: 'root',
      elements: {},
    })
    expect(emptyElements.ok).toBe(false)
    expect(emptyElements.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: 'error',
        code: 'vizual.spec_empty_elements',
      }),
      expect.objectContaining({
        severity: 'error',
        code: 'vizual.spec_root_missing_element',
      }),
    ]))

    const missingRoot = validateVizualNativeInput({
      root: 'missing',
      elements: {
        actual: { type: 'Text', props: { content: 'visible text' } },
      },
    })
    expect(missingRoot.ok).toBe(false)
    expect(missingRoot.issues.map(issue => issue.code)).toContain('vizual.spec_root_missing_element')

    const cyclic = validateVizualNativeInput({
      root: 'a',
      elements: {
        a: { type: 'Column', children: ['b'] },
        b: { type: 'Column', children: ['a'] },
      },
    })
    expect(cyclic.ok).toBe(false)
    expect(cyclic.issues.map(issue => issue.code)).toContain('vizual.spec_cyclic_children')
  })

  it('rejects opaque external DSL shapes that cannot be faithfully mapped to native', () => {
    const cases = [
      {
        // radar ECharts is not in the auto-convert set; must reject, not guess.
        name: 'echarts-radar',
        input: {
          radar: { indicator: [{ name: '算法创新', max: 100 }] },
          series: [{ type: 'radar', data: [{ value: [94], name: 'team' }] }],
        },
      },
      {
        // Chart.js with non-numeric dataset values cannot be mapped faithfully.
        name: 'chartjs-nonnumeric',
        input: {
          type: 'bar',
          data: {
            labels: ['东城', '西城'],
            datasets: [{ label: '等待', data: ['n/a', 'pending'] }],
          },
        },
      },
      {
        name: 'html',
        input: '<div class="dashboard"><canvas id="chart"></canvas></div>',
      },
      {
        name: 'react-code',
        input: 'export default function Dashboard() { return React.createElement("div") }',
      },
      {
        name: 'old-ui-dsl',
        input: {
          layout: 'dashboard',
          widgets: [{ chartType: 'bar', data: [1, 2] }],
        },
      },
    ]

    for (const item of cases) {
      const preview = previewVizualNativeInput(item.input as any)
      expect(preview.ok, item.name).toBe(false)
      expect(
        preview.issues.some(issue => issue.severity === 'error'),
        item.name,
      ).toBe(true)
    }
  })

  it('faithfully repairs recognizable bar ECharts/Chart.js dialects into a really-rendering native chart', () => {
    const echarts = previewVizualNativeInput({
      title: { text: '团队能力 vs 行业标准' },
      xAxis: { type: 'category', data: ['算法创新', '硬件品控'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [94, 70] }],
    } as any)
    expect(echarts.ok).toBe(true)
    expect(echarts.issues.some(i => i.code === 'vizual.repair.echarts_option')).toBe(true)
    expect(echarts.issues.every(i => i.severity !== 'error')).toBe(true)

    const chartjs = previewVizualNativeInput({
      type: 'bar',
      data: { labels: ['东城', '西城'], datasets: [{ label: '等待分钟', data: [6, 18] }] },
    } as any)
    expect(chartjs.ok).toBe(true)
    expect(chartjs.issues.some(i => i.code === 'vizual.repair.chartjs_config')).toBe(true)
  })

  it('rejects chart fields that exist but are not numeric', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'bad-numeric', catalogId: 'vizual' },
      {
        type: 'surface.updateData',
        surfaceId: 'bad-numeric',
        path: '/',
        value: {
          rows: [
            { month: 'Jan', revenue: { raw: 'not numeric' } },
            { month: 'Feb', revenue: null },
          ],
        },
      },
      {
        type: 'surface.updateComponents',
        surfaceId: 'bad-numeric',
        components: [
          { id: 'root', component: 'Column', children: ['chart'] },
          { id: 'chart', component: 'BarChart', dataPath: '/rows', xField: 'month', yField: 'revenue' },
        ],
      },
    ] as any)

    expect(result.ok).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'vizual.chart_non_numeric_data_field',
        evidence: expect.objectContaining({
          chartId: 'chart',
          componentType: 'BarChart',
          field: 'revenue',
          role: 'y',
        }),
      }),
    ]))
  })

  it('accepts horizontal BarChart ranking fields with numeric x and categorical y', () => {
    const result = validateVizualNativeInput({
      root: 'rank',
      elements: {
        rank: {
          type: 'BarChart',
          props: {
            data: [
              { branch: '南山', score: 82 },
              { branch: '福田', score: 76 },
            ],
            x: 'score',
            y: 'branch',
          },
        },
      },
    } as any)

    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).not.toContain('vizual.chart_non_numeric_data_field')
  })

  it('accepts chart series field aliases commonly emitted by agents', () => {
    const result = validateVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          children: ['combo', 'radar'],
        },
        combo: {
          type: 'ComboChart',
          props: {
            data: [
              { month: '1月', 客流: 28.2, 人均贡献: 53.9, 营销费用: 180 },
              { month: '2月', 客流: 27.8, 人均贡献: 53.2, 营销费用: 195 },
            ],
            xField: 'month',
            series: [
              { name: '客流', type: 'bar', dataKey: '客流' },
              { name: '人均贡献', type: 'line', dataKey: '人均贡献' },
              { name: '营销费用', type: 'line', dataKey: '营销费用' },
            ],
          },
        },
        radar: {
          type: 'RadarChart',
          props: {
            data: [
              { axis: '产品质量', current: 85, benchmark: 75 },
              { axis: '交付速度', current: 70, benchmark: 80 },
            ],
            axis: 'axis',
            series: [
              { name: '当前', value: 'current' },
              { name: '基准', value: 'benchmark' },
            ],
          },
        },
      },
    } as any)

    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).not.toContain('vizual.chart_missing_data_field')
  })

  it('treats a string series prop as a long-form grouping field, not a numeric measure', () => {
    const result = validateVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'LineChart',
          props: {
            data: [
              { date: '2025-01', line: '个人助手-iOS', value: 45000 },
              { date: '2025-01', line: '企业Agent-Windows', value: 18000 },
              { date: '2025-02', line: '个人助手-iOS', value: 48000 },
              { date: '2025-02', line: '企业Agent-Windows', value: 21000 },
            ],
            x: 'date',
            y: 'value',
            series: 'line',
          },
        },
      },
    } as any)

    expect(result.ok).toBe(true)
    expect(result.issues.map(issue => issue.code)).not.toContain('vizual.chart_non_numeric_data_field')
  })

  it('previews typed chart encoding and compiles long-form groups into renderable wide series', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          children: ['trend', 'mix'],
        },
        trend: {
          type: 'LineChart',
          props: {
            title: '客户端活跃用户趋势',
            data: [
              { month: '2025-01', client: 'iOS', activeUsers: 45000 },
              { month: '2025-01', client: 'Android', activeUsers: 52000 },
              { month: '2025-02', client: 'iOS', activeUsers: 48000 },
              { month: '2025-02', client: 'Android', activeUsers: 55000 },
            ],
            encoding: {
              x: { field: 'month', type: 'temporal' },
              y: { field: 'activeUsers', type: 'quantitative' },
              color: { field: 'client', type: 'nominal' },
            },
          },
        },
        mix: {
          type: 'ComboChart',
          props: {
            data: [
              { month: '2025-01', apiCalls: 120, compute: 450 },
              { month: '2025-02', apiCalls: 140, compute: 520 },
            ],
            encoding: { x: 'month' },
            measures: [
              { field: 'apiCalls', label: 'API调用量', mark: 'bar', axis: 'left' },
              { field: 'compute', label: '算力消耗', mark: 'line', axis: 'right' },
            ],
          },
        },
      },
    } as any)

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.trend.props).toMatchObject({
      x: 'month',
      y: ['iOS', 'Android'],
      data: [
        { month: '2025-01', iOS: 45000, Android: 52000 },
        { month: '2025-02', iOS: 48000, Android: 55000 },
      ],
    })
    expect(preview.spec!.elements!.mix.props).toMatchObject({
      x: 'month',
      series: [
        { type: 'bar', y: 'apiCalls', name: 'API调用量', yAxisIndex: 0 },
        { type: 'line', y: 'compute', name: '算力消耗', yAxisIndex: 1 },
      ],
    })
  })

  it('validates chart-specific field requirements across native chart families', () => {
    const rows = [{ category: 'A', group: 'G1', low: 1, high: 3, value: 2, x: 10, y: 20, size: 5, date: '2026-06-04', source: 'S', target: 'T' }]
    const result = validateVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          children: [
            'scatter',
            'bubble',
            'calendar',
            'heatmap',
            'pie',
            'funnel',
            'waterfall',
            'xmr',
            'sparkline',
            'histogram',
            'boxplot',
            'dumbbell',
            'sankey',
          ],
        },
        scatter: { type: 'ScatterChart', props: { data: rows, x: 'category', y: 'value', size: 'size', label: 'category' } },
        bubble: { type: 'BubbleChart', props: { data: rows, x: 'x', y: 'y', size: 'size', label: 'category' } },
        calendar: { type: 'CalendarChart', props: { data: rows, dateField: 'date', valueField: 'value' } },
        heatmap: { type: 'HeatmapChart', props: { data: rows, xField: 'category', yField: 'group', valueField: 'value' } },
        pie: { type: 'PieChart', props: { data: rows, label: 'category', value: 'value' } },
        funnel: { type: 'FunnelChart', props: { data: rows, label: 'category', value: 'value' } },
        waterfall: { type: 'WaterfallChart', props: { data: rows, x: 'category', y: 'value' } },
        xmr: { type: 'XmrChart', props: { data: rows, x: 'category', y: 'value' } },
        sparkline: { type: 'SparklineChart', props: { data: rows, x: 'category', y: 'value' } },
        histogram: { type: 'HistogramChart', props: { data: rows, value: 'value' } },
        boxplot: { type: 'BoxplotChart', props: { data: rows, groupField: 'group', valueField: 'value' } },
        dumbbell: { type: 'DumbbellChart', props: { data: rows, groupField: 'group', low: 'low', high: 'high' } },
        sankey: { type: 'SankeyChart', props: { data: rows } },
      },
    })

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('reports missing chart data fields with concrete evidence instead of silently rendering a broken chart', () => {
    const result = validateVizualNativeInput({
      root: 'root',
      elements: {
        root: { type: 'LineChart', props: { data: [{ month: '6月', revenue: 16800 }], x: 'month', y: 'profit' } },
      },
    })

    expect(result.ok).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'vizual.chart_missing_data_field',
      evidence: expect.objectContaining({
        chartId: 'root',
        componentType: 'LineChart',
        role: 'y',
        field: 'profit',
      }),
    }))
  })

  it('surfaces quality findings as validation warning evidence', () => {
    const result = validateVizualNativeInput([
      { type: 'surface.create', surfaceId: 'fallback-evidence', catalogId: 'vizual' },
      {
        type: 'surface.recovery',
        surfaceId: 'fallback-evidence',
        action: 'fallback',
        payload: {
          root: 'root',
          elements: {
            root: { type: 'Text', props: { content: 'fallback still visible' } },
          },
        },
      },
    ] satisfies VizualNativeOperation[])

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'explicit-agent-fallback',
        surfaceId: 'fallback-evidence',
      }),
    ])
  })

  it('allows text-only native inputs when a renderable surface is not required', () => {
    const textOnly = [
      { type: 'TEXT_MESSAGE_START', messageId: 'plain', role: 'assistant' },
      { type: 'TEXT_MESSAGE_CONTENT', messageId: 'plain', delta: '只用文字回答。' },
      { type: 'TEXT_MESSAGE_END', messageId: 'plain' },
    ]

    const relaxed = validateVizualNativeInput(textOnly as any, { requireRenderable: false })
    expect(relaxed.ok).toBe(true)
    expect(relaxed.normalized.snapshot).toBeNull()
    expect(relaxed.normalized.messages).toEqual([
      expect.objectContaining({
        id: 'plain',
        role: 'assistant',
        content: '只用文字回答。',
        status: 'complete',
      }),
    ])

    const strict = validateVizualNativeInput(textOnly as any)
    expect(strict.ok).toBe(false)
    expect(strict.issues.map(issue => issue.code)).toContain('vizual.no_renderable_surface')
  })

  it('absorbs unknown events and visual update failures without damaging text output', () => {
    const errors: unknown[] = []
    const core = new VizualNativeCore({ onError: error => errors.push(error) })

    core.dispatch([
      { type: 'TEXT_MESSAGE_START', messageId: 'answer', role: 'assistant' },
      { type: 'TEXT_MESSAGE_CONTENT', messageId: 'answer', delta: '先保留文字结论。' },
      { type: 'TEXT_MESSAGE_END', messageId: 'answer' },
    ] as any)

    expect(core.dispatch({ type: 'FUTURE_AG_UI_EVENT', value: { ignored: true } } as any)).toBeNull()
    expect(errors).toHaveLength(0)
    expect(core.getEventLog().at(-1)).toMatchObject({ type: 'FUTURE_AG_UI_EVENT' })

    const failedVisualUpdate = core.dispatch({
      type: 'surface.updateComponents',
      surfaceId: 'missing-surface',
      components: [{ id: 'root', component: 'Column' }],
    } satisfies VizualNativeOperation)

    expect(failedVisualUpdate).toBeNull()
    expect(errors).toEqual([
      expect.objectContaining({
        surfaceId: 'missing-surface',
        phase: 'update',
        recoverable: true,
      }),
    ])
    expect(core.getMessages()).toEqual([
      expect.objectContaining({
        id: 'answer',
        content: '先保留文字结论。',
        status: 'complete',
      }),
    ])
  })

  it('absorbs incomplete AG-UI events and missing-surface operations without corrupting state', () => {
    const errors: unknown[] = []
    const core = new VizualNativeCore({ onError: error => errors.push(error) })

    expect(core.dispatch({ type: 'TEXT_MESSAGE_START' } as any)).toBeNull()
    expect(core.dispatch({ type: 'TEXT_MESSAGE_CONTENT', delta: 'missing id' } as any)).toBeNull()
    expect(core.dispatch({ type: 'TEXT_MESSAGE_END' } as any)).toBeNull()
    expect(core.dispatch({ type: 'REASONING_MESSAGE_END' } as any)).toBeNull()
    expect(core.dispatch({ type: 'TOOL_CALL_START', toolCallName: 'render_ui' } as any)).toBeNull()
    expect(core.dispatch({ type: 'TOOL_CALL_ARGS', delta: '{}' } as any)).toBeNull()
    expect(core.dispatch({ type: 'TOOL_CALL_END' } as any)).toBeNull()
    expect(core.dispatch({ type: 'TOOL_CALL_END', toolCallId: 'missing-buffer' } as any)).toBeNull()
    expect(core.dispatch({ type: 'ACTIVITY_DELTA', patch: [] } as any)).toBeNull()

    expect(core.dispatch({ type: 'surface.updateComponents', surfaceId: 'missing', components: [{ id: 'root', component: 'Text' }] } as any)).toBeNull()
    expect(core.dispatch({ type: 'surface.updateData', surfaceId: 'missing', path: '/', value: {} } as any)).toBeNull()
    expect(core.dispatch({ type: 'surface.appendData', surfaceId: 'missing', path: '/', value: {} } as any)).toBeNull()
    expect(core.dispatch({ type: 'surface.reset', surfaceId: 'missing' } as any)).toBeNull()
    expect(core.dispatch({ type: 'theme.update', surfaceId: 'missing', theme: { accent: '#000' } } as any)).toBeNull()
    expect(core.dispatch({ type: 'surface.recovery', surfaceId: 'missing', action: 'retry' } as any)).toBeNull()

    expect(core.getMessages()).toEqual([])
    expect(core.getSurfaceIds()).toEqual([])
    expect(errors).toContainEqual(expect.objectContaining({
      surfaceId: 'missing',
      phase: 'update',
      recoverable: true,
    }))
  })

  it('extracts A2UI payloads from AG-UI messages snapshots for non-activity assistant messages', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      type: 'MESSAGES_SNAPSHOT',
      messages: [
        {
          id: 'snapshot-message',
          role: 'assistant',
          content: {
            a2ui_operations: [
              { version: 'v0.10', createSurface: { surfaceId: 'messages-snapshot', catalogId: 'vizual' } },
              {
                version: 'v0.10',
                updateComponents: {
                  surfaceId: 'messages-snapshot',
                  components: [{ id: 'root', component: 'Text', text: 'snapshot 内嵌 UI' }],
                },
              },
            ],
          },
        },
      ],
    } as any)

    expect(snapshot!.surfaceId).toBe('messages-snapshot')
    expect(core.getSpec('messages-snapshot')?.elements?.root?.props?.text).toBe('snapshot 内嵌 UI')
  })

  it('normalization captures unexpected dispatch exceptions as nonrecoverable errors', () => {
    const badInput = {}
    Object.defineProperty(badInput, 'type', {
      get() {
        throw new Error('malformed agent payload')
      },
    })

    const normalized = normalizeVizualNativeInput(badInput as any, { surfaceId: 'bad-input' })

    expect(normalized.ok).toBe(false)
    expect(normalized.errors).toEqual([
      expect.objectContaining({
        surfaceId: 'bad-input',
        phase: 'render',
        message: 'malformed agent payload',
        recoverable: false,
      }),
    ])
  })

  it('reports host callback exceptions with the best available surface id', () => {
    const errors: unknown[] = []
    const direct = new VizualNativeCore({
      onSurfaceChange() {
        throw new Error('host surface callback failed')
      },
      onError: error => errors.push(error),
    })

    expect(direct.dispatch({
      type: 'surface.create',
      surfaceId: 'callback-surface',
      catalogId: 'vizual',
    } satisfies VizualNativeOperation)).toBeNull()
    expect(errors).toEqual([
      expect.objectContaining({
        surfaceId: 'callback-surface',
        phase: 'update',
        message: 'host surface callback failed',
        recoverable: true,
      }),
    ])

    const nestedErrors: unknown[] = []
    const nested = new VizualNativeCore({
      onQualityFinding() {
        throw new Error('quality callback failed')
      },
      onError: error => nestedErrors.push(error),
    })
    nested.dispatch({
      type: 'quality.report',
      finding: {
        surfaceId: 'finding-surface',
        severity: 'warning',
        code: 'callback-failure',
        message: 'exercise nested surface id lookup',
      },
    } satisfies VizualNativeOperation)

    expect(nestedErrors).toEqual([
      expect.objectContaining({
        surfaceId: 'finding-surface',
        message: 'quality callback failed',
        recoverable: true,
      }),
    ])

    const unattributedErrors: unknown[] = []
    const unattributed = new VizualNativeCore({
      onQualityFinding() {
        throw new Error('unattributed callback failed')
      },
      onError: error => unattributedErrors.push(error),
    })
    unattributed.dispatch({
      type: 'quality.report',
      finding: {
        severity: 'warning',
        code: 'no-surface-id',
        message: 'exercise empty surface id fallback',
      },
    } satisfies VizualNativeOperation)

    expect(unattributedErrors).toEqual([
      expect.objectContaining({
        surfaceId: '',
        message: 'unattributed callback failed',
        recoverable: true,
      }),
    ])
  })

  it('ignores unsupported raw inputs without creating hidden surfaces', () => {
    const core = new VizualNativeCore()

    expect(core.process(42 as any)).toBeNull()
    expect(core.process({ version: 'v0.10' } as any)).toBeNull()
    expect(core.process({ version: 'v0.10', action: 'not-an-action-object' } as any)).toBeNull()
    expect(core.getSurfaceIds()).toEqual([])
    expect(core.getNativeOperationLog()).toEqual([])
  })

  it('extracts embedded A2UI operations from completed assistant message content', () => {
    const core = new VizualNativeCore()
    const embedded = JSON.stringify({
      a2ui_operations: [
        { version: 'v0.10', createSurface: { surfaceId: 'embedded', catalogId: 'vizual' } },
        {
          version: 'v0.10',
          updateComponents: {
            surfaceId: 'embedded',
            components: [{ id: 'root', component: 'Text', content: 'embedded surface rendered' }],
          },
        },
      ],
    })

    core.dispatch({ type: 'TEXT_MESSAGE_START', messageId: 'm-embedded', role: 'assistant' } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'm-embedded', delta: embedded } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_END', messageId: 'm-embedded' } as any)

    expect(core.getMessages()).toContainEqual(expect.objectContaining({
      id: 'm-embedded',
      content: embedded,
      status: 'complete',
    }))
    expect(core.getSpec('embedded')?.elements?.root?.props?.content).toBe('embedded surface rendered')
  })

  it('repairs trailing assistant JSON content before extracting A2UI operations', () => {
    const core = new VizualNativeCore()
    const partialJson = '{"a2ui_operations":[{"version":"v0.10","createSurface":{"surfaceId":"repaired-json","catalogId":"vizual"}},{"version":"v0.10","updateComponents":{"surfaceId":"repaired-json","components":[{"id":"root","component":"Text","text":"利润 \\"承压\\""}]}}]'

    core.dispatch({ type: 'TEXT_MESSAGE_START', messageId: 'm-repaired', role: 'assistant' } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'm-repaired', delta: partialJson } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_END', messageId: 'm-repaired' } as any)

    expect(core.getSpec('repaired-json')?.elements?.root?.props?.text).toBe('利润 "承压"')
    expect(core.process('{"a":]}' as any)).toBeNull()
  })

  it('applies AG-UI run state snapshots and JSON patch deltas without needing a rendered surface', () => {
    const core = new VizualNativeCore()

    core.dispatch({ type: 'STATE_SNAPSHOT', snapshot: { count: 1, items: ['A'], obsolete: true } } as any)
    core.dispatch({
      type: 'STATE_DELTA',
      delta: [
        { op: 'add', path: '/matrix/0/name', value: '新建数组节点' },
        { op: 'replace', path: '/items/1', value: 'B2' },
        { op: 'replace', path: '/count', value: 2 },
        { op: 'add', path: '/items/-', value: 'B' },
        { op: 'remove', path: '/obsolete' },
        { op: 'copy', path: '/ignored', value: true },
      ],
    } as any)

    expect(core.getRunState()).toEqual({
      count: 2,
      items: ['A', 'B2', 'B'],
      matrix: [{ name: '新建数组节点' }],
    })
  })

  it('normalizes hyphenated direct-spec component aliases from real agent output', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          component: 'VizStack',
          props: { children: ['section'] },
        },
        section: {
          component: 'view',
          props: { children: ['trend', 'returns'] },
        },
        trend: {
          component: 'combo-chart',
          props: {
            title: '月度经营趋势',
            data: [{ month: '6月', revenue: 16800, cost: 14500, profit: 2300 }],
            x: 'month',
            series: [
              { type: 'bar', y: 'revenue', name: '营收' },
              { type: 'line', y: 'profit', name: '利润' },
            ],
          },
        },
        returns: {
          component: 'bar-chart',
          props: {
            title: '退货率',
            data: [{ channel: '拼多多', rate: 12.7 }],
            x: 'channel',
            y: 'rate',
          },
        },
      },
    })

    expect(preview.ok).toBe(true)
    expect(preview.summary.componentTypes).toEqual(['Column', 'ComboChart', 'BarChart'])
    expect(preview.spec.elements!.section.type).toBe('Column')
    expect(preview.spec.elements!.trend.type).toBe('ComboChart')
    expect(preview.spec.elements!.returns.type).toBe('BarChart')
  })

  it('synthesizes KPI dashboards from direct text-card specs instead of leaving metric fragments', () => {
    const preview = previewVizualNativeInput({
      root: 'dashboard',
      elements: {
        dashboard: { component: 'View', props: { direction: 'column' } },
        kpi_1_label: { type: 'Text', props: { content: '销量' } },
        kpi_1_value: { type: 'Text', props: { content: '21万台' } },
        kpi_1_trend: { type: 'Text', props: { content: '+23%' } },
        kpi_2_label: { type: 'Text', props: { content: '利润' } },
        kpi_2_value: { type: 'Text', props: { content: '2300万元' } },
        kpi_2_trend: { type: 'Text', props: { content: '下降 8%' } },
      },
    })

    expect(preview.ok).toBe(true)
    expect(preview.spec.elements!['kpi-dashboard']).toMatchObject({
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        columns: 2,
        metrics: [
          { label: '销量', value: '21万台', trend: 'up', trendValue: '+23%' },
          { label: '利润', value: '2300万元', trend: 'down', trendValue: '下降 8%' },
        ],
      },
    })
    expect(preview.spec.elements!.kpi_1_label).toBeUndefined()
    expect(preview.spec.elements!.kpi_2_value).toBeUndefined()
  })

  it('normalizes direct-spec metric, table, and inline child fragments from unstructured agent output', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          props: {
            children: [
              'metric',
              'grid',
              'metricGrid',
              42,
              { component: 'Vizual.Text', props: { children: '内联说明' } },
            ],
          },
        },
        metric: {
          type: 'KpiCard',
          props: {
            title: '利润',
            current: '2300万元',
            delta: '下降 8%',
            unit: '万元',
            color: '#d14343',
          },
        },
        grid: {
          component: 'DataGrid',
          props: {
            rows: [{ channel: '官网', profit: 900 }],
            columns: ['channel', 42, { header: 'profit', title: '利润' }],
          },
        },
        metricGrid: {
          type: 'KPIGrid',
          props: {
            items: [{ label: '销量', value: '21万台' }],
          },
        },
      },
    })

    expect(preview.ok).toBe(true)
    expect(preview.spec.elements!.root).toMatchObject({
      type: 'Column',
      children: expect.arrayContaining(['metric', 'grid', 'metricGrid']),
    })
    expect(preview.spec.elements!.metric).toMatchObject({
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        columns: 1,
        metrics: [expect.objectContaining({
          label: '利润',
          value: '2300万元',
          trend: 'down',
          trendValue: '下降 8%',
          suffix: '万元',
        })],
      },
    })
    expect(preview.spec.elements!.grid).toMatchObject({
      type: 'DataTable',
      props: {
        type: 'table',
        data: [{ channel: '官网', profit: 900 }],
        columns: [
          { key: 'channel', label: 'channel' },
          { key: 'col_2', label: 'col_2' },
          { header: 'profit', title: '利润', key: '利润', label: '利润' },
        ],
      },
    })
    expect(preview.spec.elements!.metricGrid).toMatchObject({
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        metrics: [{ label: '销量', value: '21万台' }],
      },
    })
    expect(Object.values(preview.spec.elements!).some(element => element.props?.content === '内联说明')).toBe(true)
  })

  it('normalizes nested data containers for timeline and gantt direct specs', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          children: ['timeline', 'gantt'],
        },
        timeline: {
          type: 'Timeline',
          props: {
            items: [
              { time: '第1周', label: '客户动线梳理' },
              { time: '第2周', label: '窗口排班调整' },
            ],
          },
        },
        gantt: {
          type: 'GanttChart',
          props: {
            data: {
              title: '整改计划甘特图',
              tasks: [
                { name: '客户动线梳理', start: '2026-06-10', end: '2026-06-12' },
                { name: '窗口排班调整', start: '2026-06-13', end: '2026-06-20' },
              ],
            },
          },
        },
      },
    })

    expect(preview.ok).toBe(true)
    expect(preview.spec.elements!.timeline).toMatchObject({
      type: 'Timeline',
      props: {
        events: [
          { time: '第1周', label: '客户动线梳理' },
          { time: '第2周', label: '窗口排班调整' },
        ],
      },
    })
    expect(preview.spec.elements!.gantt).toMatchObject({
      type: 'GanttChart',
      props: {
        title: '整改计划甘特图',
        tasks: [
          { name: '客户动线梳理', start: '2026-06-10', end: '2026-06-12' },
          { name: '窗口排班调整', start: '2026-06-13', end: '2026-06-20' },
        ],
      },
    })
  })

  it('normalizes Timeline props.data arrays into events', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Timeline',
          props: {
            data: [
              { date: '2026-06-11', label: '项目启动会' },
              { date: '2026-06-15', label: '数据采集完成' },
            ],
          },
        },
      },
    })

    expect(preview.ok).toBe(true)
    expect(preview.spec.elements!.root).toMatchObject({
      type: 'Timeline',
      props: {
        events: [
          { date: '2026-06-11', label: '项目启动会' },
          { date: '2026-06-15', label: '数据采集完成' },
        ],
      },
    })
  })

  it('normalizes native operation Timeline props.data arrays into events', () => {
    const preview = previewVizualNativeInput([
      { version: 'v0.10', createSurface: { surfaceId: 'timeline-operation' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'timeline-operation',
          components: [
            {
              id: 'root',
              type: 'Timeline',
              props: {
                data: [
                  { date: '2026-06-11', label: '项目启动会' },
                  { date: '2026-06-15', label: '数据采集完成' },
                ],
              },
            },
          ],
        },
      },
    ])

    expect(preview.ok).toBe(true)
    expect(preview.spec.elements!.root).toMatchObject({
      type: 'Timeline',
      props: {
        events: [
          { date: '2026-06-11', label: '项目启动会' },
          { date: '2026-06-15', label: '数据采集完成' },
        ],
      },
    })
  })

  it('deduplicates direct inline child ids and ignores empty KPI text fragments', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          props: {
            children: [
              { id: 'note', type: 'Text', props: { content: '第一条' } },
              { id: 'note', type: 'Text', props: { content: '第二条' } },
            ],
          },
        },
        kpi_1_label: { type: 'Text', props: {} },
        kpi_1_value: { type: 'Text', props: { content: '21万台' } },
        kpi_2_label: { type: 'Text', props: { content: '利润' } },
        kpi_2_value: { type: 'Text', props: { content: '2300万元' } },
      },
    })

    expect(preview.ok).toBe(true)
    expect(preview.spec.elements!.root.children).toEqual(expect.arrayContaining(['note', 'note-2']))
    expect(preview.spec.elements!.note.props!.content).toBe('第一条')
    expect(preview.spec.elements!['note-2'].props!.content).toBe('第二条')
    expect(preview.spec.elements!['kpi-dashboard']).toBeUndefined()
    expect(preview.spec.elements!.kpi_2_label).toBeDefined()
  })

  it('normalizes common agent-native component aliases into registered Vizual components', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'surface.create', surfaceId: 'aliases', catalogId: 'vizual' },
      {
        type: 'surface.updateData',
        surfaceId: 'aliases',
        path: '/',
        value: {
          revenue: 1280000,
          rows: [{ channel: '直销', amount: 520000 }],
          trend: [{ day: 'D1', revenue: 198000 }],
        },
      },
      {
        type: 'surface.updateComponents',
        surfaceId: 'aliases',
        components: [
          { id: 'root', component: 'VStack', children: ['metric', 'chart', 'table', 'submit', 'ordered'] },
          { id: 'metric', component: 'KpiCard', title: '本月营收', value: { path: '/revenue' }, unit: '元' },
          {
            id: 'chart',
            component: 'LineChart',
            dataKey: 'trend',
            xField: 'day',
            series: [{ name: '营收', yField: 'revenue' }],
          },
          {
            id: 'table',
            component: 'Table',
            rows: { path: '/rows' },
            columns: [{ key: 'channel', title: '渠道' }, { key: 'amount', title: '营收' }],
          },
          { id: 'submit', component: 'Button', text: '提交', action: { type: 'submitNextMonthPlan' } },
          { id: 'ordered', component: 'OrderedList', items: ['先稳转化', '再控成本'] },
        ],
      },
    ])

    expect(snapshot!.spec.elements!.root.type).toBe('Column')
    expect(snapshot!.spec.elements!.metric.type).toBe('KpiDashboard')
    expect(snapshot!.spec.elements!.metric.props!.metrics).toEqual([
      expect.objectContaining({ label: '本月营收', value: 1280000, suffix: '元' }),
    ])
    expect(snapshot!.spec.elements!.chart.type).toBe('LineChart')
    expect(withDefaultElementProps(snapshot!.spec).elements!.chart.props).toMatchObject({
      data: [{ day: 'D1', revenue: 198000 }],
      x: 'day',
      y: ['revenue'],
    })
    expect(snapshot!.spec.elements!.table.type).toBe('DataTable')
    expect(snapshot!.spec.elements!.table.props).toMatchObject({
      data: [{ channel: '直销', amount: 520000 }],
      columns: [{ key: 'channel', label: '渠道' }, { key: 'amount', label: '营收' }],
    })
    expect(snapshot!.spec.elements!.submit.props).toMatchObject({ label: '提交', action: 'submitNextMonthPlan' })
    expect(snapshot!.spec.elements!.ordered.type).toBe('List')
  })

  it('normalizes html-style text tags inside mixed agent component payloads', () => {
    const validation = validateVizualNativeInput([
      { version: 'v0.10', createSurface: { surfaceId: 'bank-branches', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'bank-branches',
          components: [
            { id: 'root', component: 'Column', children: ['title', 'intro', 'chart-title', 'score-chart'], gap: 16 },
            { id: 'title', component: 'h1', children: '银行网点经营质量诊断' },
            { id: 'intro', component: 'p', text: '西城支行和科技园支行为标杆，南湖和临港需要重点关注。' },
            { id: 'chart-title', component: 'h2', value: '综合评分排行' },
            {
              id: 'score-chart',
              component: 'BarChart',
              data: [
                { branch: '西城支行', score: 77.3 },
                { branch: '南湖支行', score: 17.1 },
              ],
              x: 'branch',
              y: 'score',
            },
          ],
        },
      },
    ] as any)

    expect(validation.ok).toBe(true)
    expect(validation.issues.map(issue => issue.code)).not.toContain('vizual.unsupported_component')
    const elements = validation.normalized.snapshot!.spec.elements!
    expect(elements.title).toMatchObject({ type: 'Markdown', props: { content: '银行网点经营质量诊断' } })
    expect(elements.intro).toMatchObject({ type: 'Markdown', props: { content: '西城支行和科技园支行为标杆，南湖和临港需要重点关注。' } })
    expect(elements['chart-title']).toMatchObject({ type: 'Markdown', props: { content: '综合评分排行' } })
    expect(elements['score-chart'].type).toBe('BarChart')
  })

  it('normalizes additional cold-start component aliases without needing adapter-specific payloads', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { type: 'surface.create', surfaceId: 'alias-matrix', catalogId: 'vizual' },
      {
        type: 'surface.updateComponents',
        surfaceId: 'alias-matrix',
        components: [
          { id: 'root', component: 'Root', layout: { type: 'row' }, children: ['container', 'choice', 'slider', 'audio', 'kpis', 'grid'] },
          { id: 'container', component: 'Container', layout: { gap: 18 }, children: ['summary'] },
          { id: 'summary', component: 'Text', text: '别名归一' },
          { id: 'choice', component: 'MultipleChoice', options: ['A', 'B'], value: 'A' },
          { id: 'slider', component: 'sliderChange', label: '到达率', min: 1, max: 100, value: 30 },
          { id: 'audio', component: 'Audio', src: 'https://example.com/demo.mp3' },
          { id: 'kpis', component: 'KPIGrid', items: [{ label: '利润', value: '2300万' }] },
          { id: 'grid', component: 'DataGrid', rows: [{ channel: '官网', profit: 900 }], columns: ['channel', 42, { field: 'profit', title: '利润' }] },
        ],
      },
    ] as any)

    const elements = snapshot!.spec.elements!
    expect(elements.root.type).toBe('Row')
    expect(elements.container).toMatchObject({ type: 'Column', props: { gap: 18 } })
    expect(elements.choice.type).toBe('ChoicePicker')
    expect(elements.slider).toMatchObject({ type: 'Slider', props: { label: '到达率', min: 1, max: 100, value: 30 } })
    expect(elements.audio.type).toBe('AudioPlayer')
    expect(elements.kpis).toMatchObject({
      type: 'KpiDashboard',
      props: { metrics: [{ label: '利润', value: '2300万' }] },
    })
    expect(elements.grid).toMatchObject({
      type: 'DataTable',
      props: {
        data: [{ channel: '官网', profit: 900 }],
        columns: [
          { key: 'channel', label: 'channel' },
          { key: 'col_2', label: 'col_2' },
          { field: 'profit', title: '利润', key: 'profit', label: '利润' },
        ],
      },
    })
  })

  it('normalizes generated duplicate semantic ids from agent component arrays', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'Text', content: 'first' },
      { type: 'Text', content: 'second' },
    ] as any, 'semantic-dupes')

    const textEntries = Object.entries(snapshot!.spec.elements!)
      .filter(([, element]) => element.type === 'Text')
    expect(textEntries.map(([id]) => id)).toHaveLength(2)
    expect(textEntries.map(([id]) => id)).toContain('Text-1')
    expect(textEntries.map(([id]) => id)).toContain('Text-2')
    expect(textEntries.map(([, element]) => element.props!.content)).toEqual(['first', 'second'])
  })

  it('normalizes data-rich semantic shorthand records from natural agent descriptions', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      components: [
        {
          id: 'chartByComponent',
          component: 'chart',
          type: 'line',
          data: {
            title: '趋势',
            data: [{ month: '6月', profit: 2300 }],
          },
        },
        {
          id: 'chartByVisualization',
          visualization: 'bar',
          data: {
            title: '渠道利润',
            data: [{ channel: '官网', profit: 900 }],
          },
        },
        {
          id: 'kpiFromData',
          type: 'kpi',
          data: {
            title: '核心指标',
            kpis: [{ label: '利润', value: '2300万', delta: '下降 8%', unit: '万元' }],
          },
        },
        { id: 'kpiFromMetrics', type: 'kpi', data: { metrics: [{ label: '销量', value: '21万台' }] } },
        { id: 'kpiFromItems', type: 'kpi', data: { items: [{ label: '退货率', value: '12.7%' }] } },
        { id: 'kpiFromCards', type: 'kpi', data: { cards: [{ label: '客单价', value: '620元' }] } },
        {
          id: 'tableFromData',
          type: 'table',
          data: {
            title: '渠道明细',
            columns: ['channel', 'profit'],
            rows: [{ channel: '官网', profit: 900 }],
          },
        },
        { id: 'tableFromDataArray', type: 'table', data: { data: [{ hiddenRisk: '拼多多退货率偏高' }] } },
        { id: 'tableFromRows', type: 'table', rows: [{ risk: '退货率高' }] },
        { id: 'tableFromItems', type: 'table', items: [{ action: '控制投放' }] },
        { id: 'listFromData', type: 'list', data: { items: ['拆渠道', '看退货'] } },
        { id: 'textFromData', type: 'text', data: { text: '利润下降来自成本和退货' } },
        { id: 'textFromChildren', type: 'text', props: { children: '来自 props.children 的文本' } },
        { id: 'markdownFromMarkdown', type: 'markdown', markdown: '- 图表证明\n- 先控成本' },
        { id: 'markdownFromText', type: 'markdown', text: '文本 markdown' },
        { id: 'markdownFromValue', type: 'markdown', value: '补充说明' },
      ],
    } as any)

    const elements = snapshot!.spec.elements!
    expect(elements.chartByComponent).toMatchObject({
      type: 'LineChart',
      props: {
        title: '趋势',
        data: { title: '趋势', data: [{ month: '6月', profit: 2300 }] },
      },
    })
    expect(elements.chartByVisualization.type).toBe('BarChart')
    expect(elements.kpiFromData).toMatchObject({
      type: 'KpiDashboard',
      props: {
        title: '核心指标',
        metrics: [expect.objectContaining({
          label: '利润',
          value: '2300万',
          trend: 'down',
          trendValue: '下降 8%',
          suffix: '万元',
        })],
      },
    })
    expect(elements.kpiFromMetrics.props!.metrics).toEqual([{ label: '销量', value: '21万台' }])
    expect(elements.kpiFromItems.props!.metrics).toEqual([{ label: '退货率', value: '12.7%' }])
    expect(elements.kpiFromCards.props!.metrics).toEqual([{ label: '客单价', value: '620元' }])
    expect(elements.tableFromData.props).toMatchObject({
      title: '渠道明细',
      columns: ['channel', 'profit'],
      rows: [{ channel: '官网', profit: 900 }],
    })
    expect(elements.tableFromDataArray.props!.data).toEqual([{ hiddenRisk: '拼多多退货率偏高' }])
    expect(elements.tableFromRows.props!.data).toEqual([{ risk: '退货率高' }])
    expect(elements.tableFromItems.props!.data).toEqual([{ action: '控制投放' }])
    expect(elements.listFromData.props!.items).toEqual(['拆渠道', '看退货'])
    expect(elements.textFromData.props!.content).toBe('利润下降来自成本和退货')
    expect(elements.textFromChildren.props!.content).toBe('来自 props.children 的文本')
    expect(elements.markdownFromMarkdown.props!.content).toBe('- 图表证明\n- 先控成本')
    expect(elements.markdownFromText.props!.content).toBe('文本 markdown')
    expect(elements.markdownFromValue.props!.content).toBe('补充说明')
  })

  it('deduplicates semantic child ids when agent shorthand repeats local child ids', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      type: 'card',
      title: '重复子节点',
      children: [
        { id: 'step', type: 'text', content: '第一步' },
        { id: 'step', type: 'text', content: '第二步' },
      ],
    } as any)

    expect(snapshot!.spec.elements!.root.children).toEqual(['step', 'step-2'])
    expect(snapshot!.spec.elements!.step.props!.content).toBe('第一步')
    expect(snapshot!.spec.elements!['step-2'].props!.content).toBe('第二步')
  })

  it('normalizes plain data binding strings from native data component definitions', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.10', createSurface: { surfaceId: 'component-data-binding', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'component-data-binding',
          path: '/',
          value: { rows: [{ name: 'A', value: 10 }] },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'component-data-binding',
          components: [
            { id: 'root', component: 'BarChart', data: 'rows', x: 'name', y: 'value' },
          ],
        },
      },
    ] as any)

    expect(snapshot!.spec.elements!.root.props).toMatchObject({
      data: [{ name: 'A', value: 10 }],
      x: 'name',
      y: 'value',
    })
  })

  it('leaves non-binding chart data strings unchanged for validation instead of inventing a path', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.10', createSurface: { surfaceId: 'component-data-literal', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'component-data-literal',
          components: [
            { id: 'root', component: 'BarChart', data: 'not a state path', x: 'name', y: 'value' },
          ],
        },
      },
    ] as any)

    expect(snapshot!.spec.elements!.root.props).toMatchObject({
      data: 'not a state path',
      x: 'name',
      y: 'value',
    })
  })

  it('infers native input and display bindings from concise component path hints', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'path-hints', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'path-hints',
          path: '/',
          value: {
            form: { owner: '增长组', budget: 120000, confirmed: true, tier: 'high' },
            tiers: ['low', 'medium', 'high'],
            metrics: [{ label: '利润', value: 2300 }],
            sections: [{ id: 's1', type: 'text', content: '先控投放成本' }],
            buttonLabel: '提交方案',
          },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'path-hints',
          components: [
            { id: 'root', component: 'Column', children: ['owner', 'budget', 'tier', 'confirmed', 'narrative', 'kpi', 'submit'] },
            { id: 'owner', component: 'TextField', path: '/form/owner', onChange: { type: 'setState', statePath: '/form/owner' } },
            { id: 'budget', component: 'Slider', path: '/form/budget', onChange: { type: 'setData', path: '/form/budget' } },
            { id: 'tier', component: 'ChoicePicker', path: '/form/tier', optionsPath: '/tiers', onChange: { type: 'setData', path: '/form/tier' } },
            { id: 'confirmed', component: 'CheckBox', path: '/form/confirmed', onChange: { type: 'setData', path: '/form/confirmed' } },
            { id: 'narrative', component: 'Markdown', content: { path: '/sections/0/content' } },
            { id: 'kpi', component: 'KpiDashboard', dataPath: 'metrics' },
            { id: 'submit', component: 'Button', textPath: '/buttonLabel', action: 'submitPlan' },
          ],
        },
      },
    ])

    const elements = snapshot!.spec.elements!
    expect(elements.owner.props!.value).toEqual({ $bindState: '/form/owner' })
    expect(elements.budget.props!.value).toEqual({ $bindState: '/form/budget' })
    expect(elements.tier.props).toMatchObject({
      value: { $bindState: '/form/tier' },
      options: ['low', 'medium', 'high'],
    })
    expect(elements.confirmed.props!.checked).toEqual({ $bindState: '/form/confirmed' })
    expect(elements.narrative.props!.content).toBe('先控投放成本')
    expect(elements.kpi.props!.metrics).toEqual([{ label: '利润', value: 2300 }])
    expect(elements.submit.props).toMatchObject({ text: '提交方案', action: 'submitPlan' })
  })

  it('expands inline child component objects and binds primitive control values to onChange state paths', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'inline-child', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'inline-child',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: {
                id: 'owner',
                component: 'TextField',
                label: '负责人',
                value: '增长组',
                onChange: { type: 'setData', path: '/owner' },
              },
            },
          ],
        },
      },
    ])

    expect(snapshot!.spec.elements!.root.children).toEqual(['owner'])
    expect(snapshot!.spec.elements!.owner).toMatchObject({
      type: 'TextField',
      props: {
        label: '负责人',
        value: { $bindState: '/owner' },
      },
    })
  })

  it('synthesizes a root for generic A2UI updateComponents wrappers with parentId-only children', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'createSurface', surfaceId: 'wrapper-parent', catalogId: 'vizual' },
      {
        type: 'updateComponents',
        surfaceId: 'wrapper-parent',
        rootId: 'panel',
        components: [
          { id: 'headline', component: 'Text', parentId: 'panel', text: '排查路径' },
          { id: 'detail', component: 'Text', parentId: 'panel', text: '先看渠道，再看退货率' },
        ],
      },
    ] as any)

    expect(snapshot!.spec.root).toBe('root')
    expect(snapshot!.spec.elements!.panel).toMatchObject({
      type: 'Column',
      children: ['headline', 'detail'],
    })
    expect(snapshot!.spec.elements!.headline.props).toMatchObject({ text: '排查路径' })
  })

  it('wraps an explicit non-root A2UI rootId component with the canonical native root', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'createSurface', surfaceId: 'wrapper-explicit-root', catalogId: 'vizual' },
      {
        type: 'updateComponents',
        surfaceId: 'wrapper-explicit-root',
        rootId: 'panel',
        components: [
          { id: 'panel', component: 'Column', children: ['headline'] },
          { id: 'headline', component: 'Text', text: '显式 panel root' },
        ],
      },
    ] as any)

    expect(snapshot!.spec.elements!.root).toMatchObject({
      type: 'Column',
      children: ['panel'],
    })
    expect(snapshot!.spec.elements!.panel.children).toEqual(['headline'])
  })

  it('synthesizes a canonical root for rootless loose A2UI component wrappers', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'createSurface', surfaceId: 'wrapper-rootless', catalogId: 'vizual' },
      {
        type: 'updateComponents',
        surfaceId: 'wrapper-rootless',
        components: [
          { id: 'headline', component: 'Text', text: '没有 root 也不能空白' },
          { id: 'detail', component: 'Text', text: '自动挂到 canonical root' },
        ],
      },
    ] as any)

    expect(snapshot!.spec.elements!.root).toMatchObject({
      type: 'Column',
      children: ['headline', 'detail'],
    })
    expect(snapshot!.spec.elements!.detail.props).toMatchObject({ text: '自动挂到 canonical root' })
  })

  it('keeps generic A2UI wrapper components visible when parentId hints do not match the declared rootId', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'createSurface', surfaceId: 'wrapper-orphan-parent', catalogId: 'vizual' },
      {
        type: 'updateComponents',
        surfaceId: 'wrapper-orphan-parent',
        rootId: 'panel',
        components: [
          { id: 'headline', component: 'Text', parentId: 'unknown-parent', text: '仍然展示' },
          { id: 'detail', component: 'Text', parentId: 'unknown-parent', text: '不要空白' },
        ],
      },
    ] as any)

    expect(snapshot!.spec.elements!.root.children).toEqual(['panel'])
    expect(snapshot!.spec.elements!.panel.children).toEqual(['headline', 'detail'])
    expect(snapshot!.spec.elements!.detail.props).toMatchObject({ text: '不要空白' })
  })

  it('accepts top-level semantic KPI shorthand from cold-start MCP agents', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      type: 'kpi',
      title: '核心经营指标（截至6月）',
      columns: 3,
      metrics: [
        { label: '累计发卡量', value: '83万张', delta: '+20%' },
        { label: '活跃卡量', value: '430万张', delta: '+13.2%' },
        { label: '不良率', value: '1.42%', delta: '+0.08pp' },
      ],
    })

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(snapshot!.surfaceId).toBe('surface-1')
    expect(normalized.elements!.root).toMatchObject({
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        title: '核心经营指标（截至6月）',
        columns: 3,
      },
    })
    expect(normalized.elements!.root.props!.metrics).toEqual([
      expect.objectContaining({ label: '累计发卡量', value: '83万张', trend: 'up', trendValue: '+20%' }),
      expect.objectContaining({ label: '活跃卡量', value: '430万张', trend: 'up', trendValue: '+13.2%' }),
      expect.objectContaining({ label: '不良率', value: '1.42%', trend: 'up', trendValue: '+0.08pp' }),
    ])
  })

  it('accepts semantic dashboard shorthand without requiring layout components', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      type: 'dashboard',
      surfaceId: 'credit-card-cockpit',
      title: '全国信用卡经营驾驶舱',
      metrics: [
        { label: '累计发卡量', value: '83万张' },
        { label: '6月消费金额', value: '305亿元' },
      ],
      charts: [
        {
          type: 'combo',
          title: '月度经营趋势',
          x: '月份',
          data: [
            { 月份: '1月', 发卡量: 12, 消费金额: 215, 不良率: 1.21 },
            { 月份: '6月', 发卡量: 18, 消费金额: 305, 不良率: 1.42 },
          ],
          series: [
            { type: 'bar', y: '消费金额', name: '消费金额(亿元)' },
            { type: 'line', y: '不良率', name: '不良率', yAxisIndex: 1 },
          ],
        },
      ],
      tables: [
        {
          title: '区域经营数据',
          columns: ['分行', '发卡量', '不良率'],
          rows: [
            ['深圳', '3.2万', 0.81],
            ['成都', '1.4万', 1.82],
          ],
        },
      ],
      risks: [
        { topic: '不良率上升', detail: '6月不良率为1.42，高于1月1.21' },
      ],
      actions: [
        { owner: '经营分析组', action: '拆分渠道贡献和获客成本' },
      ],
      forms: [
        {
          title: '利润敏感性模拟',
          fields: [{ name: 'returnRate', type: 'number', label: '退货率' }],
          submitLabel: '重新计算',
        },
      ],
    })

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(snapshot!.surfaceId).toBe('credit-card-cockpit')
    expect(normalized.elements!.root).toMatchObject({ type: 'Column' })
    expect(Object.values(normalized.elements!).map(element => element.type)).toEqual([
      'Column',
      'Text',
      'KpiDashboard',
      'ComboChart',
      'DataTable',
      'DataTable',
      'DataTable',
      'FormBuilder',
    ])
    expect(normalized.elements!.kpis.props!.metrics).toHaveLength(2)
    expect(normalized.elements!['chart-1'].props).toMatchObject({
      type: 'combo',
      x: '月份',
      y: ['消费金额', '不良率'],
    })
    expect(normalized.elements!['table-1'].props).toMatchObject({
      type: 'table',
      data: [
        { 分行: '深圳', 发卡量: '3.2万', 不良率: 0.81 },
        { 分行: '成都', 发卡量: '1.4万', 不良率: 1.82 },
      ],
    })
    expect(normalized.elements!.actions.props).toMatchObject({
      title: '行动建议',
      data: [{ owner: '经营分析组', action: '拆分渠道贡献和获客成本' }],
    })
    expect(normalized.elements!['form-1'].props).toMatchObject({
      type: 'form_builder',
      title: '利润敏感性模拟',
      submitLabel: '重新计算',
    })
  })

  it('expands semantic component children from real cold-start agent tool calls', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      type: 'kpi-dashboard',
      title: '全国信用卡经营驾驶舱',
      kpis: [
        { label: '累计发卡量', value: '83万张', trend: 'up', change: '+18.6%' },
        { label: '6月消费金额', value: '305亿元', delta: '+10.5%' },
        { label: '不良率', value: '1.42%', trend: 'up', change: '+0.21pp' },
      ],
      children: [
        {
          type: 'Column',
          children: [
            {
              type: 'Row',
              children: [
                {
                  type: 'combo-chart',
                  title: '月度消费与分期趋势',
                  x: '月份',
                  y: ['消费金额', '分期金额', '不良率'],
                  data: [
                    { 月份: '1月', 消费金额: 215, 分期金额: 82, 不良率: 1.21 },
                    { 月份: '6月', 消费金额: 305, 分期金额: 115, 不良率: 1.42 },
                  ],
                },
                {
                  type: 'bar-chart',
                  title: '区域消费金额',
                  x: '分行',
                  y: '消费金额',
                  data: [
                    { 分行: '深圳', 消费金额: 55 },
                    { 分行: '成都', 消费金额: 28 },
                  ],
                },
              ],
            },
            {
              type: 'data-table',
              title: '区域风险预警',
              columns: ['分行', '发卡量', '消费金额', '不良率'],
              data: [
                { 分行: '北京', 发卡量: '2.5万', 消费金额: '45亿', 不良率: 1.43 },
                { 分行: '成都', 发卡量: '1.4万', 消费金额: '28亿', 不良率: 1.82 },
              ],
            },
          ],
        },
      ],
    })

    const normalized = withDefaultElementProps(snapshot!.spec)
    const types = Object.values(normalized.elements!).map(element => element.type)
    expect(types).toEqual(expect.arrayContaining([
      'KpiDashboard',
      'ComboChart',
      'BarChart',
      'Row',
      'DataTable',
      'Column',
      'Column',
    ]))
    expect(types).toHaveLength(7)
    expect(normalized.elements!.root).toMatchObject({
      type: 'Column',
      children: ['root-content', 'root-Column-1'],
    })
    expect(normalized.elements!['root-content']).toMatchObject({
      type: 'KpiDashboard',
      props: {
        type: 'kpi_dashboard',
        metrics: [
          expect.objectContaining({ label: '累计发卡量', value: '83万张', trend: 'up', trendValue: '+18.6%' }),
          expect.objectContaining({ label: '6月消费金额', value: '305亿元', trend: 'up', trendValue: '+10.5%' }),
          expect.objectContaining({ label: '不良率', value: '1.42%', trend: 'up', trendValue: '+0.21pp' }),
        ],
      },
    })
    expect(normalized.elements!['root-Column-1-Row-1-ComboChart-1']).toMatchObject({
      type: 'ComboChart',
      props: {
        type: 'combo',
        x: '月份',
        y: ['消费金额', '分期金额', '不良率'],
      },
    })
    expect(normalized.elements!['root-Column-1-Row-1-BarChart-2']).toMatchObject({
      type: 'BarChart',
      props: {
        type: 'bar',
        x: '分行',
        y: '消费金额',
      },
    })
    expect(normalized.elements!['root-Column-1-DataTable-2']).toMatchObject({
      type: 'DataTable',
      props: {
        type: 'table',
        data: [
          { 分行: '北京', 发卡量: '2.5万', 消费金额: '45亿', 不良率: 1.43 },
          { 分行: '成都', 发卡量: '1.4万', 消费金额: '28亿', 不良率: 1.82 },
        ],
      },
    })
    expect(types.some(type => type === 'HeroLayout')).toBe(false)
  })

  it('composes top-level semantic component arrays instead of overwriting earlier dashboard parts', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      {
        type: 'KpiDashboard',
        title: '全国信用卡经营驾驶舱',
        kpis: [
          { label: '累计发卡量', value: '83万张', trendValue: '+50%' },
          { label: '活跃卡量', value: '430万张', trendValue: '+7.9%' },
        ],
      },
      {
        type: 'Row',
        children: [
          {
            type: 'ComboChart',
            title: '月度经营趋势',
            x: '月份',
            y: ['消费金额', '不良率'],
            data: [
              { 月份: '1月', 消费金额: 215, 不良率: 1.21 },
              { 月份: '6月', 消费金额: 305, 不良率: 1.42 },
            ],
          },
          {
            type: 'DataTable',
            title: '区域经营详情',
            data: [{ 分行: '成都', 不良率: 1.82 }],
          },
        ],
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.root).toMatchObject({
      type: 'Column',
      children: ['KpiDashboard-1', 'Row-2'],
    })
    expect(Object.values(normalized.elements!).map(element => element.type)).toEqual(expect.arrayContaining([
      'Column',
      'KpiDashboard',
      'Row',
      'ComboChart',
      'DataTable',
    ]))
    expect(normalized.elements!['KpiDashboard-1'].props!.metrics).toEqual([
      expect.objectContaining({ label: '累计发卡量', value: '83万张', trend: 'up', trendValue: '+50%' }),
      expect.objectContaining({ label: '活跃卡量', value: '430万张', trend: 'up', trendValue: '+7.9%' }),
    ])
  })

  it('treats bare id/parentId component arrays as one native component tree', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { id: 'page', type: 'Column', gap: 16, align: 'stretch' },
      {
        id: 'kpi',
        type: 'KpiDashboard',
        parentId: 'page',
        title: '核心经营指标（截至6月）',
        metrics: [
          { label: '累计发卡', value: '83 万张', delta: '+18.6%' },
          { label: '不良率', value: '1.42%', delta: '+0.21pct' },
        ],
      },
      { id: 'row1', type: 'Row', parentId: 'page', gap: 16 },
      {
        id: 'trend',
        type: 'ComboChart',
        parentId: 'row1',
        title: '月度经营趋势',
        data: {
          xAxis: ['1月', '6月'],
          series: [
            { name: '发卡量', type: 'bar', data: [12, 18] },
            { name: '不良率', type: 'line', data: [1.21, 1.42], yAxisIndex: 1 },
          ],
        },
      },
      {
        id: 'mix',
        type: 'PieChart',
        parentId: 'row1',
        data: [{ name: '白领', value: 160 }, { name: '私营业主', value: 95 }],
        donut: true,
      },
      { id: 'row2', type: 'Row', parentId: 'page', gap: 16 },
      {
        id: 'region',
        type: 'BarChart',
        parentId: 'row2',
        data: {
          xAxis: ['深圳', '成都'],
          series: [{ name: '消费金额', data: [55, 28] }],
        },
      },
      {
        id: 'mkt',
        type: 'DataTable',
        parentId: 'page',
        data: [{ 活动: '推荐有礼', ROI: 7.89 }],
      },
    ] as any)

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(snapshot!.surfaceId).toBe('surface-1')
    expect(normalized.elements!.root).toMatchObject({ type: 'Column', children: ['page'] })
    expect(normalized.elements!.page).toMatchObject({ type: 'Column', children: ['kpi', 'row1', 'row2', 'mkt'] })
    expect(normalized.elements!.row1.children).toEqual(['trend', 'mix'])
    expect(normalized.elements!.row2.children).toEqual(['region'])
    expect(Object.values(normalized.elements!).map(element => element.type)).toEqual([
      'Column',
      'Column',
      'KpiDashboard',
      'Row',
      'ComboChart',
      'PieChart',
      'Row',
      'BarChart',
      'DataTable',
    ])
    expect(normalized.elements!.trend.props).toMatchObject({
      type: 'combo',
      x: 'label',
      y: ['发卡量', '不良率'],
      data: [
        { label: '1月', 发卡量: 12, 不良率: 1.21 },
        { label: '6月', 发卡量: 18, 不良率: 1.42 },
      ],
    })
    expect(normalized.elements!.mkt.props).not.toHaveProperty('parentId')
  })

  it('synthesizes a root for parentId-only bare component arrays', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { id: 'headline', type: 'Text', parentId: 'root', content: '自动补 root' },
      { id: 'detail', type: 'Text', parentId: 'root', content: '保留子节点顺序' },
    ] as any)

    expect(snapshot!.spec.elements!.root).toMatchObject({
      type: 'Column',
      children: ['headline', 'detail'],
    })
    expect(snapshot!.spec.elements!.headline.props).not.toHaveProperty('parentId')
  })

  it('keeps cyclic bare parentId component arrays visible for validation instead of producing an empty surface', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { id: 'a', type: 'Column', parentId: 'b' },
      { id: 'b', type: 'Text', parentId: 'a', content: '循环 parentId' },
    ] as any)

    expect(snapshot!.spec.elements!.root.children).toEqual(['a', 'b'])
    expect(snapshot!.spec.elements!.a.children).toEqual(['b'])
    expect(snapshot!.spec.elements!.b.props).toMatchObject({ content: '循环 parentId' })

    const validation = validateVizualNativeInput(snapshot!.spec)
    expect(validation.ok).toBe(false)
    expect(validation.issues).toContainEqual(expect.objectContaining({
      code: 'vizual.spec_cyclic_children',
    }))
  })

  it('reports removed layout components as unsupported instead of silently downgrading them', () => {
    const validation = validateVizualNativeInput([
      { version: 'v0.10', createSurface: { surfaceId: 'layout-compat', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'layout-compat',
          components: [
            { id: 'root', component: 'GridLayout', columns: 12, children: ['hero', 'split'] },
            { id: 'hero', component: 'HeroLayout', height: 320, children: ['title'] },
            { id: 'title', component: 'Text', text: '经营驾驶舱' },
            { id: 'split', component: 'SplitLayout', direction: 'horizontal', ratio: 35, children: ['chart', 'table'] },
            { id: 'chart', component: 'BarChart', data: [{ name: 'A', value: 1 }], x: 'name', y: 'value' },
            { id: 'table', component: 'DataTable', data: [{ name: 'A', value: 1 }] },
          ],
        },
      },
    ] as any)

    expect(validation.ok).toBe(false)
    expect(validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'vizual.unsupported_component', evidence: expect.objectContaining({ componentType: 'GridLayout' }) }),
      expect.objectContaining({ code: 'vizual.unsupported_component', evidence: expect.objectContaining({ componentType: 'HeroLayout' }) }),
      expect.objectContaining({ code: 'vizual.unsupported_component', evidence: expect.objectContaining({ componentType: 'SplitLayout' }) }),
    ]))
  })

  it('normalizes direct agent specs into semantic native components', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      root: 'dashboard',
      elements: {
        dashboard: { component: 'View', props: { direction: 'column' } },
        title: { component: 'Text', props: { content: '全国信用卡经营驾驶舱' } },
        'kpi-row': { component: 'View', props: { direction: 'row' } },
        kpi1: { component: 'View', props: { direction: 'column' } },
        'kpi1-label': { component: 'Text', props: { content: '累计发卡量' } },
        'kpi1-value': { component: 'Text', props: { content: '83万张' } },
        'kpi1-sub': { component: 'Text', props: { content: '↑ 6月环比+20%' } },
        kpi2: { component: 'View', props: { direction: 'column' } },
        'kpi2-label': { component: 'Text', props: { content: '活跃卡量' } },
        'kpi2-value': { component: 'Text', props: { content: '430万张' } },
        'kpi2-sub': { component: 'Text', props: { content: '↑ 较年初+13.2%' } },
        table: {
          component: 'Table',
          props: {
            columns: [{ title: '活动', key: 'activity' }, { title: '获客成本', key: 'cost' }],
            data: [{ activity: '推荐有礼', cost: '127元/人' }],
          },
        },
      },
    })

    expect(snapshot!.spec.elements!.dashboard.type).toBe('Column')
    expect(snapshot!.spec.elements!.dashboard.children).toContain('kpi-dashboard')
    expect(snapshot!.spec.elements!['kpi-dashboard'].type).toBe('KpiDashboard')
    expect(snapshot!.spec.elements!['kpi-dashboard'].props).toMatchObject({
      type: 'kpi_dashboard',
      metrics: [
        { label: '累计发卡量', value: '83万张', trend: 'up', trendValue: '6月环比+20%' },
        { label: '活跃卡量', value: '430万张', trend: 'up', trendValue: '较年初+13.2%' },
      ],
    })
    expect(snapshot!.spec.elements!.table.type).toBe('DataTable')
    expect(snapshot!.spec.elements!.table.props).toMatchObject({
      type: 'table',
      columns: [{ key: 'activity', label: '活动' }, { key: 'cost', label: '获客成本' }],
      data: [{ activity: '推荐有礼', cost: '127元/人' }],
    })
  })

  it('expands nested direct component trees from agent JSON', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      root: 'dashboard',
      elements: {
        dashboard: {
          component: 'Vizual.App',
          props: {
            title: '全国信用卡经营驾驶舱',
            children: [
              {
                component: 'Vizual.Row',
                props: {
                  children: [
                    {
                      component: 'Vizual.Column',
                      props: {
                        children: [
                          { component: 'Vizual.Text', props: { children: '累计发卡量' } },
                          { component: 'Vizual.Text', props: { children: '83万' } },
                          { component: 'Vizual.Text', props: { children: '↑ 同比+28.5%' } },
                        ],
                      },
                    },
                    {
                      component: 'Vizual.Column',
                      props: {
                        children: [
                          { component: 'Vizual.Text', props: { children: '不良率' } },
                          { component: 'Vizual.Text', props: { children: '1.42%' } },
                          { component: 'Vizual.Text', props: { children: '↑ 环比+0.08pp' } },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                component: 'Vizual.Column',
                props: {
                  children: [
                    { component: 'Vizual.Text', props: { children: '月度经营趋势' } },
                    {
                      component: 'ComboChart',
                      props: {
                        type: 'combo',
                        data: [{ label: '1月', consume: 215, npl: 1.21 }],
                        x: 'label',
                        series: [
                          { type: 'bar', y: 'consume', name: '消费金额' },
                          { type: 'line', y: 'npl', name: '不良率', yAxisIndex: 1 },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    })

    const elements = snapshot!.spec.elements!
    expect(elements.dashboard.type).toBe('Column')
    expect(elements.dashboard.children).toEqual(expect.arrayContaining([
      expect.stringContaining('row'),
      expect.stringContaining('column'),
    ]))
    const kpi = Object.values(elements).find(element => element.type === 'KpiDashboard')
    expect(kpi?.props).toMatchObject({
      type: 'kpi_dashboard',
      metrics: [
        { label: '累计发卡量', value: '83万', trend: 'up', trendValue: '同比+28.5%' },
        { label: '不良率', value: '1.42%', trend: 'up', trendValue: '环比+0.08pp' },
      ],
    })
    expect(Object.values(elements).some(element => element.type === 'ComboChart')).toBe(true)
  })

  it('unwraps VizualApp root/elements payloads from real agent output', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      root: 'dashboard',
      elements: {
        dashboard: {
          component: 'VizualApp',
          props: {
            root: 'kpi',
            elements: {
              kpi: {
                component: 'KpiDashboard',
                props: {
                  type: 'kpi_dashboard',
                  title: 'D1 vs D8',
                  columns: 2,
                  metrics: [
                    { label: '会话量', value: '1240 -> 1715', trend: 'up', trendValue: '+38.3%' },
                  ],
                },
              },
            },
          },
        },
        chart1: {
          component: 'ComboChart',
          props: {
            type: 'combo',
            title: '趋势',
            x: 'day',
            data: [{ day: 'D1', sessions: 1240 }],
            series: [{ type: 'bar', y: 'sessions', name: '会话量' }],
          },
        },
        table: {
          component: 'DataTable',
          props: {
            type: 'table',
            columns: [{ key: 'day', label: '日期' }],
            data: [{ day: 'D1' }],
          },
        },
      },
    })

    const elements = snapshot!.spec.elements!
    expect(Object.values(elements).some(element => element.type === 'VizualApp')).toBe(false)
    expect(elements.dashboard).toMatchObject({
      type: 'Column',
      children: ['dashboard-kpi', 'chart1', 'table'],
    })
    expect(elements['dashboard-kpi']).toMatchObject({
      type: 'KpiDashboard',
      props: {
        title: 'D1 vs D8',
        metrics: [
          expect.objectContaining({ label: '会话量', value: '1240 -> 1715', trend: 'up', trendValue: '+38.3%' }),
        ],
      },
    })
  })

  it('normalizes vertical and horizontal layout aliases into native composition', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch({
      root: 'root',
      elements: {
        root: {
          component: 'VerticalLayout',
          props: { gap: 24 },
          children: ['row'],
        },
        row: {
          component: 'HorizontalLayout',
          props: { gap: 8 },
          children: ['title'],
        },
        title: {
          component: 'Text',
          props: { text: '布局别名' },
        },
      },
    })

    expect(snapshot!.spec.elements!.root.type).toBe('Column')
    expect(snapshot!.spec.elements!.row.type).toBe('Row')
    expect(snapshot!.spec.elements!.title.type).toBe('Text')
  })

  it('normalizes agent root container aliases into native composition', () => {
    const core = new VizualNativeCore()
    const board = core.dispatch({
      root: 'board',
      elements: {
        board: { component: 'Board', props: { gap: 16 }, children: ['metric'] },
        metric: { component: 'KpiDashboard', props: { metrics: [{ label: '超时', value: 765 }] } },
      },
    })
    const root = core.dispatch({
      root: 'heapSteps',
      elements: {
        heapSteps: { component: 'VizualRoot', props: { className: 'p-6' }, children: ['title'] },
        title: { component: 'Text', props: { content: '最小堆步骤' } },
      },
    })

    expect(board!.spec.elements!.board.type).toBe('Column')
    expect(board!.spec.elements!.metric.type).toBe('KpiDashboard')
    expect(root!.spec.elements!.heapSteps.type).toBe('Column')
    expect(root!.spec.elements!.title.type).toBe('Text')
  })

  it('expands inline child component objects instead of silently dropping them', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'surface.create', surfaceId: 'inline', catalogId: 'vizual' },
      {
        type: 'surface.updateComponents',
        surfaceId: 'inline',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: [
              { id: 'summary', type: 'Text', props: { text: '内联文本' } },
              { id: 'chart', type: 'LineChart', props: { data: [{ day: 'D1', revenue: 10 }], xField: 'day', series: [{ yField: 'revenue' }] } },
            ],
          },
        ],
      },
    ])

    const normalized = withDefaultElementProps(snapshot!.spec)
    expect(normalized.elements!.root.children).toEqual(['summary', 'chart'])
    expect(normalized.elements!.summary).toMatchObject({ type: 'Text', props: { content: '内联文本' } })
    expect(normalized.elements!.chart).toMatchObject({
      type: 'LineChart',
      props: { data: [{ day: 'D1', revenue: 10 }], x: 'day', y: ['revenue'] },
    })
  })

  it('normalizes agent submitButton labels into FormBuilder submitLabel', () => {
    const snapshot = nativeInputsToVizualSnapshot([
      { version: 'v0.10', createSurface: { surfaceId: 'form-label', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'form-label',
          components: [
            { id: 'root', component: 'Column', children: ['planForm'] },
            {
              id: 'planForm',
              component: 'FormBuilder',
              fields: [{ name: 'owner', label: '责任人', type: 'text' }],
              submitButton: { label: '提交整改计划' },
            },
          ],
        },
      },
    ] as any)

    expect(snapshot!.spec.elements!.planForm.props).toMatchObject({
      submitLabel: '提交整改计划',
    })
    expect(snapshot!.spec.elements!.planForm.props).not.toHaveProperty('submitButton')
  })

  it('accepts cold-start agent messages without bridge payload wrappers', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      {
        type: 'createSurface',
        version: 'v0.10',
        catalogId: 'vizual',
        surface: {
          id: 'biz_monthly_dashboard_2026_04',
          title: '2026年4月经营月报交互看板',
          layout: { type: 'Column', gap: 16 },
          root: 'root',
        },
      },
      {
        type: 'updateDataModel',
        version: 'v0.10',
        catalogId: 'vizual',
        dataModel: {
          kpis: { revenue: { current: 1280000, momRate: 8.47 } },
          trendCompare: [{ period: '2026-04', revenue: 1280000 }],
          riskItems: [{ level: '高', topic: '广告成本', detail: '获客成本上升', owner: '市场部', nextStep: '下调低ROI计划' }],
          nextMonthActions: [{ priority: 'P0', action: '压降低ROI广告计划', target: 'CAC下降8%' }],
        },
      },
      {
        type: 'updateComponents',
        version: 'v0.10',
        catalogId: 'vizual',
        components: [
          {
            id: 'root',
            type: 'Container',
            props: {
              layout: { type: 'Column', gap: 16 },
              children: ['header', 'kpiBlock', 'trendBlock', 'riskList', 'actionList'],
            },
          },
          { id: 'header', type: 'Card', props: { grid: { colSpan: 12 }, title: '2026年4月经营月报' } },
          {
            id: 'kpiBlock',
            type: 'KpiDashboard',
            props: {
              grid: { colSpan: 12 },
              items: [{ label: '本月营收', value: { path: '/kpis/revenue/current' }, format: 'currencyCNY', delta: { path: '/kpis/revenue/momRate' }, deltaLabel: '较上月' }],
              columns: 4,
            },
          },
          { id: 'trendBlock', type: 'Card', props: { grid: { colSpan: 12 }, title: '趋势与对比', children: ['trendChart'] } },
          { id: 'trendChart', type: 'ComboChart', props: { data: { path: '/trendCompare' }, xField: 'period', series: [{ type: 'bar', yField: 'revenue', name: '营收' }] } },
          { id: 'riskList', type: 'RiskList', props: { items: { path: '/riskItems' }, showOwner: true, showNextStep: true } },
          { id: 'actionList', type: 'ActionList', props: { items: { path: '/nextMonthActions' }, showPriority: true, showTarget: true } },
        ],
      },
    ] as any)

    expect(snapshot!.surfaceId).toBe('biz_monthly_dashboard_2026_04')
    expect(snapshot!.spec.elements!.root).toMatchObject({
      type: 'Column',
      props: {},
      children: ['header', 'kpiBlock', 'trendBlock', 'riskList', 'actionList'],
    })
    expect(snapshot!.spec.elements!.kpiBlock.props!.items).toEqual([
      expect.objectContaining({ label: '本月营收', value: 1280000, delta: 8.47 }),
    ])
    expect(snapshot!.spec.elements!.trendBlock.children).toEqual(['trendChart'])
    expect(snapshot!.spec.elements!.riskList).toMatchObject({
      type: 'DataTable',
      props: { data: [{ level: '高', topic: '广告成本', detail: '获客成本上升', owner: '市场部', nextStep: '下调低ROI计划' }] },
    })
    expect(snapshot!.spec.elements!.actionList).toMatchObject({
      type: 'DataTable',
      props: { data: [{ priority: 'P0', action: '压降低ROI广告计划', target: 'CAC下降8%' }] },
    })
  })

  it('accepts rootId plus parentId component trees from real agents', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'createSurface', version: 'v0.10', catalogId: 'vizual', surface: { id: 'agent-tree' } },
      {
        type: 'updateComponents',
        version: 'v0.10',
        surfaceId: 'agent-tree',
        rootId: 'root',
        components: [
          { id: 'kpi', component: 'KpiDashboard', parentId: 'root', props: { items: [{ label: 'Revenue', value: 100 }] } },
          { id: 'table', component: 'DataTable', parentId: 'root', props: { data: [{ name: 'East', value: 100 }] } },
        ],
      },
    ] as any)

    expect(snapshot!.spec.elements!.root).toMatchObject({
      type: 'Column',
      children: ['kpi', 'table'],
    })
    expect(snapshot!.spec.elements!.kpi.type).toBe('KpiDashboard')
    expect(snapshot!.spec.elements!.table.type).toBe('DataTable')
  })

  it('accepts componentId/type/props component objects emitted by Claude Code', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { version: 'v0.10', createSurface: { surfaceId: 'claude-panel', catalogId: 'vizual' } },
      {
        version: 'v0.10',
        updateDataModel: {
          surfaceId: 'claude-panel',
          path: '/',
          value: {
            kpis: [{ label: '总营收', value: '1,282,000', unit: '元', trend: -7.4 }],
            stores: [{ name: '宁波天一店', revenueChange: -22.2, risk: '高' }],
          },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'claude-panel',
          components: [
            { componentId: 'root', type: 'Column', props: { gap: 16 }, children: ['kpi', 'chart', 'table', 'insight', 'form'] },
            { componentId: 'kpi', type: 'KpiDashboard', props: { title: '本周经营总览', metrics: { path: '/kpis' } } },
            { componentId: 'chart', type: 'BarChart', props: { title: '门店营收跌幅', data: { path: '/stores' }, x: 'name', y: 'revenueChange' } },
            { componentId: 'table', type: 'DataTable', props: { title: '门店明细', data: { path: '/stores' } } },
            { componentId: 'insight', type: 'Markdown', props: { content: '优先修复高风险门店。' } },
            { componentId: 'form', type: 'FormBuilder', props: { title: '整改计划', fields: [{ name: 'owner', type: 'text', label: '责任人' }] } },
          ],
        },
      },
    ] as any)

    expect(snapshot!.spec.elements!.root).toMatchObject({
      type: 'Column',
      props: { gap: 16 },
      children: ['kpi', 'chart', 'table', 'insight', 'form'],
    })
    expect(snapshot!.spec.elements!.kpi.type).toBe('KpiDashboard')
    expect(snapshot!.spec.elements!.kpi.props).toMatchObject({ title: '本周经营总览' })
    expect(snapshot!.spec.elements!.chart).toMatchObject({
      type: 'BarChart',
      props: { data: [{ name: '宁波天一店', revenueChange: -22.2, risk: '高' }], x: 'name', y: 'revenueChange' },
    })
    expect(snapshot!.spec.elements!.table.type).toBe('DataTable')
    expect(snapshot!.spec.elements!.insight.type).toBe('Markdown')
    expect(snapshot!.spec.elements!.form.type).toBe('FormBuilder')
    expect(snapshot!.spec.elements!.form.props).not.toHaveProperty('componentId')
  })

  it('normalizes real cold-start agent dialect for charts, tables, tabs, actions, and legacy layout hints', () => {
    const core = new VizualNativeCore()
    const snapshot = core.dispatch([
      { type: 'createSurface', version: 'v0.10', catalogId: 'vizual', payload: { surfaceId: 'monthly-agent' } },
      {
        type: 'updateDataModel',
        version: 'v0.10',
        catalogId: 'vizual',
        payload: {
          data: {
            ui: { activeTab: 'overview' },
            charts: {
              revenueCompare: [{ period: '本月', value: 1280000 }],
              monthlyCompare: [{ period: '本月', revenue: 1280000, cost: 760000, profit: 520000 }],
              costProfitTrend: [{ period: '本月', cost: 760000, profit: 520000 }],
              channelShare: [{ channel: '线上', value: 680000 }],
            },
            kpi: { revenue: { current: 1280000, momRate: 8.47 } },
            rows: [{ channel: '线上', revenue: 680000 }],
            form: { owner: '经营分析组', budget: 150000, measures: ['控费专项'] },
          },
        },
      },
      {
        type: 'updateComponents',
        version: 'v0.10',
        catalogId: 'vizual',
        payload: {
          components: [
            { id: 'root', type: 'Column', props: {}, children: ['top', 'kpi', 'compare', 'tabs'] },
            { id: 'top', type: 'Card', props: { gridSpan: 12, flex: 1, borderColor: '#E6EBF2' }, children: ['bar'] },
            { id: 'bar', type: 'BarChart', props: { data: { path: '/charts/revenueCompare' }, xField: 'period', yField: 'value' } },
            {
              id: 'kpi',
              type: 'KpiDashboard',
              props: {
                gridSpan: 12,
                items: [
                  {
                    label: '本月营收',
                    value: { path: '/kpi/revenue/current' },
                    unit: '元',
                    delta: { value: { path: '/kpi/revenue/momRate' }, unit: '%', direction: 'up' },
                  },
                  {
                    label: '营收环比',
                    value: { path: '/kpi/revenue/momRate' },
                    unit: '%',
                    trend: { path: '/kpi/revenue/momRate' },
                  },
                ],
              },
            },
            {
              id: 'compare',
              type: 'ComboChart',
              props: {
                gridSpan: 12,
                data: { path: '/charts/monthlyCompare' },
                xField: 'period',
                barSeries: [{ name: '营收', yField: 'revenue' }, { name: '成本', yField: 'cost' }],
                lineSeries: [{ name: '利润', yField: 'profit' }],
              },
            },
            {
              id: 'tabs',
              type: 'Tabs',
              props: {
                gridSpan: 12,
                activeTab: { path: '/ui/activeTab' },
                tabs: [{ id: 'overview', label: '经营总览' }, { id: 'action', label: '下月动作' }],
              },
              children: ['line', 'pie', 'table', 'form_owner', 'form_budget', 'form_measures', 'submit'],
            },
            {
              id: 'line',
              type: 'LineChart',
              props: {
                data: { path: '/charts/costProfitTrend' },
                xField: 'period',
                series: [{ yField: 'cost', name: '成本' }, { yField: 'profit', name: '利润' }],
              },
            },
            { id: 'pie', type: 'PieChart', props: { data: { path: '/charts/channelShare' }, nameField: 'channel', valueField: 'value' } },
            { id: 'table', type: 'DataTable', props: { rows: { path: '/rows' }, columns: [{ key: 'channel', title: '渠道' }] } },
            { id: 'form_owner', type: 'TextField', props: { label: '负责人', value: { path: '/form/owner' }, onChange: { type: 'setData', path: '/form/owner' } } },
            { id: 'form_budget', type: 'Slider', props: { label: '预算', value: { path: '/form/budget' }, min: 0, max: 300000, onChange: { type: 'setData', path: '/form/budget' } } },
            {
              id: 'form_measures',
              type: 'CheckBox',
              props: {
                label: '动作清单',
                options: ['控费专项', '线上投放优化'],
                value: { path: '/form/measures' },
                onChange: { type: 'setData', path: '/form/measures' },
              },
            },
            {
              id: 'submit',
              type: 'Button',
              props: {
                text: '提交下月动作方案',
                onClick: { action: 'submitPlan', context: { owner: { path: '/form/owner' } } },
              },
            },
          ],
        },
      },
    ] as any)

    const renderedSpec = withDefaultElementProps(snapshot!.spec)

    expect(renderedSpec.elements!.root.type).toBe('Column')
    expect(renderedSpec.elements!.root.props).not.toHaveProperty('spans')
    expect(renderedSpec.elements!.root.props).not.toHaveProperty('columns')
    expect(renderedSpec.elements!.top.props).toMatchObject({ flex: 1, borderColor: '#E6EBF2' })
    expect(renderedSpec.elements!.tabs.props).toMatchObject({
      activeTab: 'overview',
      tabs: [{ id: 'overview', label: '经营总览', key: 'overview' }, { id: 'action', label: '下月动作', key: 'action' }],
    })
    expect(renderedSpec.elements!.kpi.props!.metrics).toMatchObject([
      { label: '本月营收', value: 1280000, suffix: '元', trend: 'up', trendValue: '8.47%' },
      { label: '营收环比', value: 8.47, suffix: '%', trend: 'up', trendValue: '8.47%' },
    ])
    expect(renderedSpec.elements!.compare.props).toMatchObject({
      x: 'period',
      y: ['revenue', 'cost', 'profit'],
      data: [{ period: '本月', revenue: 1280000, cost: 760000, profit: 520000 }],
      series: [
        { type: 'bar', y: 'revenue', name: '营收' },
        { type: 'bar', y: 'cost', name: '成本' },
        { type: 'line', y: 'profit', name: '利润' },
      ],
    })
    expect(renderedSpec.elements!.bar.props).toMatchObject({ x: 'period', y: 'value', data: [{ period: '本月', value: 1280000 }] })
    expect(renderedSpec.elements!.line.props).toMatchObject({ x: 'period', y: ['cost', 'profit'] })
    expect(renderedSpec.elements!.pie.props).toMatchObject({ label: 'channel', value: 'value' })
    expect(renderedSpec.elements!.table.props).toMatchObject({
      data: [{ channel: '线上', revenue: 680000 }],
      columns: [{ key: 'channel', label: '渠道', title: '渠道' }],
    })
    expect(renderedSpec.elements!.form_owner.props!.value).toEqual({ $bindState: '/form/owner' })
    expect(renderedSpec.elements!.form_budget.props!.value).toEqual({ $bindState: '/form/budget' })
    expect(renderedSpec.elements!.form_measures.props!.value).toEqual({ $bindState: '/form/measures' })
    expect(renderedSpec.elements!.submit.props).toMatchObject({ label: '提交下月动作方案', action: 'submitPlan' })
    expect(renderedSpec.elements!.submit.on).toMatchObject({
      submitPlan: { action: 'submitPlan', params: { owner: '经营分析组' } },
    })
  })

  it('normalizes OrgChart hierarchy data wrappers into renderable tree data', () => {
    const preview = previewVizualNativeInput({
      root: 'root',
      elements: {
        root: {
          type: 'Column',
          children: ['org'],
        },
        org: {
          type: 'OrgChart',
          props: {
            data: {
              type: 'hierarchy',
              data: {
                id: 'cmd',
                label: '整改总指挥',
                children: [
                  {
                    id: 'office',
                    label: '整改办公室',
                    children: [{ id: 'risk', label: '风险整改组' }],
                  },
                ],
              },
            },
          },
        },
      },
    } as any, { surfaceId: 'org-hierarchy-wrapper' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.org.props!.data).toMatchObject([
      {
        id: 'cmd',
        label: '整改总指挥',
        children: [{ id: 'office' }],
      },
    ])
    expect(preview.issues).toEqual([])
  })

  it('normalizes GanttChart tabular columns and rows into real task records', () => {
    const preview = previewVizualNativeInput({
      root: 'gantt',
      elements: {
        gantt: {
          type: 'GanttChart',
          props: {
            data: [
              ['排查摸底', '阶段一', '2026-03-01', '2026-03-20', 100],
              ['集中攻坚', '阶段二', '2026-04-01', '2026-04-30', 60],
            ],
            taskField: 'task',
            categoryField: 'category',
            startField: 'start',
            endField: 'end',
            progressField: 'progress',
          },
        },
      },
    } as any, { surfaceId: 'gantt-tabular-rows' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.gantt.props!.tasks).toMatchObject([
      {
        task: '排查摸底',
        category: '阶段一',
        start: '2026-03-01',
        end: '2026-03-20',
        progress: 100,
      },
      {
        task: '集中攻坚',
        category: '阶段二',
        start: '2026-04-01',
        end: '2026-04-30',
        progress: 60,
      },
    ])
  })

  it('keeps outer createSurface when extracting operation wrapper arrays', () => {
    const preview = previewVizualNativeInput({
      version: 'v0.10',
      createSurface: { surfaceId: 'operation-wrapper' },
      operations: [
        {
          version: 'v0.10',
          updateComponents: {
            surfaceId: 'operation-wrapper',
            components: [
              {
                id: 'root',
                type: 'BarChart',
                props: {
                  data: [{ branch: '南山', score: 82 }],
                  x: 'branch',
                  y: 'score',
                },
              },
            ],
          },
        },
      ],
    } as any, { surfaceId: 'operation-wrapper' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.root.type).toBe('BarChart')
    expect(preview.issues).toEqual([])
  })

  it('normalizes updateComponents component maps into renderable component arrays', () => {
    const preview = previewVizualNativeInput({
      version: 'v0.10',
      createSurface: { surfaceId: 'operation-component-map' },
      operations: [
        {
          version: 'v0.10',
          updateComponents: {
            surfaceId: 'operation-component-map',
            components: {
              root: {
                type: 'Column',
                children: ['chart'],
              },
              chart: {
                type: 'BarChart',
                props: {
                  data: [{ branch: '南山', score: 82 }],
                  x: 'branch',
                  y: 'score',
                },
              },
            },
          },
        },
      ],
    } as any, { surfaceId: 'operation-component-map' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.root).toMatchObject({
      type: 'Column',
      children: ['chart'],
    })
    expect(preview.spec!.elements!.chart.type).toBe('BarChart')
    expect(preview.issues).toEqual([])
  })

  it('resolves dataModels wrappers and brace data refs for native operation charts', () => {
    const preview = previewVizualNativeInput({
      version: 'v0.10',
      createSurface: { surfaceId: 'operation-data-model-refs' },
      operations: [
        {
          version: 'v0.10',
          updateDataModel: {
            dataModels: {
              trendData: {
                type: 'collection',
                data: [
                  { month: '1月', 客流: 28.5, 综合贡献: 0.62 },
                  { month: '2月', 客流: 27.8, 综合贡献: 0.58 },
                ],
              },
            },
          },
        },
        {
          version: 'v0.10',
          updateComponents: {
            components: {
              root: {
                type: 'Column',
                children: ['combo'],
              },
              combo: {
                type: 'ComboChart',
                props: {
                  data: '{trendData}',
                  xField: 'month',
                  series: [
                    { type: 'line', y: '客流', name: '客流' },
                    { type: 'bar', y: '综合贡献', name: '综合贡献' },
                  ],
                },
              },
            },
          },
        },
      ],
    } as any, { surfaceId: 'operation-data-model-refs' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.state!.trendData).toMatchObject([
      { month: '1月', 客流: 28.5, 综合贡献: 0.62 },
      { month: '2月', 客流: 27.8, 综合贡献: 0.58 },
    ])
    expect(preview.spec!.elements!.combo.props!.data).toMatchObject([
      { month: '1月', 客流: 28.5, 综合贡献: 0.62 },
      { month: '2月', 客流: 27.8, 综合贡献: 0.58 },
    ])
    expect(preview.issues).toEqual([])
  })

  it('synthesizes FormBuilder fields from child input components emitted by agents', () => {
    const preview = previewVizualNativeInput([
      {
        version: 'v0.10',
        createSurface: { id: 'branch-feedback-form' },
      },
      {
        version: 'v0.10',
        updateComponents: {
          components: {
            'form-root': {
              type: 'FormBuilder',
              title: '网点服务问题反馈采集表',
              submitLabel: '提交反馈',
              children: ['field-branch', 'field-type', 'field-date', 'field-urgent'],
            },
            'field-branch': {
              type: 'TextField',
              label: '网点名称',
              placeholder: '请输入网点全称',
              required: true,
            },
            'field-type': {
              type: 'ChoicePicker',
              label: '问题类型',
              options: ['柜面服务', '排队等候', '系统故障'],
              required: true,
            },
            'field-date': {
              type: 'DateTimeInput',
              label: '期望回访日期',
            },
            'field-urgent': {
              type: 'CheckBox',
              label: '是否需要加急处理',
            },
          },
        },
      },
    ] as any, { surfaceId: 'branch-feedback-form' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!['form-root'].props!.fields).toMatchObject([
      { name: 'field-branch', type: 'text', label: '网点名称', required: true },
      { name: 'field-type', type: 'select', label: '问题类型', options: ['柜面服务', '排队等候', '系统故障'] },
      { name: 'field-date', type: 'date', label: '期望回访日期' },
      { name: 'field-urgent', type: 'checkbox', label: '是否需要加急处理' },
    ])
    expect(preview.spec!.elements!['form-root'].children).toBeUndefined()
    expect(preview.issues).toEqual([])
  })

  it('synthesizes FormBuilder fields for direct root/elements specs emitted by host adapters', () => {
    const preview = previewVizualNativeInput({
      root: 'form-root',
      elements: {
        'form-root': {
          type: 'FormBuilder',
          props: {
            title: '网点服务问题反馈采集表',
            submitLabel: '提交反馈',
            children: ['field-branch', 'field-type', 'field-desc'],
          },
          children: ['field-branch', 'field-type', 'field-desc'],
        },
        'field-branch': {
          type: 'TextField',
          props: {
            label: '网点名称',
            placeholder: '请输入网点全称',
            required: true,
          },
        },
        'field-type': {
          type: 'ChoicePicker',
          props: {
            label: '问题类型',
            options: ['柜面服务', '排队等候', '系统故障'],
            required: true,
          },
        },
        'field-desc': {
          type: 'TextField',
          props: {
            label: '问题简述',
            multiline: true,
          },
        },
      },
    } as any, { surfaceId: 'branch-feedback-form' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!['form-root']).toMatchObject({
      type: 'FormBuilder',
      props: {
        fields: [
          { name: 'field-branch', type: 'text', label: '网点名称', required: true },
          { name: 'field-type', type: 'select', label: '问题类型', options: ['柜面服务', '排队等候', '系统故障'] },
          { name: 'field-desc', type: 'textarea', label: '问题简述' },
        ],
      },
    })
    expect(preview.spec!.elements!['form-root'].children).toBeUndefined()
    expect(preview.issues).toEqual([])
  })

  it('preserves createSurface root/elements as initial native components before later updates', () => {
    const preview = previewVizualNativeInput([
      {
        version: 'v0.10',
        createSurface: {
          id: 'branch-feedback-form',
          root: 'form-root',
          elements: {
            'form-root': {
              type: 'FormBuilder',
              props: {
                title: '网点服务问题反馈采集表',
                submitLabel: '提交反馈',
                children: ['field-branch', 'field-type', 'field-date', 'field-urgent'],
              },
            },
          },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          components: {
            'field-branch': {
              type: 'TextField',
              props: {
                label: '网点名称',
                placeholder: '请输入网点全称',
                required: true,
              },
            },
            'field-type': {
              type: 'ChoicePicker',
              props: {
                label: '问题类型',
                options: ['柜面服务', '排队等候', '系统故障'],
                required: true,
              },
            },
            'field-date': {
              type: 'DateTimeInput',
              props: { label: '期望回访日期' },
            },
            'field-urgent': {
              type: 'CheckBox',
              props: { label: '是否需要加急处理' },
            },
          },
        },
      },
    ] as any, { surfaceId: 'branch-feedback-form' })

    expect(preview.ok).toBe(true)
    expect(preview.spec!.elements!.root).toMatchObject({
      type: 'Column',
      children: ['form-root'],
    })
    expect(preview.spec!.elements!['form-root']).toMatchObject({
      type: 'FormBuilder',
      props: {
        fields: [
          { name: 'field-branch', type: 'text', label: '网点名称', required: true },
          { name: 'field-type', type: 'select', label: '问题类型', options: ['柜面服务', '排队等候', '系统故障'] },
          { name: 'field-date', type: 'date', label: '期望回访日期' },
          { name: 'field-urgent', type: 'checkbox', label: '是否需要加急处理' },
        ],
      },
    })
    expect(preview.issues).toEqual([])
  })

  it('does not let createSurface component props overwrite the internal surface create operation type', () => {
    const preview = previewVizualNativeInput([
      {
        version: 'v0.10',
        createSurface: {
          id: 'anti-fraud-governance-dashboard',
          surfaceId: 'anti-fraud-governance-dashboard',
          type: 'Column',
          props: {
            spacing: 16,
            padding: 24,
          },
        },
      },
      {
        version: 'v0.10',
        updateComponents: {
          surfaceId: 'anti-fraud-governance-dashboard',
          components: [
            {
              id: 'root',
              type: 'Column',
              children: ['title', 'risk_chart'],
            },
            {
              id: 'title',
              parentId: 'root',
              type: 'Text',
              props: {
                text: '反诈治理专项推进面板',
              },
            },
            {
              id: 'risk_chart',
              parentId: 'root',
              type: 'BarChart',
              props: {
                data: [
                  { group: '复盘整改组', progress: 35 },
                  { group: '客户触达组', progress: 58 },
                ],
                x: 'group',
                y: 'progress',
              },
            },
          ],
        },
      },
    ] as any, { surfaceId: 'anti-fraud-governance-dashboard' })

    expect(preview.ok).toBe(true)
    expect(preview.surfaceId).toBe('anti-fraud-governance-dashboard')
    expect(preview.spec!.elements!.title.props!.text).toBe('反诈治理专项推进面板')
    expect(preview.spec!.elements!.risk_chart.type).toBe('BarChart')
    expect(preview.issues).toEqual([])
  })
})
