import { z } from 'zod'

export const HeroLayoutSchema = z.object({
  height: z.number().optional().default(200),
  background: z.enum(['gradient', 'solid', 'transparent']).optional().default('gradient'),
  align: z.enum(['top', 'center', 'bottom']).optional().default('center'),
  /** 主标题 */
  title: z.string().optional(),
  /** 副标题 */
  subtitle: z.string().optional(),
  /** CTA 按钮文字 */
  cta: z.string().optional(),
})

export type HeroLayoutProps = z.input<typeof HeroLayoutSchema>
