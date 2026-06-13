import { useState, useCallback, useEffect, useId, useMemo, useRef } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss, tc } from '../../core/theme-colors'
import type { FormBuilderProps } from './schema'

type Field = FormBuilderProps['fields'][0]
type RuntimeFormBuilderProps = FormBuilderProps & {
  onSubmit?: (data: Record<string, unknown>) => void
}
type FormBuilderComponentArgs = {
  props: RuntimeFormBuilderProps
  bindings?: Record<string, string>
  emit?: (event: string) => void
}
type NormalizedOption = { label: string; value: string | number }
type ValidationRule = NonNullable<Field['validation']>[0]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const validators: Record<string, (value: unknown, ruleValue?: string | number) => boolean> = {
  required: (v) => {
    if (v === undefined || v === null || v === false) return false
    if (typeof v === 'string') return v.trim() !== ''
    if (Array.isArray(v)) return v.length > 0
    return true
  },
  email: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  minLength: (v, n) => typeof v === 'string' && v.length >= Number(n),
  maxLength: (v, n) => typeof v === 'string' && v.length <= Number(n),
  pattern: (v, p) => typeof v === 'string' && new RegExp(String(p)).test(v),
  min: (v, n) => Number(v) >= Number(n),
  max: (v, n) => Number(v) <= Number(n),
  url: (v) => typeof v === 'string' && /^https?:\/\/.+/.test(v),
}

/** Normalize options to {label, value} format — accepts string[] or {label,value}[] */
function normalizeOptions(options: Field['options']): NormalizedOption[] {
  if (!options) return []
  return options.map(o => typeof o === 'string' ? { label: o, value: o } : o)
}

function pad2(value: string | number) {
  return String(value).padStart(2, '0')
}

function normalizeDatePart(value: string): string | undefined {
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?(?:\b|[T\s])/)
  if (!match) return undefined
  const [, year, month, day] = match
  const yyyy = Number(year)
  const mm = Number(month)
  const dd = Number(day)
  const date = new Date(Date.UTC(yyyy, mm - 1, dd))
  if (
    date.getUTCFullYear() !== yyyy ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    return undefined
  }
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function normalizeTimePart(value: string): string | undefined {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return undefined
  const [, hour, minute, second] = match
  const hh = Number(hour)
  const mm = Number(minute)
  const ss = second === undefined ? 0 : Number(second)
  if (hh > 23 || mm > 59 || ss > 59) return undefined
  return second === undefined
    ? `${pad2(hour)}:${minute}`
    : `${pad2(hour)}:${minute}:${second}`
}

function normalizeTemporalInputValue(value: unknown, type: Field['type']): unknown {
  if (type !== 'date' && type !== 'datetime' && type !== 'time') return value
  if (value === undefined || value === null) return ''
  const text = String(value).trim()
  if (!text) return ''

  if (type === 'date') {
    return normalizeDatePart(text) ?? ''
  }

  if (type === 'time') {
    return normalizeTimePart(text) ?? ''
  }

  const isoLocal = text.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/)
  if (isoLocal) return `${isoLocal[1]}T${isoLocal[2]}`

  const datePart = normalizeDatePart(text)
  const timeMatch = text.match(/(?:T|\s)(\d{1,2}:\d{2}(?::\d{2})?)/)
  const timePart = timeMatch ? normalizeTimePart(timeMatch[1]) : undefined
  if (datePart && timePart) return `${datePart}T${timePart}`
  return ''
}

function normalizeFieldValue(field: Field, value: unknown): unknown {
  return normalizeTemporalInputValue(value, field.type)
}

function normalizeFormDataForFields(fields: Field[], data: Record<string, unknown>) {
  const next = { ...data }
  for (const field of fields) {
    if (field.name in next) next[field.name] = normalizeFieldValue(field, next[field.name])
  }
  return next
}

function nativeFormValueToFieldValue(field: Field, form: HTMLFormElement): unknown {
  const nativeData = new FormData(form)
  const values = nativeData.getAll(field.name)

  if (field.type === 'checkbox') {
    const options = normalizeOptions(field.options)
    if (options.length === 0) return nativeData.has(field.name)
    return values.map(value => String(value))
  }

  const [value] = values
  if (value === undefined) return undefined
  if (value instanceof File) return value.name || undefined
  if (field.type === 'number') return value === '' ? '' : Number(value)
  return String(value)
}

