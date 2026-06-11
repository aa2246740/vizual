import { describe, expect, it } from 'vitest'
import { toVizualRenderTree, flattenVizualRenderTree } from '../render-tree'
import { previewVizualNativeInput } from '../../native-core/preview'

describe('toVizualRenderTree', () => {
  it('flattens the id-graph into a nested, framework-agnostic tree with resolved props', () => {
    const tree = toVizualRenderTree({
      root: 'root',
      elements: {
        root: { type: 'Column', props: { gap: 16 }, children: ['title', 'chart'] },
        title: { type: 'Markdown', props: { content: '### Hi' }, children: [] },
        chart: {
          type: 'BarChart',
          props: { type: 'bar', x: 'm', y: 'v', data: [{ m: 'A', v: 1 }] },
          children: [],
        },
      },
    })

    expect(tree).not.toBeNull()
    expect(tree?.type).toBe('Column')
    expect(tree?.children.map(c => c.type)).toEqual(['Markdown', 'BarChart'])
    expect(tree?.children[1].props.data).toEqual([{ m: 'A', v: 1 }])
  })

  it('resolves {{data}} bindings from state so a non-React host gets real rows', () => {
    const tree = toVizualRenderTree({
      root: 'chart',
      state: { rows: [{ m: '1月', v: 120 }] },
      elements: {
        chart: { type: 'BarChart', props: { type: 'bar', x: 'm', y: 'v', data: '{{rows}}' }, children: [] },
      },
    })
    expect(tree?.props.data).toEqual([{ m: '1月', v: 120 }])
  })

  it('returns null when there is no renderable root', () => {
    expect(toVizualRenderTree(null)).toBeNull()
    expect(toVizualRenderTree({ elements: {} })).toBeNull()
    expect(toVizualRenderTree({ root: 'missing', elements: {} })).toBeNull()
  })

  it('skips dangling child ids and cycles instead of throwing', () => {
    const tree = toVizualRenderTree({
      root: 'a',
      elements: {
        a: { type: 'Column', children: ['b', 'ghost', 'a'] },
        b: { type: 'Text', props: { content: 'x' }, children: [] },
      },
    })
    expect(tree?.children.map(c => c.id)).toEqual(['b'])
  })

  it('works directly off a preview spec (the documented host pipeline)', () => {
    const preview = previewVizualNativeInput({
      components: [{ type: 'PieChart', data: [{ name: 'A', value: 60 }, { name: 'B', value: 40 }] }],
    } as never)
    expect(preview.ok).toBe(true)
    const tree = toVizualRenderTree(preview.spec)
    const types = flattenVizualRenderTree(tree).map(n => n.type)
    expect(types).toContain('PieChart')
  })
})
