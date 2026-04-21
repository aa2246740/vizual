import { z } from 'zod'

export const ProgressBarSchema = z.object({
  type: z.literal('progress_bar'),
  title: z.string().optional(),
  value: z.number().min(0).max(100),
  label: z.string().optional(),
  variant: z.enum(['default', 'success', 'warning', 'error', 'gradient']).default('default'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  showValue: z.boolean().default(true),
  animated: z.boolean().default(false),
  striped: z.boolean().default(false),
  /** 多段进度条 */
  segments: z.array(z.object({
    value: z.number(),
    label: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
})

export type ProgressBarProps = z.infer<typeof ProgressBarSchema>
