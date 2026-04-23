import { describe, it, expect } from 'vitest'
import { FormBuilderSchema } from './schema'

describe('FormBuilder Schema', () => {
  const validForm = {
    type: 'form_builder',
    title: 'Contact Form',
    columns: 2,
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validation: [
          { rule: 'required', message: 'Email is required' },
          { rule: 'email', message: 'Invalid email' },
        ],
      },
      {
        name: 'department',
        label: 'Department',
        type: 'select',
        options: [
          { label: 'Engineering', value: 'eng' },
          { label: 'Design', value: 'design' },
        ],
        dependsOn: 'role',
        showWhen: 'manager',
      },
      {
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        validation: [
          { rule: 'maxLength', value: 500 },
        ],
      },
    ],
  }

  it('accepts valid form_builder spec', () => {
    const result = FormBuilderSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('accepts minimal form_builder with empty fields', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects wrong type', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_view',
      fields: [],
    })
    expect(result.success).toBe(false)
  })

  it('validates field type enum', () => {
    const valid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{ name: 'f1', type: 'text' }],
    })
    expect(valid.success).toBe(true)

    const invalid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{ name: 'f1', type: 'invalid_type' }],
    })
    expect(invalid.success).toBe(false)
  })

  it('validates validation rule enum', () => {
    const valid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{
        name: 'f1', type: 'text',
        validation: [{ rule: 'required' }, { rule: 'email' }, { rule: 'minLength', value: 3 }],
      }],
    })
    expect(valid.success).toBe(true)

    const invalid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{
        name: 'f1', type: 'text',
        validation: [{ rule: 'customValidator' }],
      }],
    })
    expect(invalid.success).toBe(false)
  })

  it('supports all field types', () => {
    const types = ['text', 'email', 'password', 'number', 'url', 'tel', 'select', 'file', 'textarea']
    for (const t of types) {
      const result = FormBuilderSchema.safeParse({
        type: 'form_builder',
        fields: [{ name: `field_${t}`, type: t }],
      })
      expect(result.success, `Field type "${t}" should be valid`).toBe(true)
    }
  })

  it('supports dependsOn and showWhen for conditional fields', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [
        { name: 'role', type: 'select', options: [{ label: 'Manager', value: 'mgr' }] },
        { name: 'team', type: 'select', dependsOn: 'role', showWhen: 'mgr', options: [] },
      ],
    })
    expect(result.success).toBe(true)
  })
})
