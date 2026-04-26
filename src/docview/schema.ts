import { z } from 'zod'

/** Schema for a single document section */
const SectionSchema = z.object({
  /** Stable section identifier for review anchors and revision patches */
  id: z.string().optional(),
  /** Section type determines rendering behavior */
  type: z.enum(['text', 'heading', 'chart', 'kpi', 'table', 'callout', 'component', 'markdown', 'freeform']),
  /** Text content for text/heading/callout sections, markdown source for markdown, raw HTML for freeform */
  content: z.string(),
  /** Structured data for chart/kpi/table/component sections (JSON object or array) */
  data: z.unknown().optional(),
  /** Heading level (1-6), only used when type is 'heading' */
  level: z.number().min(1).max(6).optional(),
  /** Callout variant style */
  variant: z.enum(['info', 'warning', 'success', 'error', 'neutral']).optional(),
  /** Component type for embedded vizual components (e.g., 'BarChart', 'KpiDashboard') */
  componentType: z.string().optional(),
  /** Optional section title */
  title: z.string().optional(),
  /**
   * AI-written semantic description of this section's meaning.
   * Included in annotation payloads so AI understands what the user is commenting on.
   * Example: "Q3 revenue KPI showing $2.4M with 12.3% YoY growth"
   */
  aiContext: z.string().optional(),
  /** Visual layout variant for this section. Unsupported combinations silently fall back to 'default'. */
  layout: z.enum(['default', 'hero', 'split', 'grid', 'banner', 'card', 'compact']).optional(),
})

export const DocViewSchema = z.object({
  type: z.literal('doc_view'),
  /** Document title */
  title: z.string().optional(),
  /** Array of document sections */
  sections: z.array(SectionSchema).min(1),
  /** Show annotation panel */
  showPanel: z.boolean().optional(),
  /** Panel position */
  panelPosition: z.enum(['right', 'left', 'bottom']).optional(),
})

export type DocViewSchemaProps = z.infer<typeof DocViewSchema>
