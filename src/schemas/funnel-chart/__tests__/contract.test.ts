import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Funnel Chart — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  const validFixture = {
    title: '销售转化漏斗',
    steps: [
      { label: '页面访问', value: 102847 },
      { label: '商品点击', value: 38472 },
      { label: '加入购物车', value: 12850 },
      { label: '完成支付', value: 2614 },
    ],
  }

  it('valid fixture conforms to schema', () => {
    expect(validate(validFixture)).toBe(true)
  })

  it('title is optional', () => {
    expect(validate({ steps: validFixture.steps })).toBe(true)
  })

  it('missing steps fails validation', () => {
    expect(validate({ title: 'No steps' })).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('steps must be array', () => {
    expect(validate({ steps: 'string' })).toBe(false)
  })

  it('step missing label fails', () => {
    expect(validate({ steps: [{ value: 100 }] })).toBe(false)
  })

  it('step missing value fails', () => {
    expect(validate({ steps: [{ label: 'A' }] })).toBe(false)
  })

  it('empty steps array is valid schema', () => {
    expect(validate({ steps: [] })).toBe(true)
  })

  it('step value must be number', () => {
    expect(validate({ steps: [{ label: 'A', value: '100' }] })).toBe(false)
  })
})
