import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { TextFieldProps } from './schema'

export function TextField({ props }: { props: TextFieldProps }) {
  const { placeholder = '', value = '', label, type = 'text', disabled = false } = props
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 500, color: tcss('--rk-text-secondary'), fontFamily: tcss('--rk-font-sans') }}>
          {label}
        </span>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        style={{
          padding: '8px 12px',
          border: `1px solid ${tcss('--rk-border')}`,
          borderRadius: 8,
          background: tcss('--rk-bg-primary'),
          color: tcss('--rk-text-primary'),
          fontSize: 14,
          fontFamily: tcss('--rk-font-sans'),
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
