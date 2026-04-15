import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Data Table — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid data-table fixture conforms to schema', () => {
    const fixture = {
      headers: ['月份', '收入', '支出', '利润'],
      rows: [
        ['1月', 120000, 80000, 40000],
        ['2月', 135000, 85000, 50000],
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing headers fails validation', () => {
    const fixture = { rows: [[1, 2]] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('missing rows fails validation', () => {
    const fixture = { headers: ['A', 'B'] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('headers not an array fails validation', () => {
    const fixture = { headers: 'bad', rows: [[1]] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('rows not an array fails validation', () => {
    const fixture = { headers: ['A'], rows: 'bad' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })
})
