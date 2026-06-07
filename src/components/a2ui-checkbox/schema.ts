import { z } from 'zod'

export const CheckBoxSchema = z.object({
  label: z.string(),
  options: z.array(z.union([z.string(), z.object({ label: z.string(), value: z.string() })])).optional(),
  value: z.array(z.string()).optional(),
  checked: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
})

export type CheckBoxProps = z.input<typeof CheckBoxSchema>
