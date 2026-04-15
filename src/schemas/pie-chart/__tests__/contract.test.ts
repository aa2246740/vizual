import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Pie Chart — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  const validFixture = {
    title: '销售收入占比',
    donut: true,
    segments: [
      { label: '华东地区', value: 842000 },
      { label: '华南地区', value: 638000 },
      { label: '华北地区', value: 520000 },
    ],
  }

  it('valid fixture conforms to schema', () => {
    expect(validate(validFixture)).toBe(true)
  })

  it('title is optional', () => {
    expect(validate({ segments: validFixture.segments })).toBe(true)
  })

  it('donut is optional', () => {
    expect(validate({ segments: validFixture.segments })).toBe(true)
  })

  it('missing segments fails validation', () => {
    expect(validate({ title: 'No data' })).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('segments must be array', () => {
    expect(validate({ segments: 'string' })).toBe(false)
  })

  it('segment missing label fails', () => {
    expect(validate({ segments: [{ value: 100 }] })).toBe(false)
  })

  it('segment missing value fails', () => {
    expect(validate({ segments: [{ label: 'A' }] })).toBe(false)
  })

  it('empty segments array is valid schema', () => {
    expect(validate({ segments: [] })).toBe(true)
  })

  it('donut must be boolean', () => {
    expect(validate({ segments: [{ label: 'A', value: 1 }], donut: 'yes' })).toBe(false)
  })
})
