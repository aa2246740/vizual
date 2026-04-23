import type { Annotation } from './types'

/** Semantic context for a DocView section, included in annotation payloads */
export interface SectionContext {
  sectionIndex: number
  sectionType: string
  title?: string
  aiContext?: string
  /** Auto-generated summary of section content */
  contentSummary: string
}

type SectionLike = {
  type: string
  content: string
  data?: unknown
  title?: string
  aiContext?: string
  componentType?: string
}

/**
 * Build a SectionContext for a single section.
 *
 * contentSummary is auto-generated based on section type:
 * - text/heading/callout/markdown: first 200 chars of content
 * - kpi: metric labels and values, e.g. "Revenue: $12.3M (+15%), Users: 45.2K"
 * - chart: title + series count + data point count
 * - table: column headers + row count, e.g. "Columns: [Product, Sales], 15 rows"
 * - component: componentType + title
 * - freeform: first 100 chars of content
 */
export function buildSectionContext(section: SectionLike, index: number): SectionContext {
  const ctx: SectionContext = {
    sectionIndex: index,
    sectionType: section.type,
    title: section.title,
    aiContext: section.aiContext,
    contentSummary: '',
  }

  switch (section.type) {
    case 'kpi': {
      const data = section.data as Record<string, unknown> | undefined
      if (data && Array.isArray(data.metrics)) {
        const metrics = (data.metrics as Array<Record<string, unknown>>)
          .map((m) => {
            const parts = [String(m.label || ''), String(m.value ?? '')]
            if (m.change) parts.push(String(m.change))
            return parts.join(': ')
          })
        ctx.contentSummary = metrics.join(', ')
      } else {
        ctx.contentSummary = truncate(section.content, 200)
      }
      break
    }
    case 'chart': {
      const data = section.data as Record<string, unknown> | undefined
      const title = section.title || section.content || 'Chart'
      const chartType = String(data?.chartType || data?.type || section.componentType || 'chart')
      if (data && Array.isArray(data.series)) {
        const series = data.series as Array<Record<string, unknown>>
        const totalPoints = series.reduce((sum, s) => sum + (Array.isArray(s.data) ? s.data.length : 0), 0)
        ctx.contentSummary = `${title} (${chartType}), ${series.length} series, ${totalPoints} data points`
      } else if (data && Array.isArray(data.data)) {
        const pointCount = (data.data as unknown[]).length
        ctx.contentSummary = `${title} (${chartType}), ${pointCount} data points`
      } else if (data && Array.isArray(data.nodes)) {
        const nodeCount = (data.nodes as unknown[]).length
        const linkCount = Array.isArray(data.links) ? (data.links as unknown[]).length : 0
        ctx.contentSummary = `${title} (${chartType}), ${nodeCount} nodes, ${linkCount} links`
      } else if (data && Array.isArray(data.indicators)) {
        const indicatorCount = (data.indicators as unknown[]).length
        ctx.contentSummary = `${title} (${chartType}), ${indicatorCount} dimensions`
      } else {
        ctx.contentSummary = `${title} (${chartType})`
      }
      break
    }
    case 'table': {
      const data = section.data as Record<string, unknown> | undefined
      if (data) {
        if (Array.isArray(data.columns)) {
          const cols = (data.columns as Array<unknown>).map(c =>
            typeof c === 'object' && c !== null
              ? String((c as Record<string, unknown>).label ?? (c as Record<string, unknown>).key ?? '')
              : String(c)
          )
          const rowCount = Array.isArray(data.rows)
            ? data.rows.length
            : Array.isArray(data.data)
              ? data.data.length
              : 0
          ctx.contentSummary = `Columns: [${cols.join(', ')}], ${rowCount} rows`
        }
      }
      if (!ctx.contentSummary) ctx.contentSummary = truncate(section.content, 200)
      break
    }
    case 'component': {
      const data = section.data as Record<string, unknown> | undefined
      const title = section.title || ''
      const compType = section.componentType || 'Component'

      if (data && Array.isArray(data.metrics)) {
        // KPI-style: metrics array
        const metrics = (data.metrics as Array<Record<string, unknown>>)
          .slice(0, 6)
          .map(m => `${m.label || ''}: ${m.value ?? ''}`)
          .join(', ')
        ctx.contentSummary = title ? `${title}, ${metrics}` : metrics
      } else if (data && Array.isArray(data.data)) {
        // Data array: chart-like or list
        const len = (data.data as unknown[]).length
        ctx.contentSummary = title ? `${title} (${compType}), ${len} data points` : `${compType}, ${len} data points`
      } else if (data && Array.isArray(data.columns)) {
        // Table-style: columns + rows
        const cols = (data.columns as Array<unknown>).slice(0, 5).map(c =>
          typeof c === 'object' && c !== null ? String((c as Record<string, unknown>).label ?? (c as Record<string, unknown>).key ?? '') : String(c)
        )
        const rowCount = Array.isArray(data.rows) ? data.rows.length : Array.isArray(data.data) ? data.data.length : 0
        ctx.contentSummary = title ? `${title}, Columns: [${cols.join(', ')}], ${rowCount} rows` : `Columns: [${cols.join(', ')}], ${rowCount} rows`
      } else if (data && Array.isArray(data.fields)) {
        // Form-style: fields array
        ctx.contentSummary = title ? `${title}, ${(data.fields as unknown[]).length} fields` : `${compType}, ${(data.fields as unknown[]).length} fields`
      } else if (data && Array.isArray(data.segments)) {
        // Progress bar segments
        ctx.contentSummary = title ? `${title}, ${(data.segments as unknown[]).length} segments` : `${compType}, ${(data.segments as unknown[]).length} segments`
      } else if (data && Array.isArray(data.events)) {
        // Timeline events
        ctx.contentSummary = title ? `${title}, ${(data.events as unknown[]).length} events` : `${compType}, ${(data.events as unknown[]).length} events`
      } else if (data && Array.isArray(data.tasks)) {
        // Gantt tasks
        ctx.contentSummary = title ? `${title}, ${(data.tasks as unknown[]).length} tasks` : `${compType}, ${(data.tasks as unknown[]).length} tasks`
      } else if (data && Array.isArray(data.nodes)) {
        // Org chart / Sankey nodes
        const linkCount = Array.isArray(data.links) ? (data.links as unknown[]).length : 0
        ctx.contentSummary = title ? `${title}, ${(data.nodes as unknown[]).length} nodes${linkCount ? `, ${linkCount} links` : ''}` : `${compType}, ${(data.nodes as unknown[]).length} nodes`
      } else if (title && data && 'value' in data) {
        // Simple value display (e.g. KPI metric): title + value
        ctx.contentSummary = `${title}: ${data.value}`
      } else if (data && typeof data.content === 'string' && data.content) {
        // Text content display: content text
        ctx.contentSummary = title ? `${title}, ${truncate(data.content, 60)}` : truncate(data.content, 80)
      } else if (data && typeof data.code === 'string') {
        // Code display (legacy pattern)
        const lineCount = data.code.split('\n').length
        ctx.contentSummary = title ? `${title}, ${lineCount} lines` : `${compType}, ${lineCount} lines`
      } else {
        ctx.contentSummary = title || compType
      }
      break
    }
    case 'freeform': {
      ctx.contentSummary = truncate(section.content, 100)
      break
    }
    default: {
      // text, heading, callout, markdown
      ctx.contentSummary = truncate(section.content, 200)
    }
  }

  return ctx
}

/**
 * Build a map of section contexts for all sections referenced by the given annotations.
 *
 * Only sections whose indices appear in annotation targets are included,
 * avoiding unnecessary processing of unrelated sections.
 */
export function buildSectionContextMap(
  sections: SectionLike[],
  annotations: Annotation[],
): Record<number, SectionContext> {
  const indices = new Set<number>()
  for (const ann of annotations) {
    // For target-based annotations, use the target's sectionIndex
    if (ann.target?.sectionIndex !== undefined) {
      indices.add(ann.target.sectionIndex)
    }
  }

  const map: Record<number, SectionContext> = {}
  for (const idx of indices) {
    if (idx >= 0 && idx < sections.length) {
      map[idx] = buildSectionContext(sections[idx], idx)
    }
  }
  return map
}

/** Truncate a string to max characters, appending '...' if truncated. */
function truncate(str: string, max: number): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}
