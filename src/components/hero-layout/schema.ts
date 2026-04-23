import { z } from 'zod'

export const HeroLayoutSchema = z.object({
  height: z.number().optional().default(200),
  background: z.enum(['gradient', 'solid', 'transparent']).optional().default('gradient'),
  align: z.enum(['top', 'center', 'bottom']).optional().default('center'),
})

export type HeroLayoutProps = z.infer<typeof HeroLayoutSchema>
