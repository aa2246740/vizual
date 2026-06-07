import React, { useEffect, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss } from '../../core/theme-colors'
import type { CheckBoxProps } from './schema'

type CheckBoxArgs = {
  props: CheckBoxProps
  bindings?: Record<string, string>
}

type NormalizedOption = { label: string; value: string }

function normalizeOptions(options: CheckBoxProps['options']): NormalizedOption[] {
  return (options ?? []).map(option => typeof option === 'string' ? { label: option, value: option } : option)
}

export function CheckBox(args: CheckBoxArgs) {
  const options = normalizeOptions(args.props.options)
  if (options.length > 0) {
    if (args.bindings?.value) return <BoundCheckBoxGroup {...args} options={options} />
    return <UnboundCheckBoxGroup {...args} options={options} />
  }
  if (args.bindings?.checked) return <BoundSingleCheckBox {...args} />
  return <UnboundSingleCheckBox {...args} />
}

function BoundSingleCheckBox({ props, bindings }: CheckBoxArgs) {
  const { label, checked = false, disabled = false } = props
  const [current, setCurrent] = useBoundProp<boolean>(checked, bindings!.checked)
  return <SingleCheckBox label={label} checked={Boolean(current)} disabled={disabled} onChange={setCurrent} />
}

function UnboundSingleCheckBox({ props }: CheckBoxArgs) {
  const { label, checked = false, disabled = false } = props
  const [current, setCurrent] = useState(checked)

  useEffect(() => {
    setCurrent(checked)
  }, [checked])

  return <SingleCheckBox label={label} checked={current} disabled={disabled} onChange={setCurrent} />
}

function SingleCheckBox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      color: tcss('--rk-text-primary'), fontSize: 14,
      fontFamily: tcss('--rk-font-sans'),
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        style={{ accentColor: tcss('--rk-accent'), width: 16, height: 16 }} />
      {label}
    </label>
  )
}

function BoundCheckBoxGroup({ props, bindings, options }: CheckBoxArgs & { options: NormalizedOption[] }) {
  const { label, value = [], disabled = false } = props
  const [current, setCurrent] = useBoundProp<string[]>(Array.isArray(value) ? value : [], bindings!.value)
  return (
    <CheckBoxGroup
      label={label}
      options={options}
      value={Array.isArray(current) ? current : []}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function UnboundCheckBoxGroup({ props, options }: CheckBoxArgs & { options: NormalizedOption[] }) {
  const { label, value = [], disabled = false } = props
  const [current, setCurrent] = useState<string[]>(Array.isArray(value) ? value : [])

  useEffect(() => {
    setCurrent(Array.isArray(value) ? value : [])
  }, [value])

  return <CheckBoxGroup label={label} options={options} value={current} disabled={disabled} onChange={setCurrent} />
}

function CheckBoxGroup({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  label: string
  options: NormalizedOption[]
  value: string[]
  disabled: boolean
  onChange: (value: string[]) => void
}) {
  const selected = new Set(value)
  const toggle = (optionValue: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(optionValue)
    else next.delete(optionValue)
    onChange(Array.from(next))
  }

  return (
    <fieldset style={{
      border: 0,
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      color: tcss('--rk-text-primary'),
      fontFamily: tcss('--rk-font-sans'),
      opacity: disabled ? 0.5 : 1,
      minWidth: 0,
    }}>
      <legend style={{ fontSize: 12, fontWeight: 500, color: tcss('--rk-text-secondary'), padding: 0, marginBottom: 2 }}>
        {label}
      </legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
        {options.map(option => (
          <label key={option.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              disabled={disabled}
              onChange={(event) => toggle(option.value, event.currentTarget.checked)}
              style={{ accentColor: tcss('--rk-accent'), width: 16, height: 16 }}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
