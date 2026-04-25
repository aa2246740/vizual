import { z } from 'zod'

export const SankeyChartSchema = z.object({
  type: z.literal('sankey'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  nodes: z.array(z.object({ name: z.string() })).optional(), links: z.array(z.object({ source: z.string(), target: z.string(), value: z.number() })).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type SankeyChartProps = z.infer<typeof SankeyChartSchema>
