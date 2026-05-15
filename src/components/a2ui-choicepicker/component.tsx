import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { ChoicePickerProps } from './schema'

export function ChoicePicker({ props }: { props: ChoicePickerProps }) {
  const { label, options = [], value, mode = 'dropdown' } = props
  const normalized = options.map(o => typeof o === 'string' ? { label: o, value: o } : o)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 500, color: tcss('--rk-text-secondary'), fontFamily: tcss('--rk-font-sans') }}>
          {label}
        </span>
      )}
      {mode === 'radio' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {normalized.map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: tcss('--rk-text-primary') }}>
              <input type="radio" checked={value === opt.value} readOnly style={{ accentColor: tcss('--rk-accent') }} />
              {opt.label}
            </label>
          ))}
        </div>
      ) : (
        <select value={value} disabled style={{
          padding: '8px 12px',
          border: `1px solid ${tcss('--rk-border')}`,
          borderRadius: 8,
          background: tcss('--rk-bg-primary'),
          color: tcss('--rk-text-primary'),
          fontSize: 14,
          fontFamily: tcss('--rk-font-sans'),
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {normalized.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
