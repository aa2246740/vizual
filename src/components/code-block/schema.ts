import { z } from 'zod'

export const CodeBlockSchema = z.object({
      type: z.literal('code_block'),
      title: z.string().optional(),
      code: z.string(),
      language: z.string().optional(),
      showLineNumbers: z.boolean().optional(),
    })

export type CodeBlockProps = z.infer<typeof CodeBlockSchema>
