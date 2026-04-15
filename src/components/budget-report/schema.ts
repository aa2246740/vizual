import { z } from 'zod'

export const BudgetReportSchema = z.object({
      type: z.literal('budget_report'),
      title: z.string().optional(),
      categories: z.array(z.object({
        name: z.string(),
        budget: z.number(), actual: z.number(),
        color: z.string().optional(),
      })),
      showVariance: z.boolean().optional(),
    })

export type BudgetReportProps = z.infer<typeof BudgetReportSchema>
