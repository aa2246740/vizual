import { z } from 'zod'

export const ComboChartSchema = z.object({
  type: z.literal('combo'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]),
  data: z.array(z.record(z.unknown())),
  series: z.array(z.object({ type: z.enum(["bar","line"]), y: z.string() })).optional(),
  bar: z.array(z.string()).optional(),
  line: z.array(z.string()).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type ComboChartProps = z.infer<typeof ComboChartSchema>
