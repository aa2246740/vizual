import { describe, it, expect } from 'vitest'
import { render } from '../index'
import '../../index' // Ensure schemas are registered

/** All 16 built-in schemas must handle invalid input gracefully */
const ALL_SCHEMAS = [
  'json-viewer', 'code-block', 'kanban', 'timeline',
  'feature-table', 'data-table', 'form-view', 'budget-report',
  'org-chart', 'kpi-dashboard', 'audit-log', 'gantt-chart',
  'line-chart', 'bar-chart', 'pie-chart', 'funnel-chart',
] as const

describe('Graceful Fallback — All 16 Schemas', () => {
  // ── Per-schema fallback with garbage input ────────────────────────────
  for (const schemaId of ALL_SCHEMAS) {
    describe(`schema: ${schemaId}`, () => {
      it('invalid object input does not throw', () => {
        expect(() => render(schemaId, { invalid: 'input' })).not.toThrow()
      })

      it('fallback marker is set on DOM', () => {
        const container = render(schemaId, { invalid: 'input' } as any)
        expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
      })

      it('original input text is preserved in fallback DOM', () => {
        const container = render(schemaId, { invalid: 'input' } as any)
        expect(container.textContent).toContain('invalid')
      })
    })
  }

  // ── Cross-schema boundary inputs ──────────────────────────────────────
  it('null input does not crash for any schema', () => {
    for (const schemaId of ALL_SCHEMAS) {
      expect(() => render(schemaId, null)).not.toThrow()
    }
  })

  it('undefined input does not crash for any schema', () => {
    for (const schemaId of ALL_SCHEMAS) {
      expect(() => render(schemaId, undefined)).not.toThrow()
    }
  })

  it('string input does not crash for any schema', () => {
    for (const schemaId of ALL_SCHEMAS) {
      expect(() => render(schemaId, 'just a string')).not.toThrow()
    }
  })

  it('number input does not crash for any schema', () => {
    for (const schemaId of ALL_SCHEMAS) {
      expect(() => render(schemaId, 42)).not.toThrow()
    }
  })

  it('array input does not crash for any schema', () => {
    for (const schemaId of ALL_SCHEMAS) {
      expect(() => render(schemaId, [1, 2, 3])).not.toThrow()
    }
  })

  it('empty object does not crash for any schema', () => {
    for (const schemaId of ALL_SCHEMAS) {
      expect(() => render(schemaId, {})).not.toThrow()
    }
  })

  it('all schemas produce fallback for null input', () => {
    for (const schemaId of ALL_SCHEMAS) {
      const el = render(schemaId, null)
      expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
    }
  })

  // ── Unknown schema falls back gracefully ──────────────────────────────
  it('unknown schema id returns fallback container', () => {
    const el = render('nonexistent-schema', { data: 'test' })
    expect(el.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
