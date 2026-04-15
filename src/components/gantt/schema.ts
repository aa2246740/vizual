import { z } from 'zod'

export const GanttChartSchema = z.object({
      type: z.literal('gantt'),
      title: z.string().optional(),
      tasks: z.array(z.object({
        id: z.string(), name: z.string(),
        start: z.string(), end: z.string(),
        progress: z.number().min(0).max(100).optional(),
        color: z.string().optional(),
        dependencies: z.array(z.string()).optional(),
      })),
    })

export type GanttChartProps = z.infer<typeof GanttChartSchema>
