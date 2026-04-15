import { z } from 'zod'

export const MermaidSchema = z.object({
  type: z.literal('mermaid'),
  title: z.string().optional(),
  code: z.string(),
  theme: z.enum(['default', 'dark', 'forest', 'neutral']).optional(),
  height: z.number().optional(),
})

export type MermaidProps = z.infer<typeof MermaidSchema>
