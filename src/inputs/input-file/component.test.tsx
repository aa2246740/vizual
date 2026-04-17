import { describe, it, expect } from 'vitest'
import { InputFileSchema } from './schema'

describe('InputFile Schema', () => {
  it('accepts valid input_file spec', () => {
    const result = InputFileSchema.safeParse({
      type: 'input_file',
      label: 'Upload Document',
      accept: '.pdf,.doc',
      multiple: true,
      disabled: false,
      description: 'Upload your document',
      asBase64: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal input_file spec', () => {
    const result = InputFileSchema.safeParse({
      type: 'input_file',
    })
    expect(result.success).toBe(true)
  })

  it('rejects wrong type', () => {
    const result = InputFileSchema.safeParse({
      type: 'input_text',
    })
    expect(result.success).toBe(false)
  })

  it('validates multiple is boolean', () => {
    const valid = InputFileSchema.safeParse({ type: 'input_file', multiple: false })
    expect(valid.success).toBe(true)

    const invalid = InputFileSchema.safeParse({ type: 'input_file', multiple: 'yes' })
    expect(invalid.success).toBe(false)
  })
})
