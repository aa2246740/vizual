import React, { useEffect, useMemo, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss } from '../../core/theme-colors'
import type { ChoicePickerProps } from './schema'

type ChoicePickerArgs = {
  props: ChoicePickerProps
  bindings?: Record<string, string>
}

type NormalizedOption = { label: string; value: string }

function normalizeOptions(options: ChoicePickerProps['options']): NormalizedOption[] {
  return (options ?? []).map(o => typeof o === 'string' ? { label: o, value: o } : o)
}

export function ChoicePicker(args: ChoicePickerArgs) {
  if (args.bindings?.value) return <BoundChoicePicker {...args} />
  return <UnboundChoicePicker {...args} />
}

function BoundChoicePicker({ props, bindings }: ChoicePickerArgs) {
  const { label, options = [], value, mode = 'dropdown', disabled = false } = props
  const normalized = useMemo(() => normalizeOptions(options), [options])
  const fallbackValue = normalized[0]?.value ?? ''
  const [current, setCurrent] = useBoundProp<string>(value ?? fallbackValue, bindings!.value)

  return (
    <ChoicePickerInput
      label={label}
      normalized={normalized}
      current={current ?? fallbackValue}
      mode={mode}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function UnboundChoicePicker({ props }: ChoicePickerArgs) {
  const { label, options = [], value, mode = 'dropdown', disabled = false } = props
  const normalized = useMemo(() => normalizeOptions(options), [options])
  const fallbackValue = normalized[0]?.value ?? ''
  const [current, setCurrent] = useState(value ?? fallbackValue)

  useEffect(() => {
    setCurrent(value ?? fallbackValue)
  }, [fallbackValue, value])

  return (
    <ChoicePickerInput
      label={label}
      normalized={normalized}
      current={current}
      mode={mode}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function ChoicePickerInput({
  label,
  normalized,
  current,
  mode,
  disabled,
  onChange,
}: {
  label?: string
  normalized: NormalizedOption[]
  current: string
  mode: NonNullable<ChoicePickerProps['mode']>
  disabled: boolean
  onChange: (value: string) => void
}) {
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
              <input
                type="radio"
                checked={current === opt.value}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                style={{ accentColor: tcss('--rk-accent') }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      ) : (
        <select value={current} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)} style={{
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
