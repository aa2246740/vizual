import { z } from 'zod'

export const RowSchema = z.object({
  /** 子元素对齐方式 */
  align: z.enum(['start', 'center', 'end', 'stretch']).optional().default('stretch'),
  /** 主轴分布 */
  justify: z.enum(['start', 'center', 'end', 'between', 'around']).optional().default('start'),
  /** 间距 (px) */
  gap: z.number().optional().default(8),
  /** 是否换行 */
  wrap: z.boolean().optional().default(false),
})

export type RowProps = z.input<typeof RowSchema>
