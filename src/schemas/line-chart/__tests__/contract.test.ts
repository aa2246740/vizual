import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Line Chart — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  const validFixture = {
    title: '月销售额趋势',
    datasets: [
      {
        name: '2025年',
        data: [
          { label: '1月', value: 28 },
          { label: '2月', value: 31 },
          { label: '3月', value: 35 },
        ],
      },
    ],
  }

  it('valid fixture conforms to schema', () => {
    expect(validate(validFixture)).toBe(true)
  })

  it('title is optional', () => {
    const fixture = { datasets: validFixture.datasets }
    expect(validate(fixture)).toBe(true)
  })

  it('missing datasets fails validation', () => {
    expect(validate({ title: 'No data' })).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('datasets must be array', () => {
    expect(validate({ datasets: 'not-array' })).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('type')
  })

  it('dataset missing name fails', () => {
    expect(validate({ datasets: [{ data: [{ label: 'A', value: 1 }] }] })).toBe(false)
  })

  it('dataset missing data fails', () => {
    expect(validate({ datasets: [{ name: 'Series' }] })).toBe(false)
  })

  it('data point missing label fails', () => {
    expect(validate({ datasets: [{ name: 'S', data: [{ value: 1 }] }] })).toBe(false)
  })

  it('data point missing value fails', () => {
    expect(validate({ datasets: [{ name: 'S', data: [{ label: 'A' }] }] })).toBe(false)
  })

  it('multiple datasets is valid', () => {
    const fixture = {
      datasets: [
        { name: 'Series A', data: [{ label: 'X', value: 1 }] },
        { name: 'Series B', data: [{ label: 'X', value: 2 }] },
      ],
    }
    expect(validate(fixture)).toBe(true)
  })

  it('empty datasets array is valid schema (parser handles fallback)', () => {
    expect(validate({ datasets: [] })).toBe(true)
  })
})
