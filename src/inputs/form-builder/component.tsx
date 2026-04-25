import { useState, useCallback } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss, tc } from '../../core/theme-colors'
import { AnnotatableWrapper } from '../../docview/annotatable-wrapper'
import type { FormBuilderProps } from './schema'

type Field = FormBuilderProps['fields'][0]
type RuntimeFormBuilderProps = FormBuilderProps & {
  onSubmit?: (data: Record<string, unknown>) => void
}
type NormalizedOption = { label: string; value: string | number }
type ValidationRule = NonNullable<Field['validation']>[0]

const validators: Record<string, (value: unknown, ruleValue?: string | number) => boolean> = {
  required: (v) => v !== undefined && v !== null && v !== '',
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

/**
 * Dynamic form builder — renders various input types based on field definitions.
 * Uses useBoundProp for two-way binding on form data via $bindState,
 * falls back to local state when unbound.
 */
export function FormBuilder({
  props,
  bindings,
  emit = () => undefined,
}: {
  props: RuntimeFormBuilderProps
  bindings?: Record<string, string>
  emit?: (event: string) => void
}) {
  const defaultData = props.fields.reduce((acc: Record<string, unknown>, f) => {
    if (f.defaultValue !== undefined) acc[f.name] = f.defaultValue
    return acc
  }, {})

  const bound = useBoundProp<Record<string, unknown>>(defaultData, bindings?.value)
  const [localData, setLocalData] = useState<Record<string, unknown>>(defaultData)
  const hasBinding = !!bindings?.value
  const formData = hasBinding ? (bound[0] ?? {}) : localData
  const setFormData = (v: Record<string, unknown>) => { bound[1](v); setLocalData(v) }

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  /** Track hover state for rating stars */
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({})

  const updateField = useCallback((name: string, value: unknown) => {
    setFormData({ ...(formData || {}), [name]: value })
  }, [setFormData, formData])

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
  const visibleFields = props.fields.filter(f => {
    if (!f.dependsOn || f.showWhen === undefined) return true
    return formData?.[f.dependsOn] === f.showWhen
  })

  const validateVisibleFields = useCallback(() => {
    const nextErrors: Record<string, string> = {}
    const nextTouched: Record<string, boolean> = {}
    for (const field of visibleFields) {
      nextTouched[field.name] = true
      const err = validateField(field, formData?.[field.name])
      if (err) nextErrors[field.name] = err
    }
    setTouched(prev => ({ ...prev, ...nextTouched }))
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [visibleFields, validateField, formData])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!validateVisibleFields()) return
    const data = formData ?? {}
    props.onSubmit?.(data)
    emit('submit')
  }, [validateVisibleFields, formData, props, emit])

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

  const renderLabel = (field: Field) =>
    field.label && <label style={labelStyle}>
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
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <select value={String(value ?? '')} disabled={field.disabled}
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
        return <div key={field.name} style={{ marginBottom: 12 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: field.disabled ? 'default' : 'pointer',
          }}>
            <span onClick={() => !field.disabled && updateField(field.name, !on)} style={{
              width: 18, height: 18, borderRadius: tcss('--rk-radius-sm'),
              border: `2px solid ${on ? tcss('--rk-accent') : tcss('--rk-text-tertiary')}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: on ? tcss('--rk-accent') : 'transparent',
              color: tcss('--rk-text-primary'), fontSize: tcss('--rk-text-xs'), lineHeight: 1,
              transition: 'all 0.15s',
            }}>{on ? '✓' : ''}</span>
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
              <input type="checkbox" checked={checked} disabled={field.disabled}
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
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={min} max={max} step={step} value={numVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, Number(e.target.value))}
            style={{ flex: 1, accentColor: tcss('--rk-accent') }} />
          <span style={{ fontSize:tcss('--rk-text-md'), color: tcss('--rk-text-primary'), minWidth: 40, textAlign: 'right' }}>{numVal}</span>
        </div>
        {renderError(field, error)}
      </div>
    }

    // === COLOR ===
    if (field.type === 'color') {
      const colorVal = String(value || tcss('--rk-accent'))
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div onClick={() => {
            const inp = document.getElementById('color-' + field.name)
            inp?.click()
          }} style={{
            width: 36, height: 36, borderRadius:tcss('--rk-radius-md'), cursor: 'pointer',
            background: colorVal, border: `2px solid ${tcss('--rk-border-subtle')}`,
          }} />
          <input id={'color-' + field.name} type="color" value={colorVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, e.target.value)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          <span style={{ fontSize:tcss('--rk-text-base'), color: tcss('--rk-text-secondary'), fontFamily: 'monospace' }}>{colorVal}</span>
        </div>
        {renderError(field, error)}
      </div>
    }

    // === DATE ===
    if (field.type === 'date') {
      const dateVal = String(value ?? '')
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ position: 'relative' }}>
          {!dateVal && <div style={{
            position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
            fontSize:tcss('--rk-text-md'), color: tcss('--rk-text-tertiary'), pointerEvents: 'none',
          }}>{field.placeholder || 'Select a date'}</div>}
          <input type="date" value={dateVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, e.target.value)}
            onBlur={() => handleBlur(field)}
            style={{ ...inputStyle, border: `1px solid ${borderStyle}`, colorScheme: 'dark' }} />
        </div>
        {renderError(field, error)}
      </div>
    }

    // === DATETIME ===
    if (field.type === 'datetime') {
      const dtVal = String(value ?? '')
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ position: 'relative' }}>
          {!dtVal && <div style={{
            position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
            fontSize:tcss('--rk-text-md'), color: tcss('--rk-text-tertiary'), pointerEvents: 'none',
          }}>{field.placeholder || 'Select date & time'}</div>}
          <input type="datetime-local" value={dtVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, e.target.value)}
            onBlur={() => handleBlur(field)}
            style={{ ...inputStyle, border: `1px solid ${borderStyle}`, colorScheme: 'dark' }} />
        </div>
        {renderError(field, error)}
      </div>
    }

    // === TIME ===
    if (field.type === 'time') {
      const timeVal = String(value ?? '')
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <div style={{ position: 'relative' }}>
          {!timeVal && <div style={{
            position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
            fontSize:tcss('--rk-text-md'), color: tcss('--rk-text-tertiary'), pointerEvents: 'none',
          }}>{field.placeholder || 'Select time'}</div>}
          <input type="time" value={timeVal}
            disabled={field.disabled}
            onChange={(e) => updateField(field.name, e.target.value)}
            onBlur={() => handleBlur(field)}
            style={{ ...inputStyle, border: `1px solid ${borderStyle}`, colorScheme: 'dark' }} />
        </div>
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
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <input type="file" accept={field.accept} multiple={field.multiple} disabled={field.disabled}
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
      return <div key={field.name} style={{ marginBottom: 12 }}>
        {renderLabel(field)}
        <textarea value={String(value ?? '')} placeholder={field.placeholder} disabled={field.disabled}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => handleBlur(field)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, border: `1px solid ${borderStyle}` }} />
        {renderError(field, error)}
      </div>
    }

    // === TEXT / EMAIL / PASSWORD / NUMBER / URL / TEL ===
    return <div key={field.name} style={{ marginBottom: 12 }}>
      {renderLabel(field)}
      <input type={field.type} value={String(value ?? '')} placeholder={field.placeholder} disabled={field.disabled}
        onChange={(e) => updateField(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={() => handleBlur(field)}
        style={{ ...inputStyle, border: `1px solid ${borderStyle}` }} />
      {renderError(field, error)}
    </div>
  }

  return <AnnotatableWrapper targetType="component" componentType="FormBuilder" label={props.title || `Form, ${visibleFields.length} fields`}>
    <form onSubmit={handleSubmit}>
      {props.title && <h3 style={{ fontSize:tcss('--rk-text-lg'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 16, color: tcss('--rk-text-primary') }}>{props.title}</h3>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 24px' }}>
        {visibleFields.map(renderField)}
      </div>
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
    </form>
  </AnnotatableWrapper>
}
