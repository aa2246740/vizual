import { z } from 'zod'

export const ImageSchema = z.object({
  src: z.string().optional(),
  url: z.string().optional(),
  alt: z.string().optional().default(''),
  description: z.string().optional(),
  width: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'none']).optional().default('cover'),
  radius: z.number().optional().default(8),
}).refine(value => Boolean(value.src || value.url), {
  path: ['src'],
  message: 'Image requires src or url',
})

export type ImageProps = z.input<typeof ImageSchema>
