import { z } from 'zod'

export const HistogramChartSchema = z.object({
  type: z.literal('histogram'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  value: z.string().optional(), bins: z.number().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type HistogramChartProps = z.infer<typeof HistogramChartSchema>
