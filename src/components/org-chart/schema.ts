import { z } from 'zod'

const OrgNode = z.object({
  id: z.string(), name: z.string(), role: z.string().optional(),
  parentId: z.string().nullable().optional(),
  avatar: z.string().optional(),
})

export type NestedOrgNodeValue = {
  id: string
  name: string
  title?: string
  children?: NestedOrgNodeValue[]
}

/** Nested node format: has `children` array instead of `parentId` */
const NestedOrgNode: z.ZodType<NestedOrgNodeValue> = z.object({
  id: z.string(), name: z.string(), title: z.string().optional(),
  children: z.lazy(() => z.array(NestedOrgNode)).optional(),
})

export const OrgChartSchema = z.object({
  type: z.literal('org_chart'),
  title: z.string().optional(),
  /** Flat node list with parentId references */
  nodes: z.array(OrgNode).optional(),
  /** Nested tree with children arrays */
  data: z.array(NestedOrgNode).optional(),
}).transform(input => {
  // If only nested `data` provided, flatten to `nodes`
  if ((!input.nodes || input.nodes.length === 0) && input.data && input.data.length > 0) {
    const nodes: z.infer<typeof OrgNode>[] = []
    function flatten(items: NestedOrgNodeValue[], parentId: string | null) {
      for (const item of items) {
        nodes.push({ id: item.id, name: item.name, role: item.title, parentId })
        if (item.children) flatten(item.children, item.id)
      }
    }
    flatten(input.data, null)
    return { ...input, nodes }
  }
  return input
})

export type OrgChartProps = z.input<typeof OrgChartSchema>
