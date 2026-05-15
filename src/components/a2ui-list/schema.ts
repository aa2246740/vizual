import { z } from 'zod'

export const ListSchema = z.object({
  /** 列表项内容数组 */
  items: z.array(z.string()),
  /** 有序/无序 */
  ordered: z.boolean().optional().default(false),
  /** 间距 (px) */
  gap: z.number().optional().default(4),
})

export type ListProps = z.infer<typeof ListSchema>
