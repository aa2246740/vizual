import { z } from 'zod'

export const AudioPlayerSchema = z.object({
  src: z.string(),
  title: z.string().optional(),
})

export type AudioPlayerProps = z.infer<typeof AudioPlayerSchema>
