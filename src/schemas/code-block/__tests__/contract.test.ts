import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Code Block — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid-js fixture conforms to schema', () => {
    const fixture = { code: 'const x = 1;', language: 'javascript' }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('valid-python fixture conforms to schema', () => {
    const fixture = { code: 'def hello():\n    pass', language: 'python' }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('fixture with all fields conforms to schema', () => {
    const fixture = {
      code: 'const x = 1;',
      language: 'typescript',
      filename: 'test.ts',
      highlightLines: [1, 3],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing code fails validation', () => {
    const fixture = { language: 'javascript' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('non-string code fails type validation', () => {
    const fixture = { code: 123 }
    const valid = validate(fixture)
    expect(valid).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('type')
  })

  it('invalid language enum fails', () => {
    const fixture = { code: 'x = 1', language: 'brainfuck' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('empty code string is valid schema (parser handles fallback)', () => {
    const fixture = { code: '' }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
