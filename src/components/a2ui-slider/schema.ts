import { z } from 'zod'

export const SliderSchema = z.object({
  label: z.string().optional(),
  min: z.number().optional().default(0),
  max: z.number().optional().default(100),
  value: z.number().optional().default(50),
  step: z.number().optional(),
  steps: z.number().int().positive().optional(),
  disabled: z.boolean().optional().default(false),
})

export type SliderProps = z.input<typeof SliderSchema>
