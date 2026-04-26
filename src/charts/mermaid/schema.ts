import { z } from 'zod'

export const MermaidSchema = z.object({
  type: z.literal('mermaid'),
  title: z.string().optional(),
  /** Mermaid syntax definition. `code` is canonical; `definition` is accepted as alias. */
  code: z.string().optional(),
  definition: z.string().optional(),
  theme: z.enum(['default', 'dark', 'forest', 'neutral']).optional(),
  height: z.number().optional(),
}).transform(data => ({ ...data, code: data.code ?? data.definition ?? '' }))

export type MermaidProps = z.infer<typeof MermaidSchema>
