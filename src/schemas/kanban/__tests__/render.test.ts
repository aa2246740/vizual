import { describe, it, expect } from 'vitest'
import { parseKanbanSchema } from '../parser'
import { renderKanban } from '../renderer'

describe('Kanban Board — Render Tests', () => {
  const threeColumnsFixture = {
    input: {
      columns: [
        { id: 'todo', title: '待办', cards: [
          { id: 'card-1', content: '设计登录页面', labels: ['UI', 'Backend'] },
          { id: 'card-2', content: '集成支付API', labels: ['Backend'] },
        ]},
        { id: 'in-progress', title: '进行中', cards: [
          { id: 'card-3', content: '用户认证模块', labels: ['Security'] },
        ]},
        { id: 'done', title: '已完成', cards: [
          { id: 'card-4', content: '数据库架构设计', labels: ['Backend'] },
        ]},
      ],
    },
  }

  it('renders exactly 3 columns', () => {
    const parsed = parseKanbanSchema(threeColumnsFixture.input)
    const container = renderKanban(parsed)

    expect(container.querySelectorAll('[data-column]').length).toBe(3)
  })

  it('column titles are rendered correctly', () => {
    const parsed = parseKanbanSchema(threeColumnsFixture.input)
    const container = renderKanban(parsed)

    const todoTitle = container.querySelector('[data-column="todo"] [data-column-title]')
    expect(todoTitle?.textContent).toContain('待办')
  })

  it('card content matches input', () => {
    const parsed = parseKanbanSchema(threeColumnsFixture.input)
    const container = renderKanban(parsed)

    const card = container.querySelector('[data-card-id="card-1"]')
    expect(card?.querySelector('[data-card-content]')?.textContent).toContain('设计登录页面')
  })

  it('labels render with correct count', () => {
    const parsed = parseKanbanSchema(threeColumnsFixture.input)
    const container = renderKanban(parsed)

    const card1Labels = container.querySelectorAll('[data-card-id="card-1"] [data-label]')
    expect(card1Labels.length).toBe(2)
  })

  it('single card column renders correctly', () => {
    const fixture = {
      input: {
        columns: [
          { id: 'todo', title: '待办', cards: [
            { id: 'card-1', content: '仅有一个任务' },
          ]},
        ],
      },
    }
    const parsed = parseKanbanSchema(fixture.input)
    const container = renderKanban(parsed)

    expect(container.querySelectorAll('[data-column]').length).toBe(1)
    expect(container.querySelectorAll('[data-card-id]').length).toBe(1)
  })

  it('columns are in input order', () => {
    const parsed = parseKanbanSchema(threeColumnsFixture.input)
    const container = renderKanban(parsed)

    const columns = Array.from(container.querySelectorAll('[data-column]'))
    const ids = columns.map(el => el.getAttribute('data-column'))
    expect(ids).toEqual(['todo', 'in-progress', 'done'])
  })
})

describe('Kanban Board — Drag & Drop', () => {
  it('cards have draggable="true"', () => {
    const fixture = {
      input: {
        columns: [
          { id: 'todo', title: '待办', cards: [{ id: 'c1', content: 'Task' }] },
        ],
      },
    }
    const parsed = parseKanbanSchema(fixture.input)
    const container = renderKanban(parsed)

    const card = container.querySelector('[data-card-id="c1"]')
    expect(card?.getAttribute('draggable')).toBe('true')
  })
})

describe('Kanban Board — Fallback Tests', () => {
  it('no columns input shows fallback', () => {
    const parsed = parseKanbanSchema({})
    const container = renderKanban(parsed)

    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-column]').length).toBe(0)
  })

  it('empty columns array shows fallback', () => {
    const parsed = parseKanbanSchema({ columns: [] })
    const container = renderKanban(parsed)

    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('garbage columns input does not crash', () => {
    const parsed = parseKanbanSchema({ columns: 'not-an-array' } as any)
    expect(() => renderKanban(parsed)).not.toThrow()
    const container = renderKanban(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('null input shows fallback', () => {
    const parsed = parseKanbanSchema(null)
    const container = renderKanban(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })

  it('columns with invalid cards show fallback', () => {
    const parsed = parseKanbanSchema({
      columns: [{ id: 'test', title: 'Test', cards: [{ bad: 'card' }] }],
    } as any)
    expect(parsed.fallback).toBe(true)
    const container = renderKanban(parsed)
    expect(container.querySelector('[data-fallback="true"]')).not.toBeNull()
  })
})
