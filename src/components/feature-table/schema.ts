import { z } from 'zod'

export const FeatureTableSchema = z.object({
      type: z.literal('feature_table'),
      title: z.string().optional(),
      products: z.array(z.string()),
      features: z.array(z.object({
        name: z.string(), category: z.string().optional(),
        values: z.array(z.union([z.boolean(), z.string(), z.number()])),
      })),
    })

export type FeatureTableProps = z.infer<typeof FeatureTableSchema>
