import { z } from 'zod'

export const NoteSchema = z.object({
      type: z.literal('note'),
      title: z.string().optional(),
      content: z.string(),
      variant: z.enum(['info', 'tip', 'warning', 'important']).optional(),
    })

export type NoteProps = z.infer<typeof NoteSchema>
