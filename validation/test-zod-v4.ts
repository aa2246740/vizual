/**
 * Validate Zod v4 schema works for BarChart spec
 */
import { z } from 'zod'

const BarChartSchema = z.object({
  type: z.literal('bar'),
  x: z.string(),
  y: z.string(),
  data: z.array(z.record(z.unknown())),
})

// Test valid input
const valid = BarChartSchema.safeParse({
  type: 'bar',
  x: 'name',
  y: 'value',
  data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }],
})
console.log('Valid input:', valid.success ? 'PASS ✓' : 'FAIL ✗')

// Test invalid input (missing required field)
const invalid = BarChartSchema.safeParse({
  type: 'bar',
  x: 'name',
  // missing y and data
})
console.log('Invalid input rejected:', !invalid.success ? 'PASS ✓' : 'FAIL ✗')

if (!valid.success || invalid.success) {
  process.exit(1)
}
console.log('\nZod v4 validation: ALL PASS')
