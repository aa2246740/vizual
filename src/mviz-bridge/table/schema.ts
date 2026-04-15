import { z } from 'zod'

export const DataTableSchema = z.object({
      type: z.literal('table'),
      title: z.string().optional(),
      columns: z.array(z.object({ key: z.string(), label: z.string().optional(), align: z.enum(['left','center','right']).optional() })).optional(),
      data: z.array(z.record(z.unknown())),
      striped: z.boolean().optional(),
      compact: z.boolean().optional(),
    })

export type DataTableProps = z.infer<typeof DataTableSchema>
