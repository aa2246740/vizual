import React, { useEffect, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss } from '../../core/theme-colors'
import type { TextFieldProps } from './schema'

type TextFieldArgs = {
  props: TextFieldProps
  bindings?: Record<string, string>
}

export function TextField(args: TextFieldArgs) {
  if (args.bindings?.value) return <BoundTextField {...args} />
  return <UnboundTextField {...args} />
}

function BoundTextField({ props, bindings }: TextFieldArgs) {
  const { placeholder = '', value = '', label, type = 'text', disabled = false } = props
  const [current, setCurrent] = useBoundProp<string>(String(value ?? ''), bindings!.value)

  return (
    <TextFieldInput
      label={label}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      value={String(current ?? '')}
      onChange={setCurrent}
    />
  )
}

function UnboundTextField({ props }: TextFieldArgs) {
  const { placeholder = '', value = '', label, type = 'text', disabled = false } = props
  const [current, setCurrent] = useState(value)

  useEffect(() => {
    setCurrent(value)
  }, [value])

  return (
    <TextFieldInput
      label={label}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      value={String(current ?? '')}
      onChange={setCurrent}
    />
  )
}

function TextFieldInput({
  label,
  type,
  placeholder,
  disabled,
  value,
  onChange,
}: {
  label?: string
  type: NonNullable<TextFieldProps['type']>
  placeholder: string
  disabled: boolean
  value: string
  onChange: (value: string) => void
}) {
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
        onChange={(event) => onChange(event.currentTarget.value)}
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
