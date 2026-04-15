import { z } from 'zod'

export const AuditLogSchema = z.object({
      type: z.literal('audit_log'),
      title: z.string().optional(),
      entries: z.array(z.object({
        timestamp: z.string(), user: z.string(), action: z.string(),
        target: z.string().optional(), details: z.string().optional(),
        severity: z.enum(['info','warning','error']).optional(),
      })),
    })

export type AuditLogProps = z.infer<typeof AuditLogSchema>
