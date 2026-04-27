import { cloneJson, type VizualSpec } from './artifact'

export type VizualLiveControlFieldType =
  | 'text'
  | 'number'
  | 'slider'
  | 'select'
  | 'switch'
  | 'checkbox'
  | 'color'
  | 'textarea'

export type VizualLiveControlOption = {
  label: string
  value: string | number | boolean
}

export type VizualLiveControlVisibilityRule = {
  field: string
  equals?: unknown
  notEquals?: unknown
  includes?: unknown
}

export type VizualLiveControlField = {
  name: string
  label?: string
  type: VizualLiveControlFieldType
  defaultValue?: unknown
  value?: unknown
  min?: number
  max?: number
  step?: number
  options?: VizualLiveControlOption[]
  placeholder?: string
  description?: string
  dependsOn?: string
  showWhen?: VizualLiveControlVisibilityRule | Record<string, unknown> | unknown
  required?: boolean
  meta?: Record<string, unknown>
}

export type VizualLiveControlSchema = {
  id?: string
  title?: string
  description?: string
  statePath: string
  scope?: string
  mode?: 'realtime' | 'submit'
  fields: VizualLiveControlField[]
  submitLabel?: string
  meta?: Record<string, unknown>
}

export type CreateLiveControlSchemaInput = Omit<Partial<VizualLiveControlSchema>, 'fields'> & {
  fields: VizualLiveControlField[]
}

export type VizualLiveControlStatePatch =
  | Record<string, unknown>
  | Array<{ path: string; value: unknown }>

export function createLiveControlSchema(input: CreateLiveControlSchemaInput): VizualLiveControlSchema {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    statePath: normalizeStatePath(input.statePath || '/controls'),
    scope: input.scope,
    mode: input.mode || 'realtime',
    fields: input.fields.map(field => cloneJson(field)),
    submitLabel: input.submitLabel,
    meta: cloneJson(input.meta),
  }
}

export function createLiveControlInitialState(schema: VizualLiveControlSchema): Record<string, unknown> {
  const controls: Record<string, unknown> = {}
  for (const field of schema.fields) {
    if (field.defaultValue !== undefined) {
      controls[field.name] = cloneJson(field.defaultValue)
    } else if (field.value !== undefined) {
      controls[field.name] = cloneJson(field.value)
    }
  }
  return setByPointer({}, schema.statePath || '/controls', controls)
}

export function validateLiveControlState(
  schema: VizualLiveControlSchema,
  state: Record<string, unknown>,
): { valid: boolean; errors: string[]; value: Record<string, unknown> } {
  const controls = readControls(schema, state)
  const errors: string[] = []
  const value: Record<string, unknown> = {}

  for (const field of schema.fields) {
    const raw = controls[field.name] ?? field.defaultValue ?? field.value
    if (field.required && (raw === undefined || raw === null || raw === '')) {
      errors.push(`${field.name} is required`)
      continue
    }
    if ((field.type === 'number' || field.type === 'slider') && raw !== undefined) {
      const num = Number(raw)
      if (!Number.isFinite(num)) {
        errors.push(`${field.name} must be a number`)
        continue
      }
      if (field.min !== undefined && num < field.min) errors.push(`${field.name} must be >= ${field.min}`)
      if (field.max !== undefined && num > field.max) errors.push(`${field.name} must be <= ${field.max}`)
      value[field.name] = num
      continue
    }
    if ((field.type === 'switch' || field.type === 'checkbox') && raw !== undefined) {
      value[field.name] = Boolean(raw)
      continue
    }
    if (field.type === 'select' && field.options?.length && raw !== undefined) {
      const allowed = field.options.some(option => Object.is(option.value, raw))
      if (!allowed) errors.push(`${field.name} must be one of the declared options`)
    }
    value[field.name] = cloneJson(raw)
  }

  return { valid: errors.length === 0, errors, value }
}

