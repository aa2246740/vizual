import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseBarChart } from './parser'
import { renderBarChart } from './renderer'
export { parseBarChart as parseBarChartSchema } from './parser'
export { renderBarChart }
export const BarChartSchema: SchemaHandler = {
  name: 'BarChartSchema',
  parse(input: unknown): ParsedSchema { return parseBarChart(input) },
  render(parsed: ParsedSchema): HTMLElement { return renderBarChart(parsed) },
}
