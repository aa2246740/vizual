import { z } from 'zod'

const sizeValue = z.union([z.string(), z.number()])

export const ContainerSchema = z.object({
  direction: z.enum(['row', 'column']).optional().default('column'),
  gap: sizeValue.optional().default(8),
  padding: sizeValue.optional(),
  margin: sizeValue.optional(),
  background: z.string().optional(),
  border: z.string().optional(),
  borderRadius: sizeValue.optional(),
  radius: sizeValue.optional(),
  width: sizeValue.optional(),
  height: sizeValue.optional(),
  minWidth: sizeValue.optional(),
  minHeight: sizeValue.optional(),
  maxWidth: sizeValue.optional(),
  flex: z.union([z.string(), z.number()]).optional(),
  flexWrap: z.union([z.boolean(), z.enum(['wrap', 'nowrap', 'wrap-reverse'])]).optional(),
  alignItems: z.string().optional(),
  justifyContent: z.string().optional(),
  action: z.string().optional(),
  actionParams: z.record(z.unknown()).optional(),
  disabled: z.boolean().optional().default(false),
})

export type ContainerProps = z.input<typeof ContainerSchema>
