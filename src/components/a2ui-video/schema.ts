import { z } from 'zod'

export const VideoSchema = z.object({
  src: z.string().optional(),
  url: z.string().optional(),
  posterUrl: z.string().optional(),
  poster: z.string().optional(),
  width: z.union([z.string(), z.number()]).optional().default('100%'),
  height: z.union([z.string(), z.number()]).optional(),
  autoplay: z.boolean().optional().default(false),
  muted: z.boolean().optional().default(false),
})

export type VideoProps = z.input<typeof VideoSchema>
