import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Audit Log — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid audit-log fixture conforms to schema', () => {
    const fixture = {
      entries: [
        { timestamp: '2026-04-12T10:30:00Z', user: 'admin', action: 'user.create', resource: 'user/123', status: 'success', details: 'Created user zhangsan' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing entries fails validation', () => {
    const fixture = { data: 'irrelevant' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('entries not an array fails validation', () => {
    const fixture = { entries: 'not-array' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('entry missing required timestamp fails', () => {
    const fixture = { entries: [{ user: 'admin', action: 'delete' }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('entry missing required user fails', () => {
    const fixture = { entries: [{ timestamp: '2026-01-01', action: 'delete' }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('entry missing required action fails', () => {
    const fixture = { entries: [{ timestamp: '2026-01-01', user: 'admin' }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('minimal valid audit entry', () => {
    const fixture = { entries: [{ timestamp: '2026-01-01', user: 'admin', action: 'login' }] }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
