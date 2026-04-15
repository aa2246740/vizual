import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseLineChart } from './parser'
import { renderLineChart } from './renderer'
export { parseLineChart as parseLineChartSchema } from './parser'
export { renderLineChart }
export const LineChartSchema: SchemaHandler = {
  name: 'LineChartSchema',
  parse(input: unknown): ParsedSchema { return parseLineChart(input) },
  render(parsed: ParsedSchema): HTMLElement { return renderLineChart(parsed) },
}
