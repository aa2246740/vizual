import { z } from 'zod'

export const ModalSchema = z.object({
  title: z.string().optional(),
  open: z.boolean().optional().default(false),
  width: z.number().optional().default(480),
})

export type ModalProps = z.infer<typeof ModalSchema>
