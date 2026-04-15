import { describe, it, expect } from 'vitest'
import { parseFormViewSchema } from '../parser'

describe('Form View — Parser Deep Tests', () => {
  it('defaults invalid type to "text"', () => {
    const parsed = parseFormViewSchema({
      title: '表单',
      fields: [{ label: '名称', value: 'test', type: 'unknown' }],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.fields[0].type).toBe('text')
  })

  it('accepts all valid field types', () => {
    const types = ['text', 'number', 'date', 'email', 'phone', 'url', 'boolean']
    for (const type of types) {
      const parsed = parseFormViewSchema({
        title: '表单',
        fields: [{ label: 'Field', value: 'x', type }],
      })
      expect(parsed.fields[0].type).toBe(type)
    }
  })

  it('defaults value to empty string when undefined', () => {
    const parsed = parseFormViewSchema({
      title: '表单',
      fields: [{ label: 'Field' }],
    })
    expect(parsed.fields[0].value).toBe('')
  })

  it('preserves null value', () => {
    const parsed = parseFormViewSchema({
      title: '表单',
      fields: [{ label: 'Field', value: null }],
    })
    expect(parsed.fields[0].value).toBe(null)
  })

  it('preserves number value', () => {
    const parsed = parseFormViewSchema({
      title: '表单',
      fields: [{ label: 'Age', value: 28 }],
    })
    expect(parsed.fields[0].value).toBe(28)
  })

  it('preserves boolean value', () => {
    const parsed = parseFormViewSchema({
      title: '表单',
      fields: [{ label: 'Active', value: true }],
    })
    expect(parsed.fields[0].value).toBe(true)
  })

  it('filters fields without label', () => {
    const parsed = parseFormViewSchema({
      title: '表单',
      fields: [
        { value: 'no label' },
        { label: '有效字段', value: 'test' },
      ],
    })
    expect(parsed.fields.length).toBe(1)
  })

  it('empty title returns invalid', () => {
    const parsed = parseFormViewSchema({
      title: '',
      fields: [{ label: 'Field' }],
    })
    expect(parsed.valid).toBe(false)
  })
})
