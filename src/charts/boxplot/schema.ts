import { z } from 'zod'

export const BoxplotChartSchema = z.object({
  type: z.literal('boxplot'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  valueField: z.string().optional(), groupField: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type BoxplotChartProps = z.infer<typeof BoxplotChartSchema>
