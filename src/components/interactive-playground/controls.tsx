import React from 'react'
import type { Control } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/** 通用标签样式 */
const labelStyle: React.CSSProperties = {
  fontSize: parseInt(tc('--rk-text-sm')),
  color: tcss('--rk-text-secondary'),
  marginBottom: 4,
  display: 'block',
  fontWeight: parseInt(tc('--rk-weight-medium')),
}

/** 通用控件容器 */
const controlContainerStyle: React.CSSProperties = {
  marginBottom: 12,
}

/** 通用输入框基础样式 */
const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: parseInt(tc('--rk-text-sm')),
  background: tcss('--rk-bg-primary'),
  border: `1px solid ${tcss('--rk-border-subtle')}`,
  borderRadius: parseInt(tc('--rk-radius-md')),
  color: tcss('--rk-text-primary'),
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
}

/** Slider 控件 */
function SliderControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'slider' }>
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={controlContainerStyle}>
      <label style={labelStyle}>
        {control.label}: {value}
      </label>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: tcss('--rk-accent'), cursor: 'pointer' }}
      />
    </div>
  )
}

/** Select 控件 */
function SelectControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'select' }>
  value: string
  onChange: (v: string) => void
}) {
  const options = control.options
  const values = control.values
  return (
    <div style={controlContainerStyle}>
      <label style={labelStyle}>{control.label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase, cursor: 'pointer' }}
      >
        {options.map((opt, i) => (
          <option key={i} value={values?.[i] ?? opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

/** Toggle 控件 */
function ToggleControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'toggle' }>
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ ...controlContainerStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={labelStyle}>{control.label}</span>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: value ? tcss('--rk-accent') : tcss('--rk-bg-tertiary'),
          position: 'relative', cursor: 'pointer', transition: 'background .2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: value ? 20 : 2,
          transition: 'left .2s',
        }} />
      </div>
    </div>
  )
}

/** Color 控件 */
function ColorControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'color' }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={controlContainerStyle}>
      <label style={labelStyle}>{control.label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={value || '#667eea'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
        />
        <span style={{ fontSize: parseInt(tc('--rk-text-sm')), color: tcss('--rk-text-tertiary') }}>{value}</span>
      </div>
    </div>
  )
}

/** Text 控件 */
function TextControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'text' }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={controlContainerStyle}>
      <label style={labelStyle}>{control.label}</label>
      <input
        type="text"
        value={value}
        placeholder={control.placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputBase}
      />
    </div>
  )
}

/** Number 控件 */
function NumberControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'number' }>
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={controlContainerStyle}>
      <label style={labelStyle}>{control.label}</label>
      <input
        type="number"
        value={value}
        min={control.min}
        max={control.max}
        step={control.step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputBase}
      />
    </div>
  )
}

/** ButtonGroup 控件 */
function ButtonGroupControl({ control, value, onChange }: {
  control: Extract<Control, { type: 'buttonGroup' }>
  value: string
  onChange: (v: string) => void
}) {
  const options = control.options
  const values = control.values
  return (
    <div style={controlContainerStyle}>
      <label style={labelStyle}>{control.label}</label>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map((opt, i) => {
          const val = values?.[i] ?? opt
          const active = value === val
          return (
            <button
              key={i}
              onClick={() => onChange(val)}
              style={{
                padding: '4px 12px',
                borderRadius: parseInt(tc('--rk-radius-md')),
                border: `1px solid ${active ? tcss('--rk-accent') : tcss('--rk-border-subtle')}`,
                background: active ? tcss('--rk-accent') : tcss('--rk-bg-primary'),
                color: active ? '#fff' : tcss('--rk-text-secondary'),
                fontSize: parseInt(tc('--rk-text-sm')),
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** 控件路由器：根据 control.type 渲染对应控件 */
export function ControlRenderer({ control, value, onChange }: {
  control: Control
  value: unknown
  onChange: (v: unknown) => void
}) {
  switch (control.type) {
    case 'slider':
      return <SliderControl control={control} value={value as number} onChange={onChange} />
    case 'select':
      return <SelectControl control={control} value={(value as string) || control.options[0]} onChange={onChange} />
    case 'toggle':
      return <ToggleControl control={control} value={value as boolean} onChange={onChange} />
    case 'color':
      return <ColorControl control={control} value={(value as string) || '#667eea'} onChange={onChange} />
    case 'text':
      return <TextControl control={control} value={(value as string) || ''} onChange={onChange} />
    case 'number':
      return <NumberControl control={control} value={value as number} onChange={onChange} />
    case 'buttonGroup':
      return <ButtonGroupControl control={control} value={(value as string) || control.options[0]} onChange={onChange} />
    default:
      return null
  }
}
