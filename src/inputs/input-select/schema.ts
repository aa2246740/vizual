import { z } from 'zod'

export const InputSelectSchema = z.object({
  type: z.literal('input_select'),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
  })),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  error: z.string().optional(),
})

export type InputSelectProps = z.infer<typeof InputSelectSchema>
