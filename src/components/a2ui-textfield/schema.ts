import { z } from 'zod'

export const TextFieldSchema = z.object({
  placeholder: z.string().optional().default(''),
  value: z.string().optional().default(''),
  label: z.string().optional(),
  type: z.enum(['text', 'email', 'password', 'number', 'url']).optional().default('text'),
  disabled: z.boolean().optional().default(false),
})

export type TextFieldProps = z.infer<typeof TextFieldSchema>
