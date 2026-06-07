import React, { useEffect, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss } from '../../core/theme-colors'
import type { DateTimeInputProps } from './schema'

const inputTypeMap: Record<string, string> = {
  date: 'date', time: 'time', datetime: 'datetime-local',
}

type DateTimeInputArgs = {
  props: DateTimeInputProps
  bindings?: Record<string, string>
}

export function DateTimeInput(args: DateTimeInputArgs) {
  if (args.bindings?.value) return <BoundDateTimeInput {...args} />
  return <UnboundDateTimeInput {...args} />
}

function BoundDateTimeInput({ props, bindings }: DateTimeInputArgs) {
  const { label, value = '', mode = 'date', disabled = false } = props
  const [current, setCurrent] = useBoundProp<string>(value, bindings!.value)
  return (
    <DateTimeInputControl
      label={label}
      value={current ?? ''}
      mode={mode}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function UnboundDateTimeInput({ props }: DateTimeInputArgs) {
  const { label, value = '', mode = 'date', disabled = false } = props
  const [current, setCurrent] = useState(value)

  useEffect(() => {
    setCurrent(value)
  }, [value])

  return (
    <DateTimeInputControl
      label={label}
      value={current}
      mode={mode}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function DateTimeInputControl({
  label,
  value,
  mode,
  disabled,
  onChange,
}: {
  label?: string
  value: string
  mode: NonNullable<DateTimeInputProps['mode']>
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
      <input type={inputTypeMap[mode] || 'date'} value={value} disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
        padding: '8px 12px',
        border: `1px solid ${tcss('--rk-border')}`,
        borderRadius: 8,
        background: tcss('--rk-bg-primary'),
        color: tcss('--rk-text-primary'),
        fontSize: 14,
        fontFamily: tcss('--rk-font-sans'),
        width: '100%',
        boxSizing: 'border-box',
        opacity: disabled ? 0.5 : 1,
      }} />
    </div>
  )
}
