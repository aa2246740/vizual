import { describe, it, expect } from 'vitest'
import { parseFeatureTableSchema } from '../parser'
import { renderFeatureTable } from '../renderer'

describe('Feature Table — Render Tests', () => {
  const fixture = {
    features: [
      { id: 'f1', name: '用户登录', priority: 'high', status: 'in-progress', description: '实现 OAuth 登录', assignee: '张三' },
      { id: 'f2', name: '支付集成', priority: 'medium', status: 'planned', description: '对接支付宝', assignee: '李四' },
      { id: 'f3', name: '数据导出', priority: 'low', status: 'completed', description: 'CSV/Excel 导出', assignee: '王五' },
    ],
  }

  it('renders correct number of feature rows', () => {
    const parsed = parseFeatureTableSchema(fixture)
    const container = renderFeatureTable(parsed)
    expect(container.querySelectorAll('[data-feature-id]').length).toBe(3)
  })

  it('renders feature names correctly', () => {
    const parsed = parseFeatureTableSchema(fixture)
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-feature-id="f1"] [data-field="name"]')?.textContent).toBe('用户登录')
  })

  it('renders priority badges', () => {
    const parsed = parseFeatureTableSchema(fixture)
    const container = renderFeatureTable(parsed)
    const highPriority = container.querySelector('[data-feature-id="f1"] [data-priority]')
    expect(highPriority?.textContent).toBe('高')
  })

  it('renders status badges', () => {
    const parsed = parseFeatureTableSchema(fixture)
    const container = renderFeatureTable(parsed)
    const status = container.querySelector('[data-feature-id="f1"] [data-status]')
    expect(status?.textContent).toBe('进行中')
  })

  it('renders assignees', () => {
    const parsed = parseFeatureTableSchema(fixture)
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-feature-id="f1"] [data-field="assignee"]')?.textContent).toBe('张三')
  })

  it('feature rows have priority data attribute', () => {
    const parsed = parseFeatureTableSchema(fixture)
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-feature-id="f1"]')?.getAttribute('data-priority')).toBe('high')
  })
})

describe('Feature Table — Fallback Tests', () => {
  it('null input shows fallback', () => {
    const parsed = parseFeatureTableSchema(null)
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('empty features array shows fallback', () => {
    const parsed = parseFeatureTableSchema({ features: [] })
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage input does not crash', () => {
    const parsed = parseFeatureTableSchema({ features: 'bad' } as any)
    expect(() => renderFeatureTable(parsed)).not.toThrow()
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('features with no valid items shows fallback', () => {
    const parsed = parseFeatureTableSchema({ features: [{ bad: 'item' }] })
    expect(parsed.fallback).toBe(true)
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('undefined input shows fallback', () => {
    const parsed = parseFeatureTableSchema(undefined)
    const container = renderFeatureTable(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
