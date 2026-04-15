import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Bar Chart — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  const validFixture = {
    title: '季度销量',
    horizontal: false,
    datasets: [
      { name: 'Q1', labels: ['产品A', '产品B'], values: [100, 200] },
      { name: 'Q2', labels: ['产品A', '产品B'], values: [150, 180] },
    ],
  }

  it('valid fixture conforms to schema', () => {
    expect(validate(validFixture)).toBe(true)
  })

  it('title is optional', () => {
    expect(validate({ datasets: validFixture.datasets })).toBe(true)
  })

  it('horizontal is optional', () => {
    expect(validate({ datasets: validFixture.datasets })).toBe(true)
  })

  it('missing datasets fails validation', () => {
    expect(validate({ title: 'No data' })).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('datasets must be array', () => {
    expect(validate({ datasets: 'string' })).toBe(false)
  })

  it('dataset missing name fails', () => {
    expect(validate({ datasets: [{ labels: ['A'], values: [1] }] })).toBe(false)
  })

  it('dataset missing labels fails', () => {
    expect(validate({ datasets: [{ name: 'S', values: [1] }] })).toBe(false)
  })

  it('dataset missing values fails', () => {
    expect(validate({ datasets: [{ name: 'S', labels: ['A'] }] })).toBe(false)
  })

  it('single dataset is valid', () => {
    expect(validate({
      datasets: [{ name: 'Q1', labels: ['A', 'B'], values: [10, 20] }],
    })).toBe(true)
  })

  it('empty datasets array is valid schema', () => {
    expect(validate({ datasets: [] })).toBe(true)
  })
})
