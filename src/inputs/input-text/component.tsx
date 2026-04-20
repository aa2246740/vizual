import { useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tc } from '../../core/theme-colors'
import type { InputTextProps } from './schema'

/**
 * Text input component with two-way binding via useBoundProp.
 * Falls back to local state when no $bindState binding is provided.
 */
export function InputText({ props, bindings }: { props: InputTextProps; bindings?: Record<string, string> }) {
  const bound = useBoundProp<string>(props.value, bindings?.value)
  const [localValue, setLocalValue] = useState(props.value ?? '')
  const hasBinding = !!bindings?.value
  const value = hasBinding ? (bound[0] ?? '') : localValue
  const setValue = (v: string) => { bound[1](v); setLocalValue(v) }

  return <div style={{ marginBottom: 12 }}>
    {props.label && <label style={{
      display: 'block', fontSize: 13, fontWeight: 500,
      color: tc('--rk-text-secondary'), marginBottom: 4,
    }}>
      {props.label}
      {props.required && <span style={{ color: tc('--rk-error'), marginLeft: 2 }}>*</span>}
    </label>}
    <input
      type={props.inputType ?? 'text'}
      placeholder={props.placeholder}
      value={value}
      disabled={props.disabled}
      onChange={(e) => setValue(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', fontSize: 14,
        background: tc('--rk-bg-primary'), border: `1px solid ${props.error ? tc('--rk-error') : tc('--rk-border-subtle')}`,
        borderRadius: 6, color: tc('--rk-text-primary'), outline: 'none',
        boxSizing: 'border-box',
      }}
    />
    {(props.error || props.description) && <div style={{
      fontSize: 12, marginTop: 4,
      color: props.error ? tc('--rk-error') : tc('--rk-text-tertiary'),
    }}>
      {props.error || props.description}
    </div>}
  </div>
}
