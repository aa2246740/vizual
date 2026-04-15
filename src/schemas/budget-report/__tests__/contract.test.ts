import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Budget Report — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid budget-report fixture conforms to schema', () => {
    const fixture = {
      title: 'Q2 预算报告',
      period: '2026-Q2',
      currency: '¥',
      items: [
        { category: '研发', budget: 500000, actual: 480000, variance: 20000 },
        { category: '市场', budget: 200000, actual: 220000, variance: -20000 },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing title fails validation', () => {
    const fixture = { items: [{ category: 'R&D', budget: 100, actual: 80 }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('missing items fails validation', () => {
    const fixture = { title: 'Report' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('item missing required category fails', () => {
    const fixture = { title: 'Report', items: [{ budget: 100, actual: 80 }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('item missing required budget fails', () => {
    const fixture = { title: 'Report', items: [{ category: 'R&D', actual: 80 }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('minimal valid budget report', () => {
    const fixture = { title: 'Simple', items: [{ category: 'R&D', budget: 100, actual: 80 }] }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
