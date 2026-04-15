import { z } from 'zod'

export const BigValueSchema = z.object({
      type: z.literal('big_value'),
      title: z.string().optional(),
      value: z.union([z.string(), z.number()]),
      subtitle: z.string().optional(),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      trend: z.enum(['up', 'down', 'flat']).optional(),
      trendValue: z.string().optional(),
    })

export type BigValueProps = z.infer<typeof BigValueSchema>
