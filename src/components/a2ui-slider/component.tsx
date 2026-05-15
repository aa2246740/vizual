import React from 'react'
import { tcss } from '../../core/theme-colors'
import type { SliderProps } from './schema'

export function Slider({ props }: { props: SliderProps }) {
  const { label, min = 0, max = 100, value = 50, step = 1 } = props
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tcss('--rk-text-secondary'), fontFamily: tcss('--rk-font-sans') }}>
          <span>{label}</span>
          <span>{value}</span>
        </div>
      )}
      <input type="range" min={min} max={max} value={value} step={step} readOnly style={{
        width: '100%', accentColor: tcss('--rk-accent'),
      }} />
    </div>
  )
}
