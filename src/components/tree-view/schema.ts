import { z } from 'zod'

/** 递归树节点 schema */
const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    badge: z.union([z.string(), z.number()]).optional(),
    color: z.string().optional(),
    children: z.array(TreeNodeSchema).optional(),
    expanded: z.boolean().default(false),
    disabled: z.boolean().default(false),
  })
)

export interface TreeNode {
  id: string
  label: string
  icon?: string
  badge?: string | number
  color?: string
  children?: TreeNode[]
  expanded?: boolean
  disabled?: boolean
}

export const TreeViewSchema = z.object({
  type: z.literal('tree_view'),
  title: z.string().optional(),
  data: z.array(TreeNodeSchema),
  defaultExpandAll: z.boolean().default(false),
  showIcons: z.boolean().default(true),
  selectable: z.boolean().default(false),
  /** 高亮指定节点 ID */
  activeId: z.string().optional(),
})

export type TreeViewProps = z.infer<typeof TreeViewSchema>
