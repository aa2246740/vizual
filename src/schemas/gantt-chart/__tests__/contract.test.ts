import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Gantt Chart — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  const validFixture = {
    title: '项目进度',
    tasks: [
      { id: 't1', name: '需求调研', startDate: '2026-04-01', endDate: '2026-04-05', progress: 100, status: 'completed' },
      { id: 't2', name: '架构设计', startDate: '2026-04-06', endDate: '2026-04-10', progress: 60, status: 'in-progress', assignee: '张三' },
      { id: 't3', name: '开发实现', startDate: '2026-04-11', endDate: '2026-04-20', progress: 0, status: 'pending' },
      { id: 't4', name: '测试上线', startDate: '2026-04-21', endDate: '2026-04-25', progress: 20, status: 'delayed' },
    ],
  }

  it('valid fixture conforms to schema', () => {
    expect(validate(validFixture)).toBe(true)
  })

  it('title is optional', () => {
    expect(validate({ tasks: validFixture.tasks })).toBe(true)
  })

  it('missing tasks fails validation', () => {
    expect(validate({ title: 'No tasks' })).toBe(false)
    expect(validate.errors?.[0].keyword).toBe('required')
  })

  it('tasks must be array', () => {
    expect(validate({ tasks: 'string' })).toBe(false)
  })

  it('task missing id fails', () => {
    expect(validate({
      tasks: [{ name: 'T', startDate: '2026-04-01', endDate: '2026-04-05', status: 'pending' }],
    })).toBe(false)
  })

  it('task missing name fails', () => {
    expect(validate({
      tasks: [{ id: 't1', startDate: '2026-04-01', endDate: '2026-04-05', status: 'pending' }],
    })).toBe(false)
  })

  it('task missing startDate fails', () => {
    expect(validate({
      tasks: [{ id: 't1', name: 'T', endDate: '2026-04-05', status: 'pending' }],
    })).toBe(false)
  })

  it('task missing endDate fails', () => {
    expect(validate({
      tasks: [{ id: 't1', name: 'T', startDate: '2026-04-01', status: 'pending' }],
    })).toBe(false)
  })

  it('task missing status fails', () => {
    expect(validate({
      tasks: [{ id: 't1', name: 'T', startDate: '2026-04-01', endDate: '2026-04-05' }],
    })).toBe(false)
  })

  it('invalid status enum fails', () => {
    expect(validate({
      tasks: [{ id: 't1', name: 'T', startDate: '2026-04-01', endDate: '2026-04-05', status: 'unknown' }],
    })).toBe(false)
  })

  it('progress is optional', () => {
    // schema.json doesn't list progress as required, only as optional property
    const fixture = {
      tasks: [{ id: 't1', name: 'T', startDate: '2026-04-01', endDate: '2026-04-05', status: 'pending' }],
    }
    expect(validate(fixture)).toBe(true)
  })

  it('assignee is optional', () => {
    expect(validate(validFixture)).toBe(true)
    // All tasks except t2 have no assignee — still valid
  })

  it('empty tasks array is valid schema', () => {
    expect(validate({ tasks: [] })).toBe(true)
  })

  it('all four statuses are valid', () => {
    const statuses = ['completed', 'in-progress', 'pending', 'delayed']
    for (const status of statuses) {
      const fixture = {
        tasks: [{ id: 't', name: 'T', startDate: '2026-04-01', endDate: '2026-04-05', status }],
      }
      expect(validate(fixture)).toBe(true)
    }
  })
})
