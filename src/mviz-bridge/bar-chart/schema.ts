import { z } from 'zod'

/**
 * Zod v4 schema for mviz BarChart spec
 */
export const BarChartSchema = z.object({
  type: z.literal('bar'),
  title: z.string().optional(),
  x: z.string(),
  y: z.union([z.string(), z.array(z.string())]),
  data: z.array(z.record(z.unknown())),
  stacked: z.boolean().optional(),
  horizontal: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type BarChartProps = z.infer<typeof BarChartSchema>
