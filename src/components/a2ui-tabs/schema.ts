import { z } from 'zod'

export const TabsSchema = z.object({
  /** 标签页列表 */
  tabs: z.array(z.object({
    label: z.string(),
    key: z.string().optional(),
    id: z.string().optional(),
    value: z.string().optional(),
    contentId: z.string().optional(),
  })),
  /** 当前激活的 tab key */
  activeTab: z.string().optional(),
  activeKey: z.string().optional(),
})

export type TabsProps = z.input<typeof TabsSchema>
