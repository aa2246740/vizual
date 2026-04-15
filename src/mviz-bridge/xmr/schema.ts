import { z } from 'zod'

export const XmrChartSchema = z.object({
  type: z.literal('xmr'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  value: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type XmrChartProps = z.infer<typeof XmrChartSchema>
