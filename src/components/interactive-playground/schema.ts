import { z } from 'zod'

// ─── 控件 Schema：7 种交互控件 ──────────────────────────────

const SliderControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('slider'),
  min: z.number(),
  max: z.number(),
  step: z.number().optional().default(1),
  defaultValue: z.number(),
  targetProp: z.string(),
})

const SelectControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('select'),
  options: z.array(z.string()),
  values: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  targetProp: z.string(),
})

const ToggleControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('toggle'),
  defaultValue: z.boolean().optional().default(false),
  targetProp: z.string(),
})

const ColorControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('color'),
  defaultValue: z.string().optional(),
  targetProp: z.string(),
})

const TextControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('text'),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  targetProp: z.string(),
})

const NumberControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  defaultValue: z.number().optional(),
  targetProp: z.string(),
})

const ButtonGroupControlSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.literal('buttonGroup'),
  options: z.array(z.string()),
  values: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  targetProp: z.string(),
})

export const ControlSchema = z.union([
  SliderControlSchema,
  SelectControlSchema,
  ToggleControlSchema,
  ColorControlSchema,
  TextControlSchema,
  NumberControlSchema,
  ButtonGroupControlSchema,
])

// ─── 类型导出 ──────────────────────────────────────────────

export type SliderControl = z.infer<typeof SliderControlSchema>
export type SelectControl = z.infer<typeof SelectControlSchema>
export type ToggleControl = z.infer<typeof ToggleControlSchema>
export type ColorControl = z.infer<typeof ColorControlSchema>
export type TextControl = z.infer<typeof TextControlSchema>
export type NumberControl = z.infer<typeof NumberControlSchema>
export type ButtonGroupControl = z.infer<typeof ButtonGroupControlSchema>
export type Control = z.infer<typeof ControlSchema>

// ─── InteractivePlayground Schema ───────────────────────────

export const InteractivePlaygroundSchema = z.object({
  type: z.literal('interactive_playground'),
  title: z.string().optional(),
  description: z.string().optional(),
  /** 被包裹的组件定义 */
  component: z.object({
    type: z.string(),
    props: z.record(z.unknown()),
  }),
  /** AI 定义的交互控件列表 */
  controls: z.array(ControlSchema),
  /** 布局模式 */
  layout: z.enum(['side-by-side', 'stacked']).optional().default('side-by-side'),
})

export type InteractivePlaygroundProps = z.infer<typeof InteractivePlaygroundSchema>
