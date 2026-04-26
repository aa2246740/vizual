import { z } from 'zod'

export const FormBuilderSchema = z.object({
  type: z.literal('form_builder'),
  title: z.string().optional(),
  columns: z.number().optional(),
  submitLabel: z.string().optional(),
  /** Two-way form data value, usually { "$bindState": "/controls" } for live controls */
  value: z.unknown().optional(),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    type: z.enum([
      'text', 'email', 'password', 'number', 'url', 'tel',
      'select', 'file', 'textarea',
      'radio', 'checkbox', 'switch', 'slider', 'color', 'date', 'datetime', 'time', 'rating',
    ]),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    description: z.string().optional(),
    /** Options for select/radio/checkbox. Accepts string[] or {label,value}[] */
    options: z.array(z.union([
      z.string(),
      z.object({ label: z.string(), value: z.union([z.string(), z.number()]) }),
    ])).optional(),
    accept: z.string().optional(),
    multiple: z.boolean().optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    /** Watch another field's value to control visibility/options */
    dependsOn: z.string().optional(),
    /** Show this field only when dependsOn field equals this value */
    showWhen: z.union([z.string(), z.number()]).optional(),
    validation: z.array(z.object({
      rule: z.enum(['required', 'email', 'minLength', 'maxLength', 'pattern', 'min', 'max', 'url']),
      value: z.union([z.string(), z.number()]).optional(),
      message: z.string().optional(),
    })).optional(),
    /** Slider/range min (default 0) */
    min: z.number().optional(),
    /** Slider/range max (default 100) */
    max: z.number().optional(),
    /** Slider/range step (default 1) */
    step: z.number().optional(),
  })),
})

export type FormBuilderProps = z.infer<typeof FormBuilderSchema>
