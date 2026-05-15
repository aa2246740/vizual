import { z } from 'zod'

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional().default(''),
  width: z.union([z.string(), z.number()]).optional().default('100%'),
  height: z.union([z.string(), z.number()]).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'none']).optional().default('cover'),
  radius: z.number().optional().default(8),
})

export type ImageProps = z.infer<typeof ImageSchema>
