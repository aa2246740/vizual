import { z } from 'zod'

export const IconSchema = z.object({
  /** Unicode 字符或 emoji */
  name: z.string(),
  size: z.number().optional().default(24),
  color: z.string().optional(),
})

export type IconProps = z.infer<typeof IconSchema>
