import { z } from 'zod'

export const CardSchema = z.object({
  /** Optional title rendered above child content. Common in agent-generated cards. */
  title: z.string().optional(),
  /** Optional supporting text rendered below title. */
  subtitle: z.string().optional(),
  /** KPI-style value shown prominently when agents use Card as a metric card. */
  value: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
  delta: z.union([z.string(), z.number()]).optional(),
  deltaLabel: z.string().optional(),
  extra: z.string().optional(),
  /** 内边距 (px) */
  padding: z.number().optional().default(16),
  /** 圆角 (px) */
  radius: z.number().optional().default(12),
  /** 阴影级别 0-3 */
  shadow: z.number().min(0).max(3).optional().default(1),
  /** 背景色覆盖 */
  background: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  flex: z.union([z.string(), z.number()]).optional(),
  width: z.union([z.string(), z.number()]).optional(),
  minHeight: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  action: z.string().optional(),
  actionParams: z.record(z.unknown()).optional(),
  disabled: z.boolean().optional().default(false),
})

export type CardProps = z.input<typeof CardSchema>
