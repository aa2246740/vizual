import { useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss, tc } from '../../core/theme-colors'
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
      display: 'block', fontSize:parseInt(tcss('--rk-text-base')), fontWeight:parseInt(tcss('--rk-weight-medium')),
      color: tcss('--rk-text-secondary'), marginBottom: 4,
    }}>
      {props.label}
      {props.required && <span style={{ color: tcss('--rk-error'), marginLeft: 2 }}>*</span>}
    </label>}
    <input
      type={props.inputType ?? 'text'}
      placeholder={props.placeholder}
      value={value}
      disabled={props.disabled}
      onChange={(e) => setValue(e.target.value)}
      style={{
        width: '100%', padding: '8px 12px', fontSize: parseInt(tcss('--rk-text-md')),
        lineHeight: '20px',
        background: tcss('--rk-bg-primary'), border: `1px solid ${props.error ? tcss('--rk-error') : tcss('--rk-border-subtle')}`,
        borderRadius: parseInt(tcss('--rk-radius-md')), color: tcss('--rk-text-primary'), outline: 'none',
        boxSizing: 'border-box',
      }}
    />
    {(props.error || props.description) && <div style={{
      fontSize:parseInt(tcss('--rk-text-sm')), marginTop: 4,
      color: props.error ? tcss('--rk-error') : tcss('--rk-text-tertiary'),
    }}>
      {props.error || props.description}
    </div>}
  </div>
}
