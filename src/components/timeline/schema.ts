import { z } from 'zod'

/**
 * Zod v4 schema for Timeline custom component
 */
export const TimelineSchema = z.object({
  type: z.literal('timeline'),
  title: z.string().optional(),
  events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string().optional(),
  })),
})

export type TimelineProps = z.infer<typeof TimelineSchema>
