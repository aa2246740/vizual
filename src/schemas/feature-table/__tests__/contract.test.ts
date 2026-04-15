import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Feature Table — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid feature-table fixture conforms to schema', () => {
    const fixture = {
      features: [
        { id: 'f1', name: '用户登录', priority: 'high', status: 'in-progress', description: '实现用户登录功能', assignee: '张三' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing features fails validation', () => {
    const fixture = { data: 'irrelevant' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('features not an array fails validation', () => {
    const fixture = { features: 'not-array' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('type')
  })

  it('feature missing required id fails', () => {
    const fixture = {
      features: [{ name: 'Missing ID' }],
    }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('feature missing required name fails', () => {
    const fixture = {
      features: [{ id: 'f1' }],
    }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('minimal valid feature with only required fields', () => {
    const fixture = {
      features: [{ id: 'f1', name: 'Feature 1' }],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
