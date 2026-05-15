import { z } from 'zod'

export const ColumnSchema = z.object({
  align: z.enum(['start', 'center', 'end', 'stretch']).optional().default('stretch'),
  justify: z.enum(['start', 'center', 'end', 'between', 'around']).optional().default('start'),
  gap: z.number().optional().default(8),
})

export type ColumnProps = z.input<typeof ColumnSchema>
