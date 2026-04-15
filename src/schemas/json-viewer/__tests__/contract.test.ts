import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('JSON Viewer — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid-minimal fixture conforms to schema', () => {
    const fixture = { data: { name: 'Test', value: 42 } }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('valid-edge-empty fixture conforms to schema', () => {
    const fixture = { data: {} }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('fixture with config conforms to schema', () => {
    const fixture = {
      data: { a: 1 },
      config: { maxDepth: 3, collapsedByDefault: true, showLineNumbers: false, syntaxTheme: 'light' },
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('invalid-type fixture fails schema validation with correct error', () => {
    const fixture = { data: 'not-an-object' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('type')
  })

  it('invalid-missing-key fixture fails on required field', () => {
    const fixture = { config: { maxDepth: 5 } }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('empty object fails (missing required data)', () => {
    const fixture = {}
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })
})
