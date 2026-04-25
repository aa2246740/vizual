import { z } from 'zod'

export const HeatmapChartSchema = z.object({
  type: z.literal('heatmap'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  xField: z.string().optional(), yField: z.string().optional(), valueField: z.string().optional(), value: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type HeatmapChartProps = z.infer<typeof HeatmapChartSchema>
