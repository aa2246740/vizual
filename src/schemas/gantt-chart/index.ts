import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseGanttChart } from './parser'
import { renderGanttChart } from './renderer'
export { parseGanttChart as parseGanttChartSchema } from './parser'
export { renderGanttChart }
export const GanttChartSchema: SchemaHandler = {
  name: 'GanttChartSchema',
  parse(input: unknown): ParsedSchema { return parseGanttChart(input) },
  render(parsed: ParsedSchema): HTMLElement { return renderGanttChart(parsed) },
}