function resolveSubmitDataFromNativeForm(
  fields: Field[],
  currentData: Record<string, unknown>,
  form: HTMLFormElement | null,
) {
  const next = { ...currentData }
  if (!form) return normalizeFormDataForFields(fields, next)

  for (const field of fields) {
    if (field.disabled) continue
    const nativeValue = nativeFormValueToFieldValue(field, form)
    if (nativeValue !== undefined) next[field.name] = nativeValue
  }

  return normalizeFormDataForFields(fields, next)
}

function resolveFormData(props: RuntimeFormBuilderProps) {
  const fields = Array.isArray(props.fields) ? props.fields : []
  const defaultData = fields.reduce((acc: Record<string, unknown>, f) => {
    if (f.defaultValue !== undefined) {
      acc[f.name] = normalizeFieldValue(f, f.defaultValue)
      return acc
    }
    if (f.type === 'select' && !f.placeholder) {
      const [firstOption] = normalizeOptions(f.options)
      if (firstOption) acc[f.name] = firstOption.value
    }
    return acc
  }, {})
  if (!isRecord(props.value)) return defaultData
  return normalizeFormDataForFields(fields, { ...defaultData, ...props.value })
}

/**
 * Dynamic form builder — renders various input types based on field definitions.
 * Uses useBoundProp for two-way binding on form data via $bindState,
 * falls back to local state when unbound.
 */
export function FormBuilder(args: FormBuilderComponentArgs) {
  if (args.bindings?.value) return <BoundFormBuilder {...args} />
  return <UnboundFormBuilder {...args} />
}

function BoundFormBuilder({
  props,
  bindings,
  emit = () => undefined,
}: FormBuilderComponentArgs) {
  const resolvedData = useMemo(() => resolveFormData(props), [props])
  const [boundData, setBoundData] = useBoundProp<Record<string, unknown>>(resolvedData, bindings!.value)
  useEffect(() => {
    if (boundData === undefined || boundData === null) setBoundData(resolvedData)
  }, [boundData, resolvedData, setBoundData])
  return (
    <FormBuilderBody
      props={props}
      emit={emit}
      formData={boundData ?? resolvedData}
      onFormDataChange={setBoundData}
    />
  )
}

function UnboundFormBuilder({
  props,
  emit = () => undefined,
}: FormBuilderComponentArgs) {
  const resolvedData = useMemo(() => resolveFormData(props), [props])
  const [localData, setLocalData] = useState<Record<string, unknown>>(resolvedData)

  return (
    <FormBuilderBody
      props={props}
      emit={emit}
      formData={localData}
      onFormDataChange={setLocalData}
    />
  )
}

