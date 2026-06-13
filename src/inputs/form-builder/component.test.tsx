import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { StateProvider, useStateStore } from '@json-render/react'
import { FormBuilder } from './component'
import { FormBuilderSchema } from './schema'

function BoundControlsForm() {
  const { get } = useStateStore()
  const controls = get('/controls') as Record<string, unknown>
  return (
    <FormBuilder
      props={{
        type: 'form_builder',
        value: controls,
        fields: [
          { name: 'points', label: 'Points', type: 'slider', min: 3, max: 12 },
          { name: 'mode', label: 'Mode', type: 'select', options: ['grouped', 'stacked'] },
          { name: 'stacked', label: 'Stacked', type: 'switch' },
          { name: 'brandColor', label: 'Brand', type: 'color' },
        ],
      }}
      bindings={{ value: '/controls' }}
    />
  )
}

describe('FormBuilder Schema', () => {
  const validForm = {
    type: 'form_builder',
    title: 'Contact Form',
    columns: 2,
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validation: [
          { rule: 'required', message: 'Email is required' },
          { rule: 'email', message: 'Invalid email' },
        ],
      },
      {
        name: 'department',
        label: 'Department',
        type: 'select',
        options: [
          { label: 'Engineering', value: 'eng' },
          { label: 'Design', value: 'design' },
        ],
        dependsOn: 'role',
        showWhen: 'manager',
      },
      {
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        validation: [
          { rule: 'maxLength', value: 500 },
        ],
      },
    ],
  }

  it('accepts valid form_builder spec', () => {
    const result = FormBuilderSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('accepts minimal form_builder with empty fields', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects wrong type', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_view',
      fields: [],
    })
    expect(result.success).toBe(false)
  })

  it('validates field type enum', () => {
    const valid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{ name: 'f1', type: 'text' }],
    })
    expect(valid.success).toBe(true)

    const invalid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{ name: 'f1', type: 'invalid_type' }],
    })
    expect(invalid.success).toBe(false)
  })

  it('validates validation rule enum', () => {
    const valid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{
        name: 'f1', type: 'text',
        validation: [{ rule: 'required' }, { rule: 'email' }, { rule: 'minLength', value: 3 }],
      }],
    })
    expect(valid.success).toBe(true)

    const invalid = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [{
        name: 'f1', type: 'text',
        validation: [{ rule: 'customValidator' }],
      }],
    })
    expect(invalid.success).toBe(false)
  })

  it('supports all field types', () => {
    const types = ['text', 'email', 'password', 'number', 'url', 'tel', 'select', 'file', 'textarea']
    for (const t of types) {
      const result = FormBuilderSchema.safeParse({
        type: 'form_builder',
        fields: [{ name: `field_${t}`, type: t }],
      })
      expect(result.success, `Field type "${t}" should be valid`).toBe(true)
    }
  })

  it('supports dependsOn and showWhen for conditional fields', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_builder',
      fields: [
        { name: 'role', type: 'select', options: [{ label: 'Manager', value: 'mgr' }] },
        { name: 'team', type: 'select', dependsOn: 'role', showWhen: 'mgr', options: [] },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a bindable value prop for live control state', () => {
    const result = FormBuilderSchema.safeParse({
      type: 'form_builder',
      value: { $bindState: '/controls' },
      fields: [
        { name: 'points', type: 'slider', min: 3, max: 12 },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('FormBuilder component', () => {
  it('works as a direct React component without json-render providers', () => {
    const { container } = render(
      <FormBuilder
        props={{
          type: 'form_builder',
          value: { points: 6, mode: 'grouped' },
          submitLabel: 'Apply',
          fields: [
            { name: 'points', label: 'Points', type: 'slider', min: 3, max: 12 },
            { name: 'mode', label: 'Mode', type: 'select', options: ['grouped', 'stacked'] },
          ],
        }}
      />,
    )

    fireEvent.change(container.querySelector('input[type="range"]')!, {
      target: { value: '10' },
    })
    fireEvent.change(container.querySelector('select')!, {
      target: { value: 'stacked' },
    })

    expect((container.querySelector('input[type="range"]') as HTMLInputElement).value).toBe('10')
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('stacked')
    expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy()
  })

  it('renders form controls and submit button for interactive fields', () => {
    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Apply changes',
            fields: [
              { name: 'points', label: 'Points', type: 'slider', min: 3, max: 12, defaultValue: 6 },
              { name: 'mode', label: 'Mode', type: 'select', options: ['grouped', 'stacked'], defaultValue: 'grouped' },
              { name: 'stacked', label: 'Stacked', type: 'switch', defaultValue: false },
              { name: 'brandColor', label: 'Brand', type: 'color', defaultValue: '#ff6b35' },
            ],
          }}
        />
      </StateProvider>,
    )

    expect(container.querySelector('form')).toBeTruthy()
    expect(container.querySelector('input[name="points"][type="range"]')).toBeTruthy()
    expect(container.querySelector('select[name="mode"]')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Stacked' }).getAttribute('data-field-name')).toBe('stacked')
    expect(container.querySelector('input[name="brandColor"][type="color"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeTruthy()
  })

  it('hides the submit button for live preview controls', () => {
    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            showSubmit: false,
            fields: [
              { name: 'threshold', label: 'Threshold', type: 'slider', min: 0, max: 100, defaultValue: 40 },
            ],
          }}
        />
      </StateProvider>,
    )

    expect(container.querySelector('input[name="threshold"][type="range"]')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders native date and time controls without forcing dark browser chrome', () => {
    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            fields: [
              { name: 'date', label: 'Date', type: 'date' },
              { name: 'time', label: 'Time', type: 'time' },
              { name: 'datetime', label: 'Date time', type: 'datetime' },
            ],
          }}
        />
      </StateProvider>,
    )

    const dateInput = container.querySelector('input[name="date"]') as HTMLInputElement
    const timeInput = container.querySelector('input[name="time"]') as HTMLInputElement
    const datetimeInput = container.querySelector('input[name="datetime"]') as HTMLInputElement

    expect(dateInput.type).toBe('date')
    expect(timeInput.type).toBe('time')
    expect(datetimeInput.type).toBe('datetime-local')
    expect(dateInput.style.colorScheme).toBe('')
    expect(timeInput.style.colorScheme).toBe('')
    expect(datetimeInput.style.colorScheme).toBe('')
    expect(container.textContent).not.toContain('Select a date')
    expect(container.textContent).not.toContain('Select time')
  })

  it('normalizes agent-style date defaults before required validation and submit', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Submit',
            fields: [
              { name: 'dueDate', label: 'Due date', type: 'date', required: true, defaultValue: '2026/06/02' },
            ],
            onSubmit,
          }}
        />
      </StateProvider>,
    )

    const dateInput = container.querySelector('input[name="dueDate"]') as HTMLInputElement
    expect(dateInput.value).toBe('2026-06-02')

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.queryByText('Due date is required')).toBeNull()
    expect(onSubmit).toHaveBeenCalledWith({ dueDate: '2026-06-02' })
  })

  it('writes bound form data into json-render state when controls change', () => {
    const onStateChange = vi.fn()
    const initialControls = {
      points: 6,
      mode: 'grouped',
      stacked: false,
      brandColor: '#ff6b35',
    }

    const { container } = render(
      <StateProvider initialState={{ controls: initialControls }} onStateChange={onStateChange}>
        <BoundControlsForm />
      </StateProvider>,
    )

    fireEvent.change(container.querySelector('input[type="range"]')!, {
      target: { value: '9' },
    })
    expect(onStateChange).toHaveBeenLastCalledWith([
      { path: '/controls', value: { ...initialControls, points: 9 } },
    ])

    fireEvent.change(container.querySelector('select')!, {
      target: { value: 'stacked' },
    })
    expect(onStateChange).toHaveBeenLastCalledWith([
      { path: '/controls', value: { ...initialControls, points: 9, mode: 'stacked' } },
    ])

    fireEvent.click(screen.getByRole('switch', { name: 'Stacked' }))
    expect(onStateChange).toHaveBeenLastCalledWith([
      { path: '/controls', value: { ...initialControls, points: 9, mode: 'stacked', stacked: true } },
    ])

    fireEvent.change(container.querySelector('input[type="color"]')!, {
      target: { value: '#3366ff' },
    })
    expect(onStateChange).toHaveBeenLastCalledWith([
      { path: '/controls', value: { ...initialControls, points: 9, mode: 'stacked', stacked: true, brandColor: '#3366ff' } },
    ])
  })

  it('submits validated form data through callback and action event', () => {
    const onSubmit = vi.fn()
    const emit = vi.fn()

    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Send',
            fields: [
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'name', label: 'Name', type: 'text' },
            ],
            onSubmit,
          }}
          emit={emit}
        />
      </StateProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
    expect(screen.getByText('Email is required')).toBeTruthy()

    fireEvent.change(container.querySelector('input[type="email"]')!, {
      target: { value: 'ai@example.com' },
    })
    fireEvent.change(container.querySelector('input[type="text"]')!, {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith({ email: 'ai@example.com', name: 'Ada' })
    expect(emit).toHaveBeenCalledWith('submit')
  })

  it('submits native DOM field values when browser automation updates controls without React change events', () => {
    const onSubmit = vi.fn()

    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Send',
            fields: [
              { name: 'actionPlan', label: 'Action plan', type: 'textarea' },
              { name: 'owner', label: 'Owner', type: 'text' },
              { name: 'windows', label: 'Windows', type: 'number' },
              { name: 'expectedEffect', label: 'Expected effect', type: 'text' },
            ],
            onSubmit,
          }}
        />
      </StateProvider>,
    )

    ;(container.querySelector('textarea[name="actionPlan"]') as HTMLTextAreaElement).value =
      'Fix B store stock within 48h'
    ;(container.querySelector('input[name="owner"]') as HTMLInputElement).value = 'Ops Manager Zhang'
    ;(container.querySelector('input[name="windows"]') as HTMLInputElement).value = '8'
    ;(container.querySelector('input[name="expectedEffect"]') as HTMLInputElement).value =
      'Stockout below 5%'

    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith({
      actionPlan: 'Fix B store stock within 48h',
      owner: 'Ops Manager Zhang',
      windows: 8,
      expectedEffect: 'Stockout below 5%',
    })
  })

  it('submits multi-checkbox option values through native form data', () => {
    const onSubmit = vi.fn()

    render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Send',
            fields: [
              {
                name: 'channels',
                label: 'Channels',
                type: 'checkbox',
                options: ['Web', 'Store'],
                defaultValue: ['Store'],
              },
            ],
            onSubmit,
          }}
        />
      </StateProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith({ channels: ['Store'] })
  })

  it('ignores declarative onSubmit objects and still emits the runtime submit event', () => {
    const emit = vi.fn()

    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Send',
            fields: [
              { name: 'owner', label: 'Owner', type: 'text' },
            ],
            onSubmit: { action: 'submitForm' },
          } as any}
          emit={emit}
        />
      </StateProvider>,
    )

    fireEvent.change(container.querySelector('input[name="owner"]')!, {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(emit).toHaveBeenCalledWith('submit')
  })

  it('keeps required select state aligned with the visible first option', () => {
    const onSubmit = vi.fn()

    render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Send',
            fields: [
              {
                name: 'metric',
                label: 'Metric',
                type: 'select',
                required: true,
                options: ['降低广告获客成本', '提升复购率'],
              },
            ],
            onSubmit,
          }}
        />
      </StateProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.queryByText('Metric is required')).toBeNull()
    expect(onSubmit).toHaveBeenCalledWith({ metric: '降低广告获客成本' })
  })

  it('keeps cleared number fields empty instead of coercing them to zero', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Send',
            fields: [
              { name: 'confidence', label: 'Confidence', type: 'number', defaultValue: 5 },
            ],
            onSubmit,
          }}
        />
      </StateProvider>,
    )

    const input = container.querySelector('input[name="confidence"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(input.value).toBe('')
    expect(onSubmit).toHaveBeenCalledWith({ confidence: '' })
  })

  it('rejects unchecked required checkbox fields', () => {
    const onSubmit = vi.fn()

    render(
      <StateProvider>
        <FormBuilder
          props={{
            type: 'form_builder',
            submitLabel: 'Agree',
            fields: [
              { name: 'agree', label: 'I agree', type: 'checkbox', required: true },
            ],
            onSubmit,
          }}
        />
      </StateProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Agree' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('I agree is required')).toBeTruthy()
  })
})
