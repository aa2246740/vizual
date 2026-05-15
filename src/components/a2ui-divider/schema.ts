import { z } from 'zod'

export const DividerSchema = z.object({
  /** 方向 */
  direction: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
  /** 间距 (px) */
  spacing: z.number().optional().default(8),
  /** 颜色覆盖 */
  color: z.string().optional(),
})

export type DividerProps = z.infer<typeof DividerSchema>
