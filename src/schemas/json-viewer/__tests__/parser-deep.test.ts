import { describe, it, expect } from 'vitest'
import { parseJsonViewerSchema } from '../parser'

describe('JSON Viewer — Parser Deep Tests', () => {
  it('defaults config to defaults when config is omitted', () => {
    const parsed = parseJsonViewerSchema({
      data: { key: 'value' },
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.config.maxDepth).toBe(5)
    expect(parsed.config.collapsedByDefault).toBe(false)
    expect(parsed.config.showLineNumbers).toBe(true)
    expect(parsed.config.syntaxTheme).toBe('dark')
  })

  it('accepts custom config', () => {
    const parsed = parseJsonViewerSchema({
      data: { key: 'value' },
      config: { maxDepth: 2, collapsedByDefault: true, showLineNumbers: false, syntaxTheme: 'light' },
    })
    expect(parsed.config.maxDepth).toBe(2)
    expect(parsed.config.collapsedByDefault).toBe(true)
    expect(parsed.config.showLineNumbers).toBe(false)
    expect(parsed.config.syntaxTheme).toBe('light')
  })

  it('syntaxTheme defaults to "dark" for any non-"light" value', () => {
    const parsed = parseJsonViewerSchema({
      data: { key: 'value' },
      config: { syntaxTheme: 'nord' as any },
    })
    expect(parsed.config.syntaxTheme).toBe('dark')
  })

  it('array data is invalid (must be object)', () => {
    const parsed = parseJsonViewerSchema({
      data: [1, 2, 3],
    })
    expect(parsed.valid).toBe(false)
  })

  it('null data is invalid', () => {
    const parsed = parseJsonViewerSchema({
      data: null,
    })
    expect(parsed.valid).toBe(false)
  })

  it('missing data is invalid', () => {
    const parsed = parseJsonViewerSchema({})
    expect(parsed.valid).toBe(false)
  })

  it('empty object data is valid', () => {
    const parsed = parseJsonViewerSchema({ data: {} })
    expect(parsed.valid).toBe(true)
  })

  it('preserves partial config with defaults', () => {
    const parsed = parseJsonViewerSchema({
      data: { key: 'val' },
      config: { maxDepth: 10 },
    })
    expect(parsed.config.maxDepth).toBe(10)
    expect(parsed.config.syntaxTheme).toBe('dark')  // default
  })
})
