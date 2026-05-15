import { z } from 'zod'

export const CheckBoxSchema = z.object({
  label: z.string(),
  checked: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
})

export type CheckBoxProps = z.infer<typeof CheckBoxSchema>
