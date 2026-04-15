import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Form View — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid form-view fixture conforms to schema', () => {
    const fixture = {
      title: '员工入职登记表',
      fields: [
        { label: '姓名', value: '张三', type: 'text' },
        { label: '年龄', value: 28, type: 'number' },
        { label: '入职日期', value: '2026-04-01', type: 'date' },
      ],
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing title fails validation', () => {
    const fixture = { fields: [{ label: 'test' }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('missing fields fails validation', () => {
    const fixture = { title: 'Form' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('field missing required label fails', () => {
    const fixture = { title: 'Form', fields: [{ value: 'test' }] }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('minimal valid form with only required fields', () => {
    const fixture = { title: 'Simple', fields: [{ label: 'Name' }] }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
