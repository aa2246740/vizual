import { z } from 'zod'

export const TextSchema = z.object({
  content: z.string(),
  /** 语义标签 */
  variant: z.enum(['body', 'heading', 'caption', 'label', 'code']).optional().default('body'),
  /** 字号 (px) */
  size: z.number().optional(),
  /** 字重 */
  weight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
  /** 颜色覆盖 */
  color: z.string().optional(),
  /** 对齐 */
  align: z.enum(['left', 'center', 'right']).optional().default('left'),
  /** 最大行数（超出省略） */
  maxLines: z.number().optional(),
})

export type TextProps = z.input<typeof TextSchema>
