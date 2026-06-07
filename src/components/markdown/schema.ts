import { z } from 'zod'

export const MarkdownSchema = z.object({
  content: z.string().optional().default(''),
  markdown: z.string().optional(),
  text: z.string().optional(),
})

export type MarkdownProps = z.input<typeof MarkdownSchema>
