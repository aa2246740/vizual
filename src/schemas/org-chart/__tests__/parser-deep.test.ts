import { describe, it, expect } from 'vitest'
import { parseOrgChartSchema } from '../parser'

describe('Org Chart — Parser Deep Tests', () => {
  it('supports flat structure with people[] + reports[]', () => {
    const parsed = parseOrgChartSchema({
      root: { id: 'ceo', name: '张明' },
      people: [
        { id: 'ceo', name: '张明', title: 'CEO' },
        { id: 'cto', name: '李华', title: 'CTO', reports: ['ceo'] },
        { id: 'dev1', name: '王五', title: 'Engineer', reports: ['cto'] },
      ],
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.root.name).toBe('张明')
  })

  it('defaults missing title and department to empty string', () => {
    const parsed = parseOrgChartSchema({
      root: { name: '仅名字' },
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.root.title).toBe('')
    expect(parsed.root.department).toBe('')
  })

  it('defaults missing id to empty string', () => {
    const parsed = parseOrgChartSchema({
      root: { name: '无ID' },
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.root.id).toBe('')
  })

  it('handles nested children with missing fields gracefully', () => {
    const parsed = parseOrgChartSchema({
      root: {
        name: 'CEO',
        children: [
          { name: 'CTO' },
          { name: 'CFO' },
        ],
      },
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.root.children.length).toBe(2)
    expect(parsed.root.children[0].name).toBe('CTO')
  })

  it('filters out invalid children', () => {
    const parsed = parseOrgChartSchema({
      root: {
        name: 'CEO',
        children: [
          { name: 'CTO' },
          null,
          42,
          'invalid',
        ],
      },
    })
    expect(parsed.valid).toBe(true)
    expect(parsed.root.children.length).toBe(1)
  })

  it('returns invalid for root without name', () => {
    const parsed = parseOrgChartSchema({
      root: { id: 'x', title: 'Some Title' },
    })
    expect(parsed.valid).toBe(false)
    expect(parsed.fallback).toBe(true)
  })
})
