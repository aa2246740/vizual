import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import schema from '../schema.json'

describe('Org Chart — Contract Tests', () => {
  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(schema)

  it('valid org-chart fixture conforms to schema', () => {
    const fixture = {
      root: {
        name: '张总',
        title: 'CEO',
        department: '总裁办',
        children: [
          { name: '李副总', title: 'CTO', department: '技术部', children: [] },
          { name: '王总监', title: 'CFO', department: '财务部', children: [] },
        ],
      },
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('missing root fails validation', () => {
    const fixture = { data: 'irrelevant' }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('root missing required name fails', () => {
    const fixture = { root: { title: 'CEO' } }
    const valid = validate(fixture)
    expect(valid).toBe(false)
  })

  it('deeply nested org chart validates', () => {
    const fixture = {
      root: {
        name: 'CEO',
        children: [
          {
            name: 'VP',
            children: [
              { name: 'Manager', children: [{ name: 'Engineer' }] },
            ],
          },
        ],
      },
    }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })

  it('minimal valid org chart', () => {
    const fixture = { root: { name: 'CEO' } }
    const valid = validate(fixture)
    expect(valid).toBe(true)
  })
})