export function getVisibleLiveControlFields(
  schema: VizualLiveControlSchema,
  state: Record<string, unknown>,
): VizualLiveControlField[] {
  const controls = readControls(schema, state)
  return schema.fields.filter(field => isFieldVisible(field, controls))
}

export function applyLiveControlStatePatch(
  schema: VizualLiveControlSchema,
  state: Record<string, unknown>,
  patch: VizualLiveControlStatePatch,
): Record<string, unknown> {
  let next = cloneJson(state || {})
  const controls = { ...readControls(schema, next) }

  if (Array.isArray(patch)) {
    let touchedControls = false
    for (const op of patch) {
      if (op.path.startsWith(schema.statePath + '/') || op.path === schema.statePath) {
        next = setByPointer(next, op.path, cloneJson(op.value))
      } else {
        const field = op.path.replace(/^\//, '')
        controls[field] = cloneJson(op.value)
        touchedControls = true
      }
    }
    return touchedControls ? setByPointer(next, schema.statePath, controls) : next
  }

  Object.assign(controls, cloneJson(patch))
  return setByPointer(next, schema.statePath, controls)
}

export function buildFormBuilderSpecFromLiveControl(
  schema: VizualLiveControlSchema,
  statePath = schema.statePath || '/controls',
): VizualSpec {
  return {
    root: 'controls',
    elements: {
      controls: {
        type: 'FormBuilder',
        props: {
          title: schema.title,
          description: schema.description,
          value: { $bindState: statePath },
          fields: schema.fields.map(field => ({
            name: field.name,
            label: field.label,
            type: formBuilderFieldType(field.type),
            defaultValue: field.defaultValue,
            min: field.min,
            max: field.max,
            step: field.step,
            options: field.options,
            placeholder: field.placeholder,
            description: field.description,
            dependsOn: field.dependsOn,
            showWhen: field.showWhen,
            required: field.required,
          })),
          submitLabel: schema.mode === 'submit' ? schema.submitLabel : undefined,
        },
        children: [],
      },
    },
    state: createLiveControlInitialState(schema),
  }
}

function normalizeStatePath(path: string): string {
  if (!path) return '/controls'
  return path.startsWith('/') ? path : `/${path}`
}

function formBuilderFieldType(type: VizualLiveControlFieldType): string {
  if (type === 'switch') return 'checkbox'
  return type
}

function readControls(schema: VizualLiveControlSchema, state: Record<string, unknown>): Record<string, unknown> {
  const value = getByPointer(state || {}, schema.statePath || '/controls')
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function isFieldVisible(field: VizualLiveControlField, controls: Record<string, unknown>): boolean {
  if (!field.dependsOn && field.showWhen === undefined) return true
  const depName = field.dependsOn || (isVisibilityRule(field.showWhen) ? field.showWhen.field : undefined)
  if (!depName) return true
  const actual = controls[depName]
  const rule = isVisibilityRule(field.showWhen) ? field.showWhen : undefined
  if (!rule) return Boolean(actual)
  if ('equals' in rule) return Object.is(actual, rule.equals)
  if ('notEquals' in rule) return !Object.is(actual, rule.notEquals)
  if ('includes' in rule) return Array.isArray(actual) && actual.includes(rule.includes)
  return Boolean(actual)
}

function isVisibilityRule(value: unknown): value is VizualLiveControlVisibilityRule {
  return typeof value === 'object' && value !== null && 'field' in value
}

function getByPointer(source: Record<string, unknown>, pointer: string): unknown {
  const parts = normalizeStatePath(pointer).split('/').slice(1).map(decodePointerSegment)
  let current: unknown = source
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setByPointer(source: Record<string, unknown>, pointer: string, value: unknown): Record<string, unknown> {
  const parts = normalizeStatePath(pointer).split('/').slice(1).map(decodePointerSegment)
  const root = cloneJson(source || {})
  let current: Record<string, unknown> = root
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = cloneJson(value)
      return
    }
    const next = current[part]
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  })
  return root
}

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}
