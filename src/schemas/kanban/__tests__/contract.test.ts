import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Kanban — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid-three-columns fixture conforms to schema', () => {
    const fixture = {
      columns: [
        { id: 'todo', title: '待办', cards: [{ id: 'c1', content: 'Task' }] },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing columns fails validation', () => {
    const fixture = { data: 'irrelevant' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('columns not an array fails validation', () => {
    const fixture = { columns: 'not-array' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('type')
  })

  it('card missing required fields fails', () => {
    const fixture = {
      columns: [
        { id: 'todo', title: '待办', cards: [{ content: 'no id' }] },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })
})
