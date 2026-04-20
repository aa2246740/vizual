import { useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tc } from '../../core/theme-colors'
import type { InputSelectProps } from './schema'

/**
 * Select dropdown with two-way binding via useBoundProp.
 * Falls back to local state when no $bindState binding is provided.
 */
export function InputSelect({ props, bindings }: { props: InputSelectProps; bindings?: Record<string, string> }) {
  const bound = useBoundProp<string | number>(props.value, bindings?.value)
  const [localValue, setLocalValue] = useState<string | number>(props.value ?? '')
  const hasBinding = !!bindings?.value
  const value = hasBinding ? (bound[0] ?? '') : localValue
  const setValue = (v: string | number) => { bound[1](v); setLocalValue(v) }

  return <div style={{ marginBottom: 12 }}>
    {props.label && <label style={{
      display: 'block', fontSize: 13, fontWeight: 500,
      color: tc('--rk-text-secondary'), marginBottom: 4,
    }}>
      {props.label}
      {props.required && <span style={{ color: tc('--rk-error'), marginLeft: 2 }}>*</span>}
    </label>}
    <select
      value={value}
      disabled={props.disabled}
      onChange={(e) => {
        const v = e.target.value
        setValue(props.options[0]?.value !== undefined && typeof props.options[0].value === 'number'
          ? Number(v) : v)
      }}
      style={{
        width: '100%', padding: '8px 12px', fontSize: 14,
        background: tc('--rk-bg-primary'), border: `1px solid ${props.error ? tc('--rk-error') : tc('--rk-border-subtle')}`,
        borderRadius: 6, color: tc('--rk-text-primary'), outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      {props.placeholder && <option value="" disabled>{props.placeholder}</option>}
      {props.options.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
    </select>
    {(props.error || props.description) && <div style={{
      fontSize: 12, marginTop: 4,
      color: props.error ? tc('--rk-error') : tc('--rk-text-tertiary'),
    }}>
      {props.error || props.description}
    </div>}
  </div>
}
