import { describe, expect, it } from 'vitest'
import {
  applyLiveControlStatePatch,
  buildFormBuilderSpecFromLiveControl,
  createLiveControlInitialState,
  createLiveControlSchema,
  getVisibleLiveControlFields,
  validateLiveControlState,
} from '../live-control'

describe('Vizual liveControl schema', () => {
  const schema = createLiveControlSchema({
    statePath: '/controls',
    fields: [
      { name: 'chartType', label: '图表类型', type: 'select', defaultValue: 'bar', options: [
        { label: '柱状图', value: 'bar' },
        { label: '折线图', value: 'line' },
      ] },
      { name: 'points', label: '数据点', type: 'slider', min: 3, max: 10, defaultValue: 5 },
      { name: 'stacked', label: '堆叠', type: 'switch', dependsOn: 'chartType', showWhen: { field: 'chartType', equals: 'bar' } },
    ],
  })

  it('creates isolated state and a FormBuilder binding spec', () => {
    const state = createLiveControlInitialState(schema)
    const spec = buildFormBuilderSpecFromLiveControl(schema)

    expect(state).toEqual({ controls: { chartType: 'bar', points: 5 } })
    expect(spec.elements?.controls?.type).toBe('FormBuilder')
    expect(spec.elements?.controls?.props?.value).toEqual({ $bindState: '/controls' })
  })

  it('validates state and evaluates dependent control visibility', () => {
    const state = { controls: { chartType: 'line', points: '8' } }
    const result = validateLiveControlState(schema, state)
    const visible = getVisibleLiveControlFields(schema, state).map(field => field.name)

    expect(result.valid).toBe(true)
    expect(result.value.points).toBe(8)
    expect(visible).toEqual(['chartType', 'points'])
  })

  it('patches only the declared state path', () => {
    const state = {
      controls: { chartType: 'bar', points: 5 },
      other: { controls: { points: 99 } },
    }
    const next = applyLiveControlStatePatch(schema, state, { points: 7 })

    expect(next.controls).toEqual({ chartType: 'bar', points: 7 })
    expect((next.other as any).controls.points).toBe(99)
  })
})
