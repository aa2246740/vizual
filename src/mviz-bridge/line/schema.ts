import { z } from 'zod'

export const LineChartSchema = z.object({
  type: z.literal('line'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  smooth: z.boolean().optional(), multiSeries: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type LineChartProps = z.infer<typeof LineChartSchema>
