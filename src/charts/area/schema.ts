import { z } from 'zod'

export const AreaChartSchema = z.object({
  type: z.literal('area'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  stacked: z.boolean().optional(), smooth: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type AreaChartProps = z.infer<typeof AreaChartSchema>
