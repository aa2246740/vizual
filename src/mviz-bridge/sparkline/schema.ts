import { z } from 'zod'

export const SparklineChartSchema = z.object({
  type: z.literal('sparkline'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  sparkType: z.enum(["line","bar","pct_bar"]).optional(), value: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type SparklineChartProps = z.infer<typeof SparklineChartSchema>
