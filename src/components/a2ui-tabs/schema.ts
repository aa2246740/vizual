import { z } from 'zod'

export const TabsSchema = z.object({
  /** 标签页列表 */
  tabs: z.array(z.object({
    label: z.string(),
    key: z.string(),
  })),
  /** 当前激活的 tab key */
  activeTab: z.string().optional(),
})

export type TabsProps = z.infer<typeof TabsSchema>
