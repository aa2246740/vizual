import React, { useEffect, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { tcss } from '../../core/theme-colors'
import type { SliderProps } from './schema'

type SliderArgs = {
  props: SliderProps
  bindings?: Record<string, string>
}

export function Slider(args: SliderArgs) {
  if (args.bindings?.value) return <BoundSlider {...args} />
  return <UnboundSlider {...args} />
}

function BoundSlider({ props, bindings }: SliderArgs) {
  const { label, min = 0, max = 100, value = 50, disabled = false } = props
  const step = getSliderStep(props)
  const [current, setCurrent] = useBoundProp<number>(Number(value ?? 50), bindings!.value)
  return (
    <SliderInput
      label={label}
      min={min}
      max={max}
      value={Number(current ?? value ?? 50)}
      step={step}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function UnboundSlider({ props }: SliderArgs) {
  const { label, min = 0, max = 100, value = 50, disabled = false } = props
  const step = getSliderStep(props)
  const [current, setCurrent] = useState(value)

  useEffect(() => {
    setCurrent(value)
  }, [value])

  return (
    <SliderInput
      label={label}
      min={min}
      max={max}
      value={Number(current ?? value ?? 50)}
      step={step}
      disabled={disabled}
      onChange={setCurrent}
    />
  )
}

function getSliderStep(props: SliderProps): number {
  const min = Number(props.min ?? 0)
  const max = Number(props.max ?? 100)
  if (typeof props.step === 'number' && Number.isFinite(props.step) && props.step > 0) return props.step
  if (typeof props.steps === 'number' && Number.isFinite(props.steps) && props.steps > 0 && max > min) {
    return (max - min) / props.steps
  }
  return 1
}

function SliderInput({
  label,
  min,
  max,
  value,
  step,
  disabled,
  onChange,
}: {
  label?: string
  min: number
  max: number
  value: number
  step: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  const updateCurrent = (event: React.FormEvent<HTMLInputElement>) => {
    onChange(Number(event.currentTarget.value))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tcss('--rk-text-secondary'), fontFamily: tcss('--rk-font-sans') }}>
          <span>{label}</span>
          <span>{value}</span>
        </div>
      )}
      <input type="range" min={min} max={max} value={value} step={step} disabled={disabled}
        onInput={updateCurrent}
        onChange={updateCurrent}
        style={{
        width: '100%', accentColor: tcss('--rk-accent'), opacity: disabled ? 0.5 : 1,
      }} />
    </div>
  )
}
