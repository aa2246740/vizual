import { z } from 'zod'

export const MermaidSchema = z.object({
  type: z.literal('mermaid'),
  title: z.string().optional(),
  /** Mermaid syntax definition. `code` is canonical; `definition` and `diagram` are accepted as aliases. */
  code: z.string().optional(),
  definition: z.string().optional(),
  diagram: z.string().optional(),
  theme: z.enum(['default', 'dark', 'forest', 'neutral']).optional(),
  height: z.number().optional(),
}).transform(data => ({ ...data, code: data.code ?? data.definition ?? data.diagram ?? '' }))

export type MermaidProps = z.infer<typeof MermaidSchema>
