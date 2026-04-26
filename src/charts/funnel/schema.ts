import { z } from 'zod'

export const FunnelChartSchema = z.object({
  type: z.literal('funnel'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  value: z.string().optional(), label: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type FunnelChartProps = z.infer<typeof FunnelChartSchema>
