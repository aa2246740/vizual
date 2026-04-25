import { z } from 'zod'

export const WaterfallChartSchema = z.object({
  type: z.literal('waterfall'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  label: z.string().optional(), value: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type WaterfallChartProps = z.infer<typeof WaterfallChartSchema>
