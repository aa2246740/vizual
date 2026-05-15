import { z } from 'zod'

export const VideoSchema = z.object({
  src: z.string(),
  width: z.union([z.string(), z.number()]).optional().default('100%'),
  height: z.union([z.string(), z.number()]).optional(),
  autoplay: z.boolean().optional().default(false),
  muted: z.boolean().optional().default(false),
})

export type VideoProps = z.infer<typeof VideoSchema>
