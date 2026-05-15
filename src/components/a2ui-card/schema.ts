import { z } from 'zod'

export const CardSchema = z.object({
  /** 内边距 (px) */
  padding: z.number().optional().default(16),
  /** 圆角 (px) */
  radius: z.number().optional().default(12),
  /** 阴影级别 0-3 */
  shadow: z.number().min(0).max(3).optional().default(1),
  /** 背景色覆盖 */
  background: z.string().optional(),
})

export type CardProps = z.input<typeof CardSchema>
