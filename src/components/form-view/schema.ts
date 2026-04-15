import { z } from 'zod'

export const FormViewSchema = z.object({
      type: z.literal('form_view'),
      title: z.string().optional(),
      fields: z.array(z.object({
        label: z.string(), value: z.unknown(),
        type: z.enum(['text','number','date','email','url','boolean']).optional(),
      })),
      columns: z.number().optional(),
    })

export type FormViewProps = z.infer<typeof FormViewSchema>
