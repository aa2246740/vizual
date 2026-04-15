import { z } from 'zod'

export const TextAreaSchema = z.object({
      type: z.literal('textarea'),
      content: z.string(),
      title: z.string().optional(),
      maxLines: z.number().optional(),
    })

export type TextAreaProps = z.infer<typeof TextAreaSchema>
