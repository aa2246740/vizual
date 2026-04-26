import { z } from 'zod'

export const GridLayoutSchema = z.object({
  columns: z.number().min(1).max(12).optional().default(2),
  gap: z.number().optional().default(12),
  columnWidths: z.array(z.string()).optional(),
})

export type GridLayoutProps = z.input<typeof GridLayoutSchema>
