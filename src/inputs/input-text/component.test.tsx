import { describe, it, expect } from 'vitest'
import { InputTextSchema } from './schema'

describe('InputText Schema', () => {
  it('accepts valid input_text spec with all fields', () => {
    const result = InputTextSchema.safeParse({
      type: 'input_text',
      label: 'Name',
      placeholder: 'Enter name',
      value: 'John',
      inputType: 'text',
      disabled: false,
      required: true,
      description: 'Your full name',
      error: '',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal input_text spec (type only)', () => {
    const result = InputTextSchema.safeParse({
      type: 'input_text',
    })
    expect(result.success).toBe(true)
  })

  it('rejects wrong type', () => {
    const result = InputTextSchema.safeParse({
      type: 'bar',
    })
    expect(result.success).toBe(false)
  })

  it('validates inputType enum', () => {
    const valid = InputTextSchema.safeParse({ type: 'input_text', inputType: 'email' })
    expect(valid.success).toBe(true)

    const invalid = InputTextSchema.safeParse({ type: 'input_text', inputType: 'invalid' })
    expect(invalid.success).toBe(false)
  })

  it('validates disabled is boolean', () => {
    const result = InputTextSchema.safeParse({ type: 'input_text', disabled: 'yes' })
    expect(result.success).toBe(false)
  })
})
