import { describe, it, expect } from 'vitest'
import { parseDataTableSchema } from '../parser'

describe('Data Table — Parser Deep Tests', () => {
  it('filters non-string headers', () => {
    const parsed = parseDataTableSchema({
      headers: ['Name', 42, null, 'Value'],
      rows: [['A', 'x', 'y', '100']],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.headers).toEqual(['Name', 'Value'])
  })

  it('handles rows with fewer cells than headers', () => {
    const parsed = parseDataTableSchema({
      headers: ['A', 'B', 'C'],
      rows: [['1']],  // only 1 cell for 3 headers
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.rows[0].length).toBe(1)
  })

  it('handles rows with more cells than headers', () => {
    const parsed = parseDataTableSchema({
      headers: ['A'],
      rows: [['1', '2', '3']],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.rows[0].length).toBe(3)
  })

  it('handles null cell values', () => {
    const parsed = parseDataTableSchema({
      headers: ['A'],
      rows: [[null]],
    })
    expect(parsed.valid).toBe(true)
  })

  it('handles undefined cell values', () => {
    const parsed = parseDataTableSchema({
      headers: ['A'],
      rows: [[undefined]],
    })
    expect(parsed.valid).toBe(true)
  })

  it('empty headers returns invalid', () => {
    const parsed = parseDataTableSchema({
      headers: [],
      rows: [['1']],
    })
    expect(parsed.valid).toBe(false)
  })

  it('non-array headers returns invalid', () => {
    const parsed = parseDataTableSchema({
      headers: 'not-array',
      rows: [['1']],
    } as any)
    expect(parsed.valid).toBe(false)
  })

  it('non-array rows returns invalid', () => {
    const parsed = parseDataTableSchema({
      headers: ['A'],
      rows: 'not-array',
    } as any)
    expect(parsed.valid).toBe(false)
  })
})
