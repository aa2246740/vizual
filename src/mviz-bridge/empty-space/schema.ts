import { z } from 'zod'

export const EmptySpaceSchema = z.object({
      type: z.literal('empty_space'),
      height: z.number().optional(),
    })

export type EmptySpaceProps = z.infer<typeof EmptySpaceSchema>
