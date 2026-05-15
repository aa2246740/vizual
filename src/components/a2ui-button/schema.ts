import { z } from 'zod'

export const ButtonSchema = z.object({
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'ghost']).optional().default('primary'),
  disabled: z.boolean().optional().default(false),
  /** 动作名称 — 点击时通过 A2UI action 回传给 Agent */
  action: z.string().optional(),
  size: z.enum(['small', 'medium', 'large']).optional().default('medium'),
})

export type ButtonProps = z.infer<typeof ButtonSchema>
