import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('KPI Dashboard — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid kpi-dashboard fixture conforms to schema', () => {
    const fixture = {
      title: 'Q2 业务概览',
      metrics: [
        { name: '月活用户', value: 1250000, target: 1500000, unit: '', trend: 'up' },
        { name: '转化率', value: 3.8, target: 4.0, unit: '%', trend: 'up' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing title fails validation', () => {
    const fixture = { metrics: [{ name: 'MAU', value: 100 }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('missing metrics fails validation', () => {
    const fixture = { title: 'Dashboard' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('metric missing required name fails', () => {
    const fixture = { title: 'Dashboard', metrics: [{ value: 100 }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('metric missing required value fails', () => {
    const fixture = { title: 'Dashboard', metrics: [{ name: 'MAU' }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('minimal valid dashboard', () => {
    const fixture = { title: 'Simple', metrics: [{ name: 'Revenue', value: 100 }] }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
