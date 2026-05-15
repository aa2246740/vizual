import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { CheckBoxProps } from './schema'

export function CheckBox({ props }: { props: CheckBoxProps }) {
  const { label, checked = false, disabled = false } = props
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      color: tcss('--rk-text-primary'), fontSize: 14,
      fontFamily: tcss('--rk-font-sans'),
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <input type="checkbox" checked={checked} disabled={disabled} readOnly
        style={{ accentColor: tcss('--rk-accent'), width: 16, height: 16 }} />
      {label}
    </label>
  )
}
