import type { ParsedSchema } from '../../core/types'

export type FormFieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'boolean'

export interface FormField {
  label: string
  value: unknown
  type: FormFieldType
}

export interface FormViewParsed extends ParsedSchema {
  title: string
  fields: FormField[]
}

const VALID_TYPES: FormFieldType[] = ['text', 'number', 'date', 'email', 'phone', 'url', 'boolean']

export function parseFormViewSchema(input: unknown): FormViewParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, title: '', fields: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (typeof obj.title !== 'string' || obj.title === '') {
    return { valid: false, title: '', fields: [], fallback: true, originalInput: input }
  }

  if (!Array.isArray(obj.fields) || obj.fields.length === 0) {
    return { valid: false, title: '', fields: [], fallback: true, originalInput: input }
  }

  const fields: FormField[] = obj.fields
    .filter((f: unknown) => f && typeof f === 'object')
    .map((f: Record<string, unknown>) => ({
      label: typeof f.label === 'string' ? f.label : '',
      value: f.value !== undefined ? f.value : '',
      type: VALID_TYPES.includes(f.type as FormFieldType) ? (f.type as FormFieldType) : 'text',
    }))
    .filter(f => f.label)

  if (fields.length === 0) {
    return { valid: false, title: '', fields: [], fallback: true, originalInput: input }
  }

  return { valid: true, title: obj.title, fields }
}
