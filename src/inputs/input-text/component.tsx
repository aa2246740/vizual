import { useState } from 'react'
import { useBoundProp } from '@json-render/react'
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
      color: 'var(--rk-text-secondary,#888)', marginBottom: 4,
    }}>
      {props.label}
      {props.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>}
    <input
      type={props.inputType ?? 'text'}
      placeholder={props.placeholder}
      value={value}
      disabled={props.disabled}
      onChange={(e) => setValue(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', fontSize: 14,
        background: '#111', border: `1px solid ${props.error ? '#ef4444' : '#2a2a2a'}`,
        borderRadius: 6, color: '#e5e5e5', outline: 'none',
        boxSizing: 'border-box',
      }}
    />
    {(props.error || props.description) && <div style={{
      fontSize: 12, marginTop: 4,
      color: props.error ? '#ef4444' : '#666',
    }}>
      {props.error || props.description}
    </div>}
  </div>
}
