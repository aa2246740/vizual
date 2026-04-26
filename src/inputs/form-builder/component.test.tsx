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
})
