import { describe, it, expect, vi } from 'vitest'
import { parseCodeBlockSchema } from '../parser'
import { renderCodeBlock } from '../renderer'
import type { ParsedSchema } from '../../../core/types'

describe('Code Block — Render Tests', () => {
  it('valid-js: renders correct number of lines', () => {
    const fixture = {
      input: { code: 'const fetchData = async (url) => {\n  const res = await fetch(url);\n  return res.json();\n};', language: 'javascript' },
      expectedLineCount: 4,
    }
    const parsed = parseCodeBlockSchema(fixture.input)
    const container = renderCodeBlock(parsed)

    const lineSpans = container.querySelectorAll('span[data-line]')
    expect(lineSpans.length).toBe(fixture.expectedLineCount)
  })

  it('valid-js: shows line numbers starting from 1', () => {
    const fixture = {
      input: { code: 'const x = 1;\nconst y = 2;', language: 'javascript' },
      expectedLineCount: 2,
    }
    const parsed = parseCodeBlockSchema(fixture.input)
    const container = renderCodeBlock(parsed)

    const firstLine = container.querySelector('span[data-line="1"]')
    const lastLine = container.querySelector('span[data-line="2"]')
    expect(firstLine).not.toBeNull()
    expect(lastLine).not.toBeNull()
  })

  it('valid-multiline: multiline code renders as separate line spans', () => {
    const fixture = {
      input: { code: 'function add(a, b) {\n  return a + b;\n}', language: 'javascript' },
    }
    const parsed = parseCodeBlockSchema(fixture.input)
    const container = renderCodeBlock(parsed)
    const lines = container.querySelectorAll('span[data-line]')
    expect(lines.length).toBe(3)
  })

  it('highlightLines: marked lines have data-highlighted attribute', () => {
    const parsed = parseCodeBlockSchema({
      code: 'line1\nline2\nline3',
      language: 'javascript',
      highlightLines: [2],
    })
    const container = renderCodeBlock(parsed)
    const highlighted = container.querySelector('span[data-line="2"][data-highlighted="true"]')
    expect(highlighted).not.toBeNull()
  })

  it('non-highlighted lines do not have data-highlighted', () => {
    const parsed = parseCodeBlockSchema({
      code: 'line1\nline2\nline3',
      language: 'javascript',
      highlightLines: [2],
    })
    const container = renderCodeBlock(parsed)
    const line1 = container.querySelector('span[data-line="1"]')
    expect(line1?.getAttribute('data-highlighted')).toBeNull()
  })
})

describe('Code Block — Copy Button Tests', () => {
  it('copy button exists with data-action="copy"', () => {
    const parsed = parseCodeBlockSchema({ code: 'const x = 1;', language: 'javascript' })
    const container = renderCodeBlock(parsed)
    const copyBtn = container.querySelector('button[data-action="copy"]')
    expect(copyBtn).not.toBeNull()
  })

  it('copy button calls navigator.clipboard.writeText', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })

    const parsed = parseCodeBlockSchema({ code: 'const x = 1;', language: 'javascript' })
    const container = renderCodeBlock(parsed)
    const copyBtn = container.querySelector('button[data-action="copy"]') as HTMLButtonElement

    copyBtn?.click()

    expect(writeTextMock).toHaveBeenCalledOnce()
    expect(writeTextMock).toHaveBeenCalledWith('const x = 1;')
  })
})

describe('Code Block — Syntax Highlight Tests', () => {
  it('javascript: keywords are highlighted', () => {
    const parsed = parseCodeBlockSchema({ code: 'const x = 1;', language: 'javascript' })
    const container = renderCodeBlock(parsed)

    const keywords = container.querySelectorAll('span[data-token="keyword"]')
    expect(keywords.length).toBeGreaterThan(0)
  })

  it('python: def keyword highlighted', () => {
    const parsed = parseCodeBlockSchema({ code: 'def hello(name):\n    print("hi")', language: 'python' })
    const container = renderCodeBlock(parsed)

    const keywords = container.querySelectorAll('span[data-token="keyword"]')
    expect(keywords.length).toBeGreaterThan(0)
  })

  it('strings are tokenized', () => {
    const parsed = parseCodeBlockSchema({ code: 'const s = "hello";', language: 'javascript' })
    const container = renderCodeBlock(parsed)

    const strings = container.querySelectorAll('span[data-token="string"]')
    expect(strings.length).toBeGreaterThan(0)
  })

  it('numbers are tokenized', () => {
    const parsed = parseCodeBlockSchema({ code: 'const x = 42;', language: 'javascript' })
    const container = renderCodeBlock(parsed)

    const numbers = container.querySelectorAll('span[data-token="number"]')
    expect(numbers.length).toBeGreaterThan(0)
  })
})

describe('Code Block — Fallback Tests', () => {
  it('empty code string shows fallback state', () => {
    const parsed = parseCodeBlockSchema({ code: '' })
    const container = renderCodeBlock(parsed)

    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('non-string code falls back without crash', () => {
    const parsed = parseCodeBlockSchema({ code: 12345 as any })
    const container = renderCodeBlock(parsed)

    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
    expect(() => renderCodeBlock(parsed)).not.toThrow()
  })

  it('null input falls back', () => {
    const parsed = parseCodeBlockSchema(null)
    expect(parsed.fallback).toBe(true)
  })

  it('undefined input falls back', () => {
    const parsed = parseCodeBlockSchema(undefined)
    expect(parsed.fallback).toBe(true)
  })
})

describe('Code Block — Parser Tests', () => {
  it('parses valid input with all fields', () => {
    const parsed = parseCodeBlockSchema({
      code: 'const x = 1;',
      language: 'javascript',
      filename: 'test.js',
      highlightLines: [1, 3],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.code).toBe('const x = 1;')
    expect(parsed.language).toBe('javascript')
    expect(parsed.filename).toBe('test.js')
    expect(parsed.highlightLines).toEqual([1, 3])
  })

  it('defaults language to javascript', () => {
    const parsed = parseCodeBlockSchema({ code: 'some code' })
    expect(parsed.language).toBe('javascript')
  })

  it('defaults highlightLines to empty array', () => {
    const parsed = parseCodeBlockSchema({ code: 'some code' })
    expect(parsed.highlightLines).toEqual([])
  })

  it('filters non-number highlightLines', () => {
    const parsed = parseCodeBlockSchema({ code: 'x', highlightLines: [1, 'bad' as any, 3] })
    expect(parsed.highlightLines).toEqual([1, 3])
  })
})
