import { z } from 'zod'

export const DumbbellChartSchema = z.object({
  type: z.literal('dumbbell'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  low: z.string().optional(), high: z.string().optional(), groupField: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type DumbbellChartProps = z.infer<typeof DumbbellChartSchema>
