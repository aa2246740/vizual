import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { DateTimeInputProps } from './schema'

const inputTypeMap: Record<string, string> = {
  date: 'date', time: 'time', datetime: 'datetime-local',
}

export function DateTimeInput({ props }: { props: DateTimeInputProps }) {
  const { label, value, mode = 'date' } = props
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 500, color: tcss('--rk-text-secondary'), fontFamily: tcss('--rk-font-sans') }}>
          {label}
        </span>
      )}
      <input type={inputTypeMap[mode] || 'date'} value={value} readOnly style={{
        padding: '8px 12px',
        border: `1px solid ${tcss('--rk-border')}`,
        borderRadius: 8,
        background: tcss('--rk-bg-primary'),
        color: tcss('--rk-text-primary'),
        fontSize: 14,
        fontFamily: tcss('--rk-font-sans'),
        width: '100%',
        boxSizing: 'border-box',
      }} />
    </div>
  )
}
