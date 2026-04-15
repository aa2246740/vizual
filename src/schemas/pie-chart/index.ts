import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parsePieChart } from './parser'
import { renderPieChart } from './renderer'
export { parsePieChart as parsePieChartSchema } from './parser'
export { renderPieChart }
export const PieChartSchema: SchemaHandler = {
  name: 'PieChartSchema',
  parse(input: unknown): ParsedSchema { return parsePieChart(input) },
  render(parsed: ParsedSchema): HTMLElement { return renderPieChart(parsed) },
}
