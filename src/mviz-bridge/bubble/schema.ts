import { z } from 'zod'

export const BubbleChartSchema = z.object({
  type: z.literal('bubble'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  size: z.string().optional(), groupField: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type BubbleChartProps = z.infer<typeof BubbleChartSchema>
