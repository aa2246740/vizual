import { z } from 'zod'

export const KanbanSchema = z.object({
      type: z.literal('kanban'),
      title: z.string().optional(),
      columns: z.array(z.object({
        id: z.string(), title: z.string(), color: z.string().optional(),
        cards: z.array(z.object({
          id: z.string(), title: z.string(),
          description: z.string().optional(),
          tags: z.array(z.string()).optional(),
          assignee: z.string().optional(),
          priority: z.enum(['low','medium','high']).optional(),
        })),
      })),
    })

export type KanbanProps = z.infer<typeof KanbanSchema>
