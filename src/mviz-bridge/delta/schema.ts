import { z } from 'zod'

export const DeltaSchema = z.object({
      type: z.literal('delta'),
      value: z.union([z.string(), z.number()]),
      previousValue: z.union([z.string(), z.number()]).optional(),
      label: z.string().optional(),
      direction: z.enum(['up', 'down', 'flat']).optional(),
      showPercentage: z.boolean().optional(),
    })

export type DeltaProps = z.infer<typeof DeltaSchema>
