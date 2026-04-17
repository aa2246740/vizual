import { z } from 'zod'

export const InputFileSchema = z.object({
  type: z.literal('input_file'),
  label: z.string().optional(),
  accept: z.string().optional(),
  multiple: z.boolean().optional(),
  /** Max number of files allowed. Default 1 (single mode). 0 = unlimited. */
  maxFiles: z.number().optional(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
  error: z.string().optional(),
  /** When true, stores file as base64 data URL in state instead of filename */
  asBase64: z.boolean().optional(),
})

export type InputFileProps = z.infer<typeof InputFileSchema>
