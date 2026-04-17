import { z } from 'zod'

/** Schema for a single document section */
const SectionSchema = z.object({
  /** Section type determines rendering behavior */
  type: z.enum(['text', 'heading', 'chart', 'kpi', 'table', 'callout', 'component']),
  /** Text content for text/heading/callout sections, or component JSON spec for chart/kpi/table/component */
  content: z.string(),
  /** Heading level (1-6), only used when type is 'heading' */
  level: z.number().min(1).max(6).optional(),
  /** Callout variant style */
  variant: z.enum(['info', 'warning', 'success', 'error', 'neutral']).optional(),
  /** Component type for embedded vizual components (e.g., 'BarChart', 'KpiDashboard') */
  componentType: z.string().optional(),
  /** Optional section title */
  title: z.string().optional(),
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
