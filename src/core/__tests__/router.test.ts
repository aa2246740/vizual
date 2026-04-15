import { describe, it, expect, beforeEach } from 'vitest'
import { resolveSchema, registerSchema, getRegisteredSchemaIds } from '../router'
import { SchemaNotFoundError } from '../errors'
import type { SchemaHandler, ParsedSchema } from '../types'
import '../../index' // Ensure schemas are registered

/** All 16 built-in schemas must be registered and routable */
const ALL_SCHEMAS = [
  { id: 'json-viewer', handler: 'JsonViewerSchema' },
  { id: 'code-block', handler: 'CodeBlockSchema' },
  { id: 'kanban', handler: 'KanbanSchema' },
  { id: 'timeline', handler: 'TimelineSchema' },
  { id: 'feature-table', handler: 'FeatureTableSchema' },
  { id: 'data-table', handler: 'DataTableSchema' },
  { id: 'form-view', handler: 'FormViewSchema' },
  { id: 'budget-report', handler: 'BudgetReportSchema' },
  { id: 'org-chart', handler: 'OrgChartSchema' },
  { id: 'kpi-dashboard', handler: 'KpiDashboardSchema' },
  { id: 'audit-log', handler: 'AuditLogSchema' },
  { id: 'gantt-chart', handler: 'GanttChartSchema' },
  { id: 'line-chart', handler: 'LineChartSchema' },
  { id: 'bar-chart', handler: 'BarChartSchema' },
  { id: 'pie-chart', handler: 'PieChartSchema' },
  { id: 'funnel-chart', handler: 'FunnelChartSchema' },
] as const

describe('Schema Router — Unit Tests', () => {
  beforeEach(() => {
    // Register test-only schema
    const mockHandler: SchemaHandler = {
      name: 'TestSchema',
      parse: (input: unknown) => ({ valid: true, data: input }),
      render: (parsed: ParsedSchema) => {
        const el = document.createElement('div')
        el.textContent = JSON.stringify(parsed.data)
        return el
      },
    }
    registerSchema('test-schema', mockHandler)
  })

  // ── Route all 16 schemas ──────────────────────────────────────────────
  for (const { id, handler } of ALL_SCHEMAS) {
    it(`schema="${id}" routes to ${handler}`, () => {
      const h = resolveSchema(id)
      expect(h.name).toBe(handler)
    })
  }

  // ── Error handling ────────────────────────────────────────────────────
  it('unknown schema throws SchemaNotFoundError', () => {
    expect(() => resolveSchema('nonexistent')).toThrow(SchemaNotFoundError)
  })

  it('SchemaNotFoundError has correct schemaId', () => {
    try {
      resolveSchema('nonexistent')
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaNotFoundError)
      expect((e as SchemaNotFoundError).schemaId).toBe('nonexistent')
    }
  })

  it('SchemaNotFoundError message includes schema id', () => {
    try {
      resolveSchema('missing-schema')
    } catch (e) {
      expect((e as Error).message).toContain('missing-schema')
    }
  })

  // ── Registry completeness ─────────────────────────────────────────────
  it('getRegisteredSchemaIds returns at least 16 ids', () => {
    const ids = getRegisteredSchemaIds()
    expect(ids.length).toBeGreaterThanOrEqual(16)
  })

  it('getRegisteredSchemaIds includes all 16 built-in schemas', () => {
    const ids = getRegisteredSchemaIds()
    for (const { id } of ALL_SCHEMAS) {
      expect(ids).toContain(id)
    }
  })

  // ── Overwrite behavior ────────────────────────────────────────────────
  it('registering a schema with existing id overwrites it', () => {
    const custom: SchemaHandler = {
      name: 'CustomJsonViewer',
      parse: () => ({ valid: true, data: null }),
      render: () => document.createElement('div'),
    }
    registerSchema('json-viewer', custom)
    expect(resolveSchema('json-viewer').name).toBe('CustomJsonViewer')
  })

  // ── Handler parse/render integration ──────────────────────────────────
  it('handler parse() is callable', () => {
    const handler = resolveSchema('data-table')
    const result = handler.parse({ headers: ['A'], rows: [['1']] })
    expect(result.valid).toBe(true)
  })

  it('handler render() is callable', () => {
    const handler = resolveSchema('data-table')
    const parsed = handler.parse({ headers: ['A'], rows: [['1']] })
    const el = handler.render(parsed)
    expect(el).toBeInstanceOf(HTMLElement)
  })
})