function FormBuilderBody({
  props,
  emit,
  formData,
  onFormDataChange,
}: {
  props: RuntimeFormBuilderProps
  emit: (event: string) => void
  formData: Record<string, unknown>
  onFormDataChange: (data: Record<string, unknown>) => void
}) {
  const formDataRef = useRef<Record<string, unknown>>(formData)
  formDataRef.current = formData
  const setFormData = useCallback((v: Record<string, unknown>) => {
    formDataRef.current = v
    onFormDataChange(v)
  }, [onFormDataChange])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  /** Track hover state for rating stars */
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({})
  const formId = useId().replace(/:/g, '')

  const updateField = useCallback((name: string, value: unknown) => {
    setFormData({ ...(formDataRef.current || {}), [name]: value })
  }, [setFormData])

  const validateField = useCallback((field: Field, value: unknown): string | undefined => {
    if (field.required && !validators.required(value)) {
      return `${field.label || field.name} is required`
    }
    if (!field.validation) return undefined
    for (const rule of field.validation) {
      const fn = validators[rule.rule]
      if (fn && !fn(value, rule.value)) {
        return rule.message || `Validation failed: ${rule.rule}`
      }
    }
    return undefined
  }, [])

  const cols = props.columns ?? 1
  const fields = Array.isArray(props.fields) ? props.fields : []
  const visibleFields = fields.filter(f => {
    if (!f.dependsOn || f.showWhen === undefined) return true
    return formData?.[f.dependsOn] === f.showWhen
  })

  const validateVisibleFields = useCallback(() => {
    const nextErrors: Record<string, string> = {}
    const nextTouched: Record<string, boolean> = {}
    const currentData = formDataRef.current ?? {}
    for (const field of visibleFields) {
      nextTouched[field.name] = true
      const err = validateField(field, normalizeFieldValue(field, currentData[field.name]))
      if (err) nextErrors[field.name] = err
    }
    setTouched(prev => ({ ...prev, ...nextTouched }))
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [visibleFields, validateField])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!validateVisibleFields()) return
    const data = resolveSubmitDataFromNativeForm(
      fields,
      formDataRef.current ?? formData ?? {},
      e.currentTarget instanceof HTMLFormElement ? e.currentTarget : null,
    )
    setFormData(data)
    if (typeof props.onSubmit === 'function') props.onSubmit(data)
    emit('submit')
  }, [validateVisibleFields, fields, formData, props, emit, setFormData])

  const handleBlur = useCallback((field: Field) => {
    setTouched(prev => ({ ...prev, [field.name]: true }))
    const val = formData?.[field.name]
    const err = validateField(field, val)
    setErrors(prev => ({ ...prev, [field.name]: err ?? '' }))
  }, [formData, validateField])

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize:tcss('--rk-text-base'), fontWeight:tcss('--rk-weight-medium'),
    color: tcss('--rk-text-secondary'), marginBottom: 4,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize:tcss('--rk-text-md'),
    background: tcss('--rk-bg-primary'), border: `1px solid ${tcss('--rk-border-subtle')}`,
    borderRadius:tcss('--rk-radius-md'), color: tcss('--rk-text-primary'), outline: 'none', boxSizing: 'border-box',
  }

  const getFieldId = (field: Field) => `${formId}-${field.name}`

  const renderLabel = (field: Field, htmlFor?: string) =>
    field.label && <label htmlFor={htmlFor} style={labelStyle}>
      {field.label}
      {field.required && <span style={{ color: tcss('--rk-error'), marginLeft: 2 }}>*</span>}
    </label>

  const renderError = (field: Field, error?: string) =>
    (error || field.description) && <div style={{
      fontSize:tcss('--rk-text-sm'), marginTop: 4, color: error ? tcss('--rk-error') : tcss('--rk-text-tertiary'),
    }}>{error || field.description}</div>

  const renderField = (field: Field) => {
    const value = formData?.[field.name]
    const error = touched[field.name] ? errors[field.name] : undefined
    const borderStyle = error ? tcss('--rk-error') : tcss('--rk-border-subtle')

    // === SELECT ===
    if (field.type === 'select') {
      const opts = normalizeOptions(field.options)
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <select id={fieldId} name={field.name} value={String(value ?? '')} disabled={field.disabled}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => handleBlur(field)}
          style={{ ...inputStyle, border: `1px solid ${borderStyle}` }}>
          {field.placeholder && <option value="" disabled>{field.placeholder}</option>}
          {opts.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
        </select>
        {renderError(field, error)}
      </div>
    }

    // === RADIO ===
    if (field.type === 'radio') {
      const opts = normalizeOptions(field.options)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {opts.map((opt, i) => {
            const selected = String(value ?? '') === String(opt.value)
            return <label key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 12px', borderRadius:tcss('--rk-radius-md'),
              border: `1px solid ${selected ? tcss('--rk-accent') : tcss('--rk-border-subtle')}`,
              background: selected ? tcss('--rk-accent-muted') : tcss('--rk-bg-primary'),
              color: selected ? tcss('--rk-accent') : tcss('--rk-text-secondary'), fontSize:tcss('--rk-text-base'),
            }}>
              <input type="radio" name={field.name} value={opt.value}
                checked={selected} disabled={field.disabled}
                onChange={() => updateField(field.name, opt.value)}
                style={{ display: 'none' }} />
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${selected ? tcss('--rk-accent') : tcss('--rk-text-tertiary')}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: tcss('--rk-accent') }} />}
              </span>
              {opt.label}
            </label>
          })}
        </div>
        {renderError(field, error)}
      </div>
    }

    // === CHECKBOX ===
    if (field.type === 'checkbox') {
      const opts = normalizeOptions(field.options)
      // Single boolean checkbox (no options provided)
      if (opts.length === 0) {
        const on = !!value
        const fieldId = getFieldId(field)
        return <div key={field.name} style={{ marginBottom: 12 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: field.disabled ? 'default' : 'pointer',
          }}>
            <input
              id={fieldId}
              name={field.name}
              type="checkbox"
              checked={on}
              disabled={field.disabled}
              onChange={(e) => updateField(field.name, e.target.checked)}
              onBlur={() => handleBlur(field)}
              style={{
                width: 18, height: 18, margin: 0,
                accentColor: tcss('--rk-accent'),
              }}
            />
            <span style={{ fontSize: tcss('--rk-text-base'), color: tcss('--rk-text-primary') }}>
              {field.label}
              {field.required && <span style={{ color: tcss('--rk-error'), marginLeft: 2 }}>*</span>}
            </span>
          </label>
          {renderError(field, error)}
        </div>
      }
      // Multi-select checkbox (options provided)
      const selected: (string | number)[] = Array.isArray(value) ? value : []
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {opts.map((opt, i) => {
            const checked = selected.includes(opt.value)
            return <label key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 12px', borderRadius:tcss('--rk-radius-md'),
              border: `1px solid ${checked ? tcss('--rk-accent') : tcss('--rk-border-subtle')}`,
              background: checked ? tcss('--rk-accent-muted') : tcss('--rk-bg-primary'),
              color: checked ? tcss('--rk-accent') : tcss('--rk-text-secondary'), fontSize:tcss('--rk-text-base'),
            }}>
              <input type="checkbox" name={field.name} value={String(opt.value)} checked={checked} disabled={field.disabled}
                onChange={() => {
                  const next = checked
                    ? selected.filter(v => v !== opt.value)
                    : [...selected, opt.value]
                  updateField(field.name, next)
                }}
                style={{ display: 'none' }} />
              <span style={{
                width: 14, height: 14, borderRadius:tcss('--rk-radius-xs'),
                border: `2px solid ${checked ? tcss('--rk-accent') : tcss('--rk-text-tertiary')}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: checked ? tcss('--rk-accent') : 'transparent',
                color: tcss('--rk-text-primary'), fontSize:tcss('--rk-text-xs'), lineHeight: 1,
              }}>{checked ? '✓' : ''}</span>
              {opt.label}
            </label>
          })}
        </div>
        {renderError(field, error)}
      </div>
    }

    // === SWITCH ===
    if (field.type === 'switch') {
      const on = !!value
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div onClick={() => !field.disabled && updateField(field.name, !on)}
          data-field-name={field.name}
          role="switch"
          aria-label={field.label || field.name}
          aria-checked={on}
          aria-disabled={field.disabled || undefined}
          tabIndex={field.disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (field.disabled) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              updateField(field.name, !on)
            }
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            cursor: field.disabled ? 'not-allowed' : 'pointer',
            opacity: field.disabled ? 0.5 : 1,
          }}>
          <div style={{
            width: 40, height: 22, borderRadius: tcss('--rk-radius-pill'), position: 'relative',
            background: on ? tcss('--rk-accent') : tcss('--rk-bg-tertiary'), transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: tcss('--rk-text-primary'),
              position: 'absolute', top: 2,
              left: on ? 20 : 2, transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize:tcss('--rk-text-base'), color: tcss('--rk-text-secondary') }}>{on ? 'On' : 'Off'}</span>
        </div>
        {renderError(field, error)}
      </div>
    }

    // === SLIDER ===
    if (field.type === 'slider') {
      const min = field.min ?? 0
      const max = field.max ?? 100
      const step = field.step ?? 1
      const numVal = Number(value) || min
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input id={fieldId} name={field.name} type="range" min={min} max={max} step={step} value={numVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, Number(e.target.value))}
            onInput={(e) => updateField(field.name, Number((e.currentTarget as HTMLInputElement).value))}
            style={{ flex: 1, accentColor: tcss('--rk-accent') }} />
          <span style={{ fontSize:tcss('--rk-text-md'), color: tcss('--rk-text-primary'), minWidth: 40, textAlign: 'right' }}>{numVal}</span>
        </div>
        {renderError(field, error)}
      </div>
    }

    // === COLOR ===
    if (field.type === 'color') {
      const fieldId = getFieldId(field)
      const fallbackColor = tc('--rk-accent') || '#3b82f6'
      const colorVal = /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? String(value) : fallbackColor
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input id={fieldId} name={field.name} type="color" value={colorVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, e.target.value)}
            style={{
              width: 40, height: 36, padding: 2, cursor: field.disabled ? 'not-allowed' : 'pointer',
              border: `1px solid ${tcss('--rk-border-subtle')}`,
              borderRadius: tcss('--rk-radius-md'),
              background: tcss('--rk-bg-primary'),
            }} />
          <span style={{ fontSize:tcss('--rk-text-base'), color: tcss('--rk-text-secondary'), fontFamily: 'monospace' }}>{colorVal}</span>
        </div>
        {renderError(field, error)}
      </div>
    }

    // === DATE ===
    if (field.type === 'date') {
      const dateVal = String(normalizeFieldValue(field, value) ?? '')
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <input id={fieldId} name={field.name} type="date" value={dateVal}
          placeholder={field.placeholder || 'Select a date'}
          disabled={field.disabled}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => handleBlur(field)}
          style={{ ...inputStyle, border: `1px solid ${borderStyle}` }} />
        {renderError(field, error)}
      </div>
    }

    // === DATETIME ===
    if (field.type === 'datetime') {
      const dtVal = String(normalizeFieldValue(field, value) ?? '')
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <input id={fieldId} name={field.name} type="datetime-local" value={dtVal}
          placeholder={field.placeholder || 'Select date & time'}
          disabled={field.disabled}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => handleBlur(field)}
          style={{ ...inputStyle, border: `1px solid ${borderStyle}` }} />
        {renderError(field, error)}
      </div>
    }

    // === TIME ===
    if (field.type === 'time') {
      const timeVal = String(normalizeFieldValue(field, value) ?? '')
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <input id={fieldId} name={field.name} type="time" value={timeVal}
          placeholder={field.placeholder || 'Select time'}
          disabled={field.disabled}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => handleBlur(field)}
          style={{ ...inputStyle, border: `1px solid ${borderStyle}` }} />
        {renderError(field, error)}
      </div>
    }

    // === RATING ===
    if (field.type === 'rating') {
      const maxStars = field.max ?? 5
      const currentRating = Number(value) || 0
      const hover = hoverRating[field.name]
      const displayRating = hover !== undefined ? hover : currentRating
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ display: 'flex', gap: 4, cursor: 'pointer' }}
          onMouseLeave={() => setHoverRating(prev => {
            const next = { ...prev }
            delete next[field.name]
            return next
          })}>
          {Array.from({ length: maxStars }, (_, i) => i + 1).map(star => (
            <span key={star} onClick={() => !field.disabled && updateField(field.name, star)}
              onMouseEnter={() => !field.disabled && setHoverRating(prev => ({ ...prev, [field.name]: star }))}
              style={{
                fontSize:tcss('--rk-text-2xl'), cursor: field.disabled ? 'default' : 'pointer',
                color: star <= displayRating ? '#fbbf24' : tcss('--rk-bg-tertiary'),
                transition: 'color 0.15s',
              }}>★</span>
          ))}
          <span style={{ fontSize:tcss('--rk-text-base'), color: tcss('--rk-text-secondary'), marginLeft: 6, lineHeight: '28px' }}>
            {currentRating}/{maxStars}
          </span>
        </div>
        {renderError(field, error)}
      </div>
    }

    // === FILE ===
    if (field.type === 'file') {
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <input id={fieldId} name={field.name} type="file" accept={field.accept} multiple={field.multiple} disabled={field.disabled}
          onChange={(e) => { if (e.target.files?.[0]) updateField(field.name, e.target.files[0].name) }}
          style={{ display: 'none' }} />
        <div onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}
          style={{ ...inputStyle, textAlign: 'center', cursor: 'pointer', padding: '16px 12px', border: `2px dashed ${tcss('--rk-border-subtle')}` }}>
          {value ? String(value) : 'Click to upload'}
        </div>
        {renderError(field, error)}
      </div>
    }

    // === TEXTAREA ===
    if (field.type === 'textarea') {
      const fieldId = getFieldId(field)
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field, fieldId)}
        <textarea id={fieldId} name={field.name} value={String(value ?? '')} placeholder={field.placeholder} disabled={field.disabled}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => handleBlur(field)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, border: `1px solid ${borderStyle}` }} />
        {renderError(field, error)}
      </div>
    }

    // === TEXT / EMAIL / PASSWORD / NUMBER / URL / TEL ===
    const fieldId = getFieldId(field)
    return <div key={field.name} style={{ marginBottom: 12 }}>
      {renderLabel(field, fieldId)}
      <input id={fieldId} name={field.name} type={field.type} value={String(value ?? '')} placeholder={field.placeholder} disabled={field.disabled}
        onChange={(e) => updateField(field.name, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        onBlur={() => handleBlur(field)}
        style={{ ...inputStyle, border: `1px solid ${borderStyle}` }} />
      {renderError(field, error)}
    </div>
  }

  const showSubmit = props.showSubmit !== false

  return <form onSubmit={showSubmit ? handleSubmit : (event) => event.preventDefault()}>
      {props.title && <h3 style={{ fontSize:tcss('--rk-text-lg'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 16, color: tcss('--rk-text-primary') }}>{props.title}</h3>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 24px' }}>
        {visibleFields.map(renderField)}
      </div>
      {showSubmit && (
        <button
          type="submit"
          style={{
            marginTop: 4,
            padding: '8px 16px',
            fontSize: tcss('--rk-text-base'),
            fontWeight: tcss('--rk-weight-medium'),
            background: tcss('--rk-accent'),
            color: '#fff',
            border: 'none',
            borderRadius: tcss('--rk-radius-md'),
            cursor: 'pointer',
          }}
        >
          {props.submitLabel || 'Submit'}
        </button>
      )}
    </form>
}
