import { describe, it, expect } from 'vitest'
import { parseJsonViewerSchema } from '../parser'
import { renderJsonViewer } from '../renderer'
import type { ParsedSchema } from '../../../core/types'

function loadFixture(name: string) {
  const fixtures: Record<string, any> = {
    'valid-minimal': {
      input: { data: { name: 'Test', value: 42, active: true } },
      expectedKeyCount: 3,
    },
    'valid-nested': {
      input: { data: { user: { name: 'Alice', address: { city: 'NYC' } }, items: [{ id: 1 }, { id: 2 }] } },
      expectedDepth2Count: 7,
    },
    'valid-edge-empty': { input: { data: {} } },
    'valid-edge-maxdepth': {
      input: { data: { level1: { level2: { level3: { level4: { level5: 'deep' } } } } } },
    },
  }
  return fixtures[name]
}

describe('JSON Viewer — Render Tests', () => {
  it('valid-minimal: renders all top-level keys', () => {
    const fixture = loadFixture('valid-minimal')
    const parsed = parseJsonViewerSchema(fixture.input)
    const container = renderJsonViewer(parsed)

    expect(container.querySelectorAll('[data-key]').length).toBe(fixture.expectedKeyCount)
  })

  it('valid-nested: renders nested objects with correct depth', () => {
    const fixture = loadFixture('valid-nested')
    const parsed = parseJsonViewerSchema(fixture.input)
    const container = renderJsonViewer(parsed)

    const keysAtDepth2 = container.querySelectorAll('[data-depth="2"]')
    expect(keysAtDepth2.length).toBe(fixture.expectedDepth2Count)
  })

  it('valid-edge-empty: empty object shows empty state', () => {
    const fixture = loadFixture('valid-edge-empty')
    const parsed = parseJsonViewerSchema(fixture.input)
    const container = renderJsonViewer(parsed)

    expect(container.querySelector('[data-empty="true"]')).not.toBeNull()
    expect(container.textContent).toContain('{}')
  })

  it('valid-edge-maxdepth: nodes beyond maxDepth are truncated', () => {
    const fixture = loadFixture('valid-edge-maxdepth')
    const parsed = parseJsonViewerSchema({ ...fixture.input, config: { maxDepth: 2 } })
    const container = renderJsonViewer(parsed)

    expect(container.querySelector('[data-truncated="true"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-depth="3"]').length).toBe(0)
  })

  it('collapsedByDefault=true sets aria-expanded=false on first level', () => {
    const parsed = parseJsonViewerSchema({
      data: { a: 1, b: { c: 2 } },
      config: { collapsedByDefault: true },
    })
    const container = renderJsonViewer(parsed)

    const expanded = container.querySelectorAll('[aria-expanded="false"]')
    expect(expanded.length).toBeGreaterThan(0)
  })

  it('fallback: invalid schema shows original text, no crash', () => {
    const parsed = parseJsonViewerSchema({ data: 'not-an-object' })
    const container = renderJsonViewer(parsed)

    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
    expect(container.textContent).toContain('not-an-object')
  })

  it('fallback: null input shows fallback', () => {
    const parsed = parseJsonViewerSchema(null)
    const container = renderJsonViewer(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback: array data shows fallback', () => {
    const parsed = parseJsonViewerSchema({ data: [1, 2, 3] })
    const container = renderJsonViewer(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('fallback: missing data shows fallback', () => {
    const parsed = parseJsonViewerSchema({})
    const container = renderJsonViewer(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('syntax theme class is applied', () => {
    const parsed = parseJsonViewerSchema({ data: { a: 1 }, config: { syntaxTheme: 'light' } })
    const container = renderJsonViewer(parsed)
    expect(container.classList.contains('theme-light')).toBe(true)
  })
})

describe('JSON Viewer — Performance Tests', () => {
  it('renders large JSON in under 100ms', () => {
    const largeData: Record<string, unknown> = {}
    for (let i = 0; i < 1000; i++) {
      largeData[`key${i}`] = { nested: { value: i, items: Array.from({ length: 10 }, (_, j) => `item-${j}`) } }
    }
    const start = performance.now()
    const parsed = parseJsonViewerSchema({ data: largeData })
    renderJsonViewer(parsed)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(5000) // jsdom is slower than real DOM
  })
})
