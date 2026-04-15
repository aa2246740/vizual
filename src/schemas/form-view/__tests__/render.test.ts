import { describe, it, expect } from 'vitest'
import { parseFormViewSchema } from '../parser'
import { renderFormView } from '../renderer'

describe('Form View — Render Tests', () => {
  const fixture = {
    title: '员工入职登记表',
    fields: [
      { label: '姓名', value: '张三', type: 'text' },
      { label: '年龄', value: 28, type: 'number' },
      { label: '在职', value: true, type: 'boolean' },
      { label: '邮箱', value: 'zhang@example.com', type: 'email' },
    ],
  }

  it('renders form title', () => {
    const parsed = parseFormViewSchema(fixture)
    const container = renderFormView(parsed)
    expect(container.querySelector('[data-field="title"]')?.textContent).toBe('员工入职登记表')
  })

  it('renders correct number of fields', () => {
    const parsed = parseFormViewSchema(fixture)
    const container = renderFormView(parsed)
    expect(container.querySelectorAll('.form-field').length).toBe(4)
  })

  it('renders field labels', () => {
    const parsed = parseFormViewSchema(fixture)
    const container = renderFormView(parsed)
    const labels = Array.from(container.querySelectorAll('[data-label]')).map(el => el.textContent)
    expect(labels).toEqual(['姓名', '年龄', '在职', '邮箱'])
  })

  it('renders text field value', () => {
    const parsed = parseFormViewSchema(fixture)
    const container = renderFormView(parsed)
    const fields = container.querySelectorAll('.form-field')
    expect(fields[0].querySelector('[data-value]')?.textContent).toBe('张三')
  })

  it('renders boolean field with check/cross', () => {
    const parsed = parseFormViewSchema(fixture)
    const container = renderFormView(parsed)
    const boolField = container.querySelector('[data-field-type="boolean"] [data-value]')
    expect(boolField?.textContent).toContain('✓')
  })

  it('renders false boolean field', () => {
    const falseFixture = { title: 'Test', fields: [{ label: 'Active', value: false, type: 'boolean' }] }
    const parsed = parseFormViewSchema(falseFixture)
    const container = renderFormView(parsed)
    const boolField = container.querySelector('[data-field-type="boolean"] [data-value]')
    expect(boolField?.textContent).toContain('✗')
  })

  it('fields have correct data-field-type attributes', () => {
    const parsed = parseFormViewSchema(fixture)
    const container = renderFormView(parsed)
    const types = Array.from(container.querySelectorAll('.form-field')).map(el => el.getAttribute('data-field-type'))
    expect(types).toEqual(['text', 'number', 'boolean', 'email'])
  })
})

describe('Form View — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseFormViewSchema(null)
    const container = renderFormView(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('missing title shows fallback', () => {
    const parsed = parseFormViewSchema({ fields: [{ label: 'test' }] })
    const container = renderFormView(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty fields shows fallback', () => {
    const parsed = parseFormViewSchema({ title: 'Form', fields: [] })
    const container = renderFormView(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseFormViewSchema('bad' as any)
    expect(() => renderFormView(parsed)).not.toThrow()
    const container = renderFormView(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
