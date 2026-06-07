import { describe, expect, it, vi } from 'vitest'
import { VizualNativeCore } from './core'

const SURFACE_ID = 'ops-command-center'

const initialModel = {
  statusText: 'Agent 已建立初版监控台。',
  metrics: [
    { label: '高风险告警', value: 17, suffix: '条' },
    { label: '流失风险分', value: 72, suffix: '/100' },
  ],
  trend: [
    { minute: '09:00', activeUsers: 980, churnUsers: 20, alerts: 4, aiContentRatioPct: 10 },
    { minute: '10:00', activeUsers: 1120, churnUsers: 22, alerts: 5, aiContentRatioPct: 15 },
  ],
  incidents: [
    { id: 'AL-001', status: '观察' },
    { id: 'AL-004', status: '待派单' },
  ],
  recommendations: 'AI 内容占比上升不能直接当作因果结论。',
}

const updatedModel = {
  ...initialModel,
  statusText: '实时刷新完成。',
  metrics: [
    { label: '高风险告警', value: 24, suffix: '条' },
    { label: '流失风险分', value: 86, suffix: '/100' },
  ],
  trend: [
    ...initialModel.trend,
    { minute: '11:00', activeUsers: 1360, churnUsers: 115, alerts: 24, aiContentRatioPct: 68 },
  ],
  incidents: [
    ...initialModel.incidents,
    { id: 'AL-005', status: '新增' },
  ],
}

function buildSurfaceMessages(model: typeof initialModel) {
  return [
    { version: 'v0.9', createSurface: { surfaceId: SURFACE_ID, catalogId: 'vizual' } },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/', value: model } },
    { version: 'v0.9', updateComponents: { surfaceId: SURFACE_ID, components: [
      { id: 'root', component: 'Column', children: ['status', 'kpis', 'chart', 'table', 'action'] },
      { id: 'status', component: 'Text', content: { path: '/statusText' } },
      { id: 'kpis', component: 'KpiDashboard', type: 'kpi_dashboard', metrics: { path: '/metrics' } },
      { id: 'chart', component: 'ComboChart', type: 'combo', x: 'minute', y: [
        { type: 'bar', field: 'alerts', name: '告警量' },
        { type: 'line', field: 'aiContentRatioPct', name: 'AI内容占比' },
      ], data: { path: '/trend' } },
      { id: 'table', component: 'DataTable', type: 'table', data: { path: '/incidents' } },
      { id: 'action', component: 'Button', label: '派单 AL-004', action: 'acknowledge_incident' },
    ] } },
  ]
}

describe('Vizual Native Core live story flow', () => {
  it('connects AG-UI realtime events, A2UI surfaces, activity deltas, and user actions through one native core', () => {
    const onAction = vi.fn()
    const core = new VizualNativeCore({ onAction })

    core.dispatch({ type: 'RUN_STARTED', runId: 'live-story' } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_START', messageId: 'm1', role: 'assistant' } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'm1', delta: '搭建实时监控台，' } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_CHUNK', messageId: 'm1', delta: '实时更新告警。' } as any)
    core.dispatch({ type: 'TEXT_MESSAGE_END', messageId: 'm1' } as any)
    core.dispatch({ type: 'REASONING_START', messageId: 'r1' } as any)
    core.dispatch({ type: 'REASONING_MESSAGE_CONTENT', messageId: 'r1', delta: '不能直接判断因果。' } as any)
    core.dispatch({ type: 'REASONING_END', messageId: 'r1' } as any)
    core.dispatch({ type: 'STATE_SNAPSHOT', snapshot: { phase: 'initializing', riskScore: 72 } } as any)
    core.dispatch({ type: 'STATE_DELTA', delta: [{ op: 'replace', path: '/phase', value: 'building-ui' }] } as any)

    expect(core.getMessages()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'm1', status: 'complete', content: '搭建实时监控台，实时更新告警。' }),
      expect.objectContaining({ id: 'r1', role: 'reasoning', content: '不能直接判断因果。' }),
    ]))
    expect(core.getRunState()).toMatchObject({ phase: 'building-ui', riskScore: 72 })

    const args = JSON.stringify({ a2uiMessages: buildSurfaceMessages(initialModel) })
    core.dispatch({ type: 'TOOL_CALL_START', toolCallId: 'tool1', toolCallName: 'render_a2ui' } as any)
    core.dispatch({ type: 'TOOL_CALL_ARGS', toolCallId: 'tool1', delta: args.slice(0, 80) } as any)
    core.dispatch({ type: 'TOOL_CALL_CHUNK', toolCallId: 'tool1', delta: args.slice(80) } as any)
    const initialSnapshot = core.dispatch({ type: 'TOOL_CALL_END', toolCallId: 'tool1' } as any)
    core.dispatch({ type: 'TOOL_CALL_RESULT', toolCallId: 'tool1', content: JSON.stringify({ ok: true }) } as any)

    expect(initialSnapshot?.surfaceId).toBe(SURFACE_ID)
    expect(core.getFunctionCalls()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'tool1', functionName: 'render_a2ui', status: 'success' }),
    ]))
    expect(core.getDataModel(SURFACE_ID)).toMatchObject({ statusText: initialModel.statusText })
    expect(core.getSpec(SURFACE_ID)?.elements.chart.props.data).toHaveLength(2)

    core.dispatch({
      type: 'ACTIVITY_SNAPSHOT',
      messageId: 'activity-live',
      activityType: 'a2ui-surface',
      content: { a2ui_operations: [{ version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/', value: initialModel } }] },
    } as any)
    const updatedSnapshot = core.dispatch({
      type: 'ACTIVITY_DELTA',
      messageId: 'activity-live',
      patch: [{ op: 'replace', path: '/a2ui_operations/0/updateDataModel/value', value: updatedModel }],
    } as any)

    expect(updatedSnapshot?.dataModel).toMatchObject({ statusText: updatedModel.statusText })
    expect(core.getSpec(SURFACE_ID)?.elements.chart.props.data).toHaveLength(3)
    expect(core.getSpec(SURFACE_ID)?.elements.table.props.data).toHaveLength(3)

    core.createActionFromVizual('acknowledge_incident', SURFACE_ID, { incidentId: 'AL-004' })
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      name: 'acknowledge_incident',
      surfaceId: SURFACE_ID,
      context: expect.objectContaining({ incidentId: 'AL-004' }),
    }))
  })

  it('does not create a surface from incomplete streamed tool args', () => {
    const core = new VizualNativeCore()
    core.dispatch({ type: 'TOOL_CALL_START', toolCallId: 'broken', toolCallName: 'render_a2ui' } as any)
    core.dispatch({ type: 'TOOL_CALL_ARGS', toolCallId: 'broken', delta: '{"a2uiMessages":[{"version":"v0.9","createSurface":' } as any)

    expect(core.dispatch({ type: 'TOOL_CALL_END', toolCallId: 'broken' } as any)).toBeNull()
    expect(core.getSurfaceIds()).toEqual([])
  })
})
