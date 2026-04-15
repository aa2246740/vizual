import { z } from 'zod'

export const AlertSchema = z.object({
      type: z.literal('alert'),
      title: z.string().optional(),
      message: z.string(),
      severity: z.enum(['info', 'warning', 'error', 'success']).optional(),
    })

export type AlertProps = z.infer<typeof AlertSchema>
