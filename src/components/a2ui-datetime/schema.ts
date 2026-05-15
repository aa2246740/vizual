import { z } from 'zod'

export const DateTimeInputSchema = z.object({
  label: z.string().optional(),
  value: z.string().optional(),
  mode: z.enum(['date', 'time', 'datetime']).optional().default('date'),
})

export type DateTimeInputProps = z.infer<typeof DateTimeInputSchema>
