import { z } from 'zod'

export const ChoicePickerSchema = z.object({
  label: z.string().optional(),
  options: z.array(z.union([z.string(), z.object({ label: z.string(), value: z.string() })])),
  value: z.string().optional(),
  mode: z.enum(['dropdown', 'radio']).optional().default('dropdown'),
})

export type ChoicePickerProps = z.infer<typeof ChoicePickerSchema>
