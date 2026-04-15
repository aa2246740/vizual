import type { ParsedSchema } from '../../core/types'
import type { FormViewParsed } from './parser'

export function renderFormView(parsed: ParsedSchema): HTMLElement {
  const form = parsed as FormViewParsed

  if (!form.valid || form.fields.length === 0) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'form-view'
  wrapper.setAttribute('data-schema', 'form-view')

  const titleEl = document.createElement('div')
  titleEl.className = 'form-title'
  titleEl.setAttribute('data-field', 'title')
  titleEl.textContent = form.title
  wrapper.appendChild(titleEl)

  for (const field of form.fields) {
    const fieldEl = document.createElement('div')
    fieldEl.className = 'form-field'
    fieldEl.setAttribute('data-field-type', field.type)

    const labelEl = document.createElement('div')
    labelEl.className = 'form-label'
    labelEl.setAttribute('data-label', field.label)
    labelEl.textContent = field.label
    fieldEl.appendChild(labelEl)

    const valueEl = document.createElement('div')
    valueEl.className = 'form-value'
    valueEl.setAttribute('data-value', '')
    if (field.type === 'boolean') {
      valueEl.textContent = field.value ? '✓ 是' : '✗ 否'
      valueEl.setAttribute('data-boolean', String(!!field.value))
    } else {
      valueEl.textContent = field.value !== undefined && field.value !== null ? String(field.value) : ''
    }
    fieldEl.appendChild(valueEl)

    wrapper.appendChild(fieldEl)
  }

  return wrapper
}
