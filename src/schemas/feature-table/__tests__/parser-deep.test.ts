import { describe, it, expect } from 'vitest'
import { parseFeatureTableSchema } from '../parser'

describe('Feature Table — Parser Deep Tests', () => {
  it('supports "owner" as alias for "assignee"', () => {
    const parsed = parseFeatureTableSchema({
      features: [
        { name: '功能A', owner: '张三' },
      ],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.features[0].assignee).toBe('张三')
  })

  it('prefers "assignee" over "owner" when both present', () => {
    const parsed = parseFeatureTableSchema({
      features: [
        { name: '功能A', assignee: '李四', owner: '张三' },
      ],
    })
    expect(parsed.features[0].assignee).toBe('李四')
  })

  it('defaults invalid priority to "medium"', () => {
    const parsed = parseFeatureTableSchema({
      features: [
        { name: '功能A', priority: 'critical' },
      ],
    })
    expect(parsed.features[0].priority).toBe('medium')
  })

  it('defaults invalid status to "planned"', () => {
    const parsed = parseFeatureTableSchema({
      features: [
        { name: '功能A', status: 'unknown' },
      ],
    })
    expect(parsed.features[0].status).toBe('planned')
  })

  it('accepts all valid priority values', () => {
    for (const priority of ['high', 'medium', 'low']) {
      const parsed = parseFeatureTableSchema({
        features: [{ name: 'Test', priority }],
      })
      expect(parsed.features[0].priority).toBe(priority)
    }
  })

  it('accepts all valid status values', () => {
    for (const status of ['planned', 'in-progress', 'completed', 'cancelled']) {
      const parsed = parseFeatureTableSchema({
        features: [{ name: 'Test', status }],
      })
      expect(parsed.features[0].status).toBe(status)
    }
  })

  it('id defaults to empty string when missing', () => {
    const parsed = parseFeatureTableSchema({
      features: [{ name: '功能A' }],
    })
    expect(parsed.features[0].id).toBe('')
  })

  it('feature without name is filtered out', () => {
    const parsed = parseFeatureTableSchema({
      features: [
        { id: 'f1' },  // no name
        { name: '有效功能' },
      ],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.features.length).toBe(1)
    expect(parsed.features[0].name).toBe('有效功能')
  })

  it('defaults missing description to empty string', () => {
    const parsed = parseFeatureTableSchema({
      features: [{ name: '功能A' }],
    })
    expect(parsed.features[0].description).toBe('')
  })
})
