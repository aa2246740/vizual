import { z } from 'zod'

export const InputTextSchema = z.object({
  type: z.literal('input_text'),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  inputType: z.enum(['text', 'email', 'password', 'number', 'url', 'tel']).optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  error: z.string().optional(),
})

export type InputTextProps = z.infer<typeof InputTextSchema>
