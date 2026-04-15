import { z } from 'zod'

export const OrgChartSchema = z.object({
      type: z.literal('org_chart'),
      title: z.string().optional(),
      nodes: z.array(z.object({
        id: z.string(), name: z.string(), role: z.string().optional(),
        parentId: z.string().nullable().optional(),
        avatar: z.string().optional(),
      })),
    })

export type OrgChartProps = z.infer<typeof OrgChartSchema>
