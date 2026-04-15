import { z } from 'zod'

export const TextBlockSchema = z.object({
      type: z.literal('text'),
      content: z.string(),
      fontSize: z.number().optional(),
      fontWeight: z.enum(['normal','bold','light']).optional(),
      align: z.enum(['left','center','right']).optional(),
      color: z.string().optional(),
    })

export type TextBlockProps = z.infer<typeof TextBlockSchema>
