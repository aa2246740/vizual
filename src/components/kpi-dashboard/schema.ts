import { z } from 'zod'

export const KpiDashboardSchema = z.object({
      type: z.literal('kpi_dashboard'),
      title: z.string().optional(),
      metrics: z.array(z.object({
        label: z.string(), value: z.union([z.string(), z.number()]),
        prefix: z.string().optional(), suffix: z.string().optional(),
        trend: z.enum(['up','down','flat']).optional(), trendValue: z.string().optional(),
        color: z.string().optional(),
      })),
      columns: z.number().optional(),
    })

export type KpiDashboardProps = z.infer<typeof KpiDashboardSchema>
