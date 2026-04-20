import { describe, it, expect } from 'vitest'
import { tc } from '../core/theme-colors'
import { InputSelectSchema } from './schema'
import { tc } from '../core/theme-colors'

describe('InputSelect Schema', () => {
  it('accepts valid input_select spec with options', () => {
    const result = InputSelectSchema.safeParse({
      type: 'input_select',
      label: 'Department',
      options: [
        { label: 'Engineering', value: 'eng' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 1 },
      ],
      value: 'eng',
      required: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal input_select spec', () => {
    const result = InputSelectSchema.safeParse({
      type: 'input_select',
      options: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing options', () => {
    const result = InputSelectSchema.safeParse({
      type: 'input_select',
      label: 'Pick one',
    })
    expect(result.success).toBe(false)
  })

  it('accepts numeric option values', () => {
    const result = InputSelectSchema.safeParse({
      type: 'input_select',
      options: [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
      ],
    })
    expect(result.success).toBe(true)
  })
})
