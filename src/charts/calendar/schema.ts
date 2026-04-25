import { z } from 'zod'

export const CalendarChartSchema = z.object({
  type: z.literal('calendar'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  dateField: z.string().optional(), valueField: z.string().optional(), date: z.string().optional(), value: z.string().optional(), range: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type CalendarChartProps = z.infer<typeof CalendarChartSchema>
