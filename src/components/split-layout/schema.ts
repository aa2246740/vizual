import { z } from 'zod'

export const SplitLayoutSchema = z.object({
  direction: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
  ratio: z.number().min(10).max(90).optional().default(50),
  gap: z.number().optional().default(0),
})

export type SplitLayoutProps = z.input<typeof SplitLayoutSchema>
