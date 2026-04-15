import { z } from 'zod'

export const JsonViewerSchema = z.object({
      type: z.literal('json_viewer'),
      title: z.string().optional(),
      data: z.unknown(),
      expanded: z.boolean().optional(),
      maxDepth: z.number().optional(),
    })

export type JsonViewerProps = z.infer<typeof JsonViewerSchema>
