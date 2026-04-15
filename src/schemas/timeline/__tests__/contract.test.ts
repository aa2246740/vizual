import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Timeline — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid-four-nodes fixture conforms to schema', () => {
    const fixture = {
      nodes: [
        { id: 'n1', title: 'Phase 1', status: 'completed', startDate: '2024-01-01', endDate: '2024-01-15' },
        { id: 'n2', title: 'Phase 2', status: 'in-progress', startDate: '2024-02-01' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing nodes fails validation', () => {
    const fixture = { data: 'irrelevant' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('invalid status enum fails', () => {
    const fixture = {
      nodes: [
        { id: 'n1', title: 'Test', status: 'invalid' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('node missing required id fails', () => {
    const fixture = {
      nodes: [
        { title: 'Test', status: 'completed' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('empty nodes array is valid schema (parser handles fallback)', () => {
    const fixture = { nodes: [] }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
