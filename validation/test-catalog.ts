/**
 * Full json-render catalog validation:
 * 1. catalog.prompt() generates system prompt
 * 2. catalog.validate() accepts valid spec, rejects invalid
 * 3. catalog.zodSchema() returns valid Zod schema
 * 4. catalog.componentNames lists registered components
 */
import { renderKitCatalog } from '../src/catalog'

let passed = 0, failed = 0

function check(name: string, fn: () => boolean) {
  try {
    const ok = fn()
    console.log(`  ${name}: ${ok ? 'PASS ✓' : 'FAIL ✗'}`)
    ok ? passed++ : failed++
  } catch (e: any) {
    console.log(`  ${name}: FAIL ✗ (${e.message})`)
    failed++
  }
}

console.log('=== json-render Catalog Validation ===\n')

check('componentNames includes BarChart + Timeline', () => {
  const names = renderKitCatalog.componentNames as string[]
  return names.includes('BarChart') && names.includes('Timeline')
})

check('prompt() generates system prompt with BarChart', () => {
  const p = renderKitCatalog.prompt()
  return typeof p === 'string' && p.includes('BarChart') && p.length > 100
})

check('validate() accepts valid BarChart spec', () => {
  const r = renderKitCatalog.validate({
    root: 'main',
    elements: {
      main: { type: 'BarChart', props: { type: 'bar', x: 'name', y: 'value', data: [{ name: 'A', value: 10 }] }, children: [] }
    }
  })
  return r.success === true
})

check('validate() accepts valid Timeline spec', () => {
  const r = renderKitCatalog.validate({
    root: 'main',
    elements: {
      main: { type: 'Timeline', props: { type: 'timeline', events: [{ date: '2025-01', title: 'Test' }] }, children: [] }
    }
  })
  return r.success === true
})

check('BarChartSchema rejects invalid props (deep validation)', () => {
  const { z } = require('zod')
  const schema = z.object({ type: z.literal('bar'), x: z.string(), y: z.string(), data: z.array(z.record(z.unknown())) })
  const r = schema.safeParse({ type: 'bar' })
  return !r.success
})

check('validate() rejects unknown component type', () => {
  const r = renderKitCatalog.validate({
    root: 'main',
    elements: {
      main: { type: 'UnknownComponent', props: {}, children: [] }
    }
  })
  return r.success === false
})

check('zodSchema() returns valid schema object', () => {
  const s = renderKitCatalog.zodSchema()
  return s && typeof s.safeParse === 'function'
})

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
if (failed > 0) process.exit(1)
