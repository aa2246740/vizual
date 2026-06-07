import { z } from 'zod'

const ComboSeriesSchema = z.object({
  type: z.enum(["bar","line","scatter"]),
  y: z.string().optional(),
  field: z.string().optional(),
  yField: z.string().optional(),
  key: z.string().optional(),
  name: z.string().optional(),
  size: z.string().optional(),
  sizeField: z.string().optional(),
  r: z.string().optional(),
  yAxisIndex: z.number().optional(),
})

export const ComboChartSchema = z.object({
  type: z.literal('combo'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.union([z.string(), ComboSeriesSchema]))]).optional(),
  data: z.array(z.record(z.unknown())),
  series: z.array(ComboSeriesSchema).optional(),
  bar: z.array(z.string()).optional(),
  line: z.array(z.string()).optional(),
  scatter: z.array(z.string()).optional(),
  scatterFields: z.array(z.string()).optional(),
  leftAxisName: z.string().optional(),
  rightAxisName: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
  action: z.string().optional(),
  selectedPoint: z.unknown().optional(),
})

export type ComboChartProps = z.infer<typeof ComboChartSchema>
