import { z } from 'zod'

export const DateTimeInputSchema = z.object({
  label: z.string().optional(),
  value: z.string().optional(),
  mode: z.enum(['date', 'time', 'datetime']).optional().default('date'),
  disabled: z.boolean().optional().default(false),
})

export type DateTimeInputProps = z.input<typeof DateTimeInputSchema>
