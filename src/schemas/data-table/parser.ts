import type { ParsedSchema } from '../../core/types'

export interface DataTableParsed extends ParsedSchema {
  headers: string[]
  rows: unknown[][]
}

export function parseDataTableSchema(input: unknown): DataTableParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, headers: [], rows: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (!Array.isArray(obj.headers) || obj.headers.length === 0) {
    return { valid: false, headers: [], rows: [], fallback: true, originalInput: input }
  }

  const headers: string[] = obj.headers
    .filter((h: unknown) => typeof h === 'string')
    .map((h: string) => h)

  if (headers.length === 0) {
    return { valid: false, headers: [], rows: [], fallback: true, originalInput: input }
  }

  const rows: unknown[][] = Array.isArray(obj.rows)
    ? obj.rows.filter((r: unknown) => Array.isArray(r)).map((r: unknown[]) => r)
    : []

  if (rows.length === 0) {
    return { valid: false, headers: [], rows: [], fallback: true, originalInput: input }
  }

  return { valid: true, headers, rows }
}
